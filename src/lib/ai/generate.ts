// src/lib/ai/generate.ts
// Optimised — smart model routing per vertical.
//
// Routing logic:
//   Presentation OR executive tone  → Sonnet  (complex creative output)
//   Everything else                 → Haiku   (~4× cheaper, same quality for structured JSON)
//
// max_tokens is now sized per vertical instead of a flat 4000.
// All types, interfaces, and DB logging are fully preserved.

import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Pricing ───────────────────────────────────────────────────────────────────
const MODEL_PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
  'claude-sonnet-4-5':           { inputPerM: 3.0,  outputPerM: 15.0 },
  'claude-haiku-4-5-20251001':   { inputPerM: 0.80, outputPerM: 4.0  },
  'claude-opus-4-6':             { inputPerM: 15.0, outputPerM: 75.0 },
  'claude-sonnet-4-6':           { inputPerM: 3.0,  outputPerM: 15.0 },
}

export function calcCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] ?? { inputPerM: 3.0, outputPerM: 15.0 }
  return (inputTokens / 1_000_000) * pricing.inputPerM +
         (outputTokens / 1_000_000) * pricing.outputPerM
}

export async function getUsdToInr(): Promise<number> {
  try {
    const s = await db.adminSettings.findUnique({ where: { id: 'singleton' } })
    return s?.usdToInr ?? 84.0
  } catch {
    return 84.0
  }
}

// ── Types (unchanged — no breaking changes) ───────────────────────────────────

export type SlideLayoutType =
  | 'hero' | 'split-left' | 'split-right' | 'stats'
  | 'bullets' | 'quote' | 'grid' | 'title-only'

export interface RichSlide {
  layoutType: SlideLayoutType
  heading: string
  subheading?: string
  body?: string
  imageQuery?: string
  bullets?: string[]
  stats?: Array<{ value: string; label: string }>
  quote?: string
  attribution?: string
  cards?: Array<{ title: string; body: string }>
  accentOverride?: string
}

export interface BrandOutput {
  headline: string
  tagline: string
  bio: string
  skills: string[]
  cta: string
  heroImageQuery?: string
  workImageQueries?: string[]
  portfolioSections: Array<{ title: string; body: string; highlight: string }>
  resumeBullets: string[]
  cardName: string
  cardTitle: string
  presentationHook: string
  presentationTheme?: 'noir' | 'corporate' | 'minimal' | 'bold' | 'warm' | 'ocean'
  presentationFontPair?: 'georgia-arial' | 'playfair-lato' | 'montserrat-opensans' | 'dmserif-karla' | 'raleway-mulish'
  presentationSlides: RichSlide[]
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  model: string
  costUsd: number
  costInr: number
}

// ── Model routing ─────────────────────────────────────────────────────────────
// Rules:
//   - presentation in prompt → Sonnet (slide content needs richer creativity)
//   - executive tone in prompt → Sonnet (authoritative language benefits from larger model)
//   - everything else → Haiku (card, resume bullets, portfolio copy: structured JSON, no quality diff)
//
// This single function is the only place you ever need to change model decisions.

function routeModel(prompt: string): { model: string; maxTokens: number } {
  const hasPresentation = prompt.includes('presentationSlides')
  const isExecutive     = prompt.includes('Tone: executive')

  if (hasPresentation) {
    // Slide count drives token need — extract it from the prompt if possible
    const match = prompt.match(/Exactly (\d+) slides/)
    const slideCount = match ? parseInt(match[1], 10) : 8
    return {
      model: 'claude-sonnet-4-5',
      maxTokens: Math.min(400 + slideCount * 250, 5000), // ~250 tokens per slide
    }
  }

  if (isExecutive) {
    return { model: 'claude-sonnet-4-5', maxTokens: 1800 }
  }

  // Haiku for everything else: card, resume, portfolio, mixed non-exec
  // Haiku handles structured JSON output identically to Sonnet
  const hasPortfolio = prompt.includes('portfolioSections')
  const hasResume    = prompt.includes('resumeBullets')
  const hasCard      = prompt.includes('cardName')

  let maxTokens = 400 // base (headline, tagline, bio, skills, cta)
  if (hasPortfolio) maxTokens += 700
  if (hasResume)    maxTokens += 300
  if (hasCard)      maxTokens += 100

  return { model: 'claude-haiku-4-5-20251001', maxTokens }
}

// ── Core Claude caller ────────────────────────────────────────────────────────

async function callClaude(
  prompt: string,
  attempt = 0,
): Promise<{ output: BrandOutput; usage: TokenUsage }> {
  const { model, maxTokens } = routeModel(prompt)

  // On 5th attempt (severe overload) always fall to Haiku regardless of vertical
  const resolvedModel = attempt >= 4 ? 'claude-haiku-4-5-20251001' : model

  try {
    const response = await client.messages.create({
      model: resolvedModel,
      max_tokens: maxTokens,
      system:
        'You are a world-class personal brand copywriter and career strategist. ' +
        'You create compelling, authentic personal brand content that helps professionals stand out. ' +
        'Always respond with valid JSON only — no markdown, no explanation, no preamble.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    const clean  = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const output = JSON.parse(clean) as BrandOutput

    const inputTokens  = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const totalTokens  = inputTokens + outputTokens
    const costUsd      = calcCostUsd(resolvedModel, inputTokens, outputTokens)
    const usdToInr     = await getUsdToInr()

    return {
      output,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        model: resolvedModel,
        costUsd,
        costInr: costUsd * usdToInr,
      },
    }
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string }
    const isOverloaded =
      error?.status === 529 ||
      error?.message?.toLowerCase().includes('overloaded')

    if (attempt < 5 && isOverloaded) {
      const delay = Math.pow(2, attempt + 1) * 1000
      console.log(`Anthropic overloaded (attempt ${attempt + 1}/5). Retrying in ${delay}ms…`)
      await new Promise(r => setTimeout(r, delay))
      return callClaude(prompt, attempt + 1)
    }
    throw err
  }
}

// ── Public API (signature unchanged) ─────────────────────────────────────────

export async function generateBrandContent(
  prompt: string,
  userId?: string,
  generationId?: string,
): Promise<{ output: BrandOutput; tokenCount: number; usage: TokenUsage }> {
  const { output, usage } = await callClaude(prompt)

  // DB logging — fire and forget (unchanged)
  db.apiCallLog.create({
    data: {
      service:      'claude',
      userId:       userId       ?? null,
      model:        usage.model,
      inputTokens:  usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens:  usage.totalTokens,
      costUsd:      usage.costUsd,
      costInr:      usage.costInr,
      generationId: generationId ?? null,
      success:      true,
    },
  }).catch(e => console.error('[ApiCallLog] Failed to log Claude call:', e))

  return { output, tokenCount: usage.totalTokens, usage }
}
