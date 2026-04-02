import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface BrandOutput {
  headline: string
  tagline: string
  bio: string
  skills: string[]
  cta: string
  portfolioSections: Array<{ title: string; body: string; highlight: string }>
  resumeBullets: string[]
  cardName: string
  cardTitle: string
  presentationHook: string
  presentationSlides: Array<{ title: string; body: string; imageQuery: string }>
}

async function callClaude(prompt: string, attempt = 0): Promise<BrandOutput> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: 'You are a world-class personal brand copywriter and career strategist. You create compelling, authentic personal brand content that helps professionals stand out. Always respond with valid JSON only — no markdown, no explanation, no preamble.',
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
    if (attempt < 2 && (error?.status === 529 || error?.message?.includes('overloaded'))) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 1500))
      return callClaude(prompt, attempt + 1)
    }
    throw err
  }
}

export async function generateBrandContent(prompt: string): Promise<{ output: BrandOutput; tokenCount: number }> {
  const output = await callClaude(prompt)
  // Rough token estimate
  const tokenCount = Math.ceil(JSON.stringify(output).length / 4) + Math.ceil(prompt.length / 4)
  return { output, tokenCount }
}
