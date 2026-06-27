// src/lib/ai/generate.ts
// Smart model routing per vertical.
//
// Routing logic:
//   Executive tone  → Sonnet  (authoritative language benefits from larger model)
//   Everything else → Haiku   (~4× cheaper, same quality for structured JSON)
//
// max_tokens is sized per vertical.

import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import { createAnthropicMessage } from '@/lib/ai/anthropic-fallback'
import { extractAIText, parseAIJson } from '@/lib/ai/safe-json'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Pricing ───────────────────────────────────────────────────────────────────
const MODEL_PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
  'claude-sonnet-4-5':           { inputPerM: 3.0,  outputPerM: 15.0 },
  'claude-3-5-sonnet-latest':    { inputPerM: 3.0,  outputPerM: 15.0 },
  'claude-3-5-haiku-latest':     { inputPerM: 0.80, outputPerM: 4.0  },
  'claude-haiku-4-5-20251001':   { inputPerM: 0.80, outputPerM: 4.0  },
  'claude-opus-4-6':             { inputPerM: 15.0, outputPerM: 75.0 },
  'claude-sonnet-4-6':           { inputPerM: 3.0,  outputPerM: 15.0 },
  // Legacy model strings used in generate-strategy, generate-calendar, generate-website/stream
  'claude-sonnet-4-20250514':    { inputPerM: 3.0,  outputPerM: 15.0 },
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

// ── Types ─────────────────────────────────────────────────────────────────────

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
// Executive tone → Sonnet; everything else → Haiku.

function routeModel(prompt: string): { model: string; maxTokens: number } {
  const isExecutive = prompt.includes('Tone: executive')

  if (isExecutive) {
    return { model: process.env.CLAUDE_PERSONAL_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-5', maxTokens: 1800 }
  }

  // Haiku for everything else: card, resume, portfolio, mixed non-exec
  const hasPortfolio = prompt.includes('portfolioSections')
  const hasResume    = prompt.includes('resumeBullets')
  const hasCard      = prompt.includes('cardName')

  let maxTokens = 400 // base (headline, tagline, bio, skills, cta)
  if (hasPortfolio) maxTokens += 700
  if (hasResume)    maxTokens += 300
  if (hasCard)      maxTokens += 100

  return { model: process.env.CLAUDE_PERSONAL_HAIKU_MODEL || process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001', maxTokens }
}


function buildFallbackBrandOutput(prompt: string): BrandOutput {
  const nameMatch = prompt.match(/Name:\s*([^\n]+)/i) || prompt.match(/name["']?\s*[:=]\s*["']?([^\n"']+)/i)
  const name = (nameMatch?.[1] || 'Your Brand').trim().slice(0, 60)
  return {
    headline: `${name} — Built to Stand Out`,
    tagline: 'Clear identity. Better trust. Stronger response.',
    bio: `${name} presents a sharper and more trustworthy brand experience with clear messaging, strong proof and direct calls to action.`,
    skills: ['Brand positioning', 'Digital presence', 'Content strategy', 'Customer trust'],
    cta: 'Start Now',
    heroImageQuery: 'premium business portrait modern office',
    workImageQueries: ['business branding workspace', 'modern creative studio', 'premium portfolio presentation'],
    portfolioSections: [
      { title: 'Brand Foundation', body: 'Clear positioning, polished visuals and a memorable message.', highlight: 'Identity' },
      { title: 'Digital Presence', body: 'A professional online experience that builds trust fast.', highlight: 'Website' },
      { title: 'Growth Content', body: 'Campaign-ready content designed for consistent visibility.', highlight: 'Content' },
    ],
    resumeBullets: ['Built a clear brand presence', 'Improved customer trust signals', 'Created conversion-focused messaging'],
    cardName: name,
    cardTitle: 'Premium Brand',
  }
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
    const { message: response, model: actualModel } = await createAnthropicMessage(client, {
      model: resolvedModel,
      max_tokens: maxTokens,
      system:
        'You are a world-class personal brand copywriter and career strategist. ' +
        'You create compelling, authentic personal brand content that helps professionals stand out. ' +
        'Always respond with valid JSON only, no markdown, no explanation, no preamble.',
      messages: [{ role: 'user', content: prompt }],
    }, [resolvedModel])

    const text = extractAIText(response.content)
    const output = parseAIJson(text, buildFallbackBrandOutput(prompt)) as BrandOutput

    const inputTokens  = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const totalTokens  = inputTokens + outputTokens
    const costUsd      = calcCostUsd(actualModel, inputTokens, outputTokens)
    const usdToInr     = await getUsdToInr()

    return {
      output,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        model: actualModel,
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
  // 'generate' for personal mode (default), override for other callers
  endpoint = 'generate',
): Promise<{ output: BrandOutput; tokenCount: number; usage: TokenUsage }> {
  const { output, usage } = await callClaude(prompt)

  // DB logging, fire and forget
  db.apiCallLog.create({
    data: {
      service:      'claude',
      endpoint,
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
  }).catch((e: unknown) => console.error('[ApiCallLog] Failed to log Claude call:', e))

  return { output, tokenCount: usage.totalTokens, usage }
}
