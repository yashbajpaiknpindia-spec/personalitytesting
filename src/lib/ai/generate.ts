// src/lib/ai/generate.ts

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type SlideLayoutType =
  | 'hero'        // Full-bleed image, large serif title centred, tagline below
  | 'split-left'  // Left half: text content. Right half: full-bleed image
  | 'split-right' // Left half: full-bleed image. Right half: text content
  | 'stats'       // Dark background, 3 large stat numbers in a row with labels
  | 'bullets'     // Dark background, heading + 4–5 bullet points, optional image column
  | 'quote'       // Large pull-quote centred, attribution below, accent background
  | 'grid'        // 2×2 or 3-item card grid with icon-label-description per cell
  | 'title-only'  // Minimal: large centred heading on dark/image background, no body

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
  presentationSlides: RichSlide[]
}

async function callClaude(prompt: string, attempt = 0): Promise<BrandOutput> {
  try {
    // Use haiku as fallback on the final retry if the primary model is overloaded
    const model = attempt >= 4 ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-5'

    const response = await client.messages.create({
      model,
      max_tokens: 4000,
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

    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean) as BrandOutput
    return parsed
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string }
    const isOverloaded =
      error?.status === 529 ||
      error?.message?.toLowerCase().includes('overloaded')

    if (attempt < 5 && isOverloaded) {
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      const delay = Math.pow(2, attempt + 1) * 1000
      console.log(`Anthropic overloaded (attempt ${attempt + 1}/5). Retrying in ${delay}ms...`)
      await new Promise(r => setTimeout(r, delay))
      return callClaude(prompt, attempt + 1)
    }
    throw err
  }
}

export async function generateBrandContent(
  prompt: string
): Promise<{ output: BrandOutput; tokenCount: number }> {
  const output = await callClaude(prompt)
  const tokenCount =
    Math.ceil(JSON.stringify(output).length / 4) +
    Math.ceil(prompt.length / 4)
  return { output, tokenCount }
}
