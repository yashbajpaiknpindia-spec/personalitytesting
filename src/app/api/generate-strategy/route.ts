// src/app/api/generate-strategy/route.ts
// Generates a comprehensive business strategy using Claude Sonnet 4.6.
// Creates a Generation record (PENDING → COMPLETE/FAILED) so admin panel
// tracks strategy generations + failures alongside website/business modes.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { getUsdToInr, calcCostUsd } from '@/lib/ai/generate'
import { createAnthropicMessage } from '@/lib/ai/anthropic-fallback'
import { extractAIText, parseAIJson } from '@/lib/ai/safe-json'
import { checkGlobalLimit, incrementUsage } from '@/lib/rateLimit'

let client: Anthropic | null = null
const MODEL = process.env.CLAUDE_STRATEGY_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-5'

function calcCost(input: number, output: number, model = MODEL) {
  return calcCostUsd(model, input, output)
}

function buildFallbackStrategy(companyName: string, industry?: string, tagline?: string, description?: string, audience?: string, tone?: string) {
  const name = companyName || 'Brand'
  const category = industry || 'business'
  return {
    executiveSummary: `${name} should position itself as a clear, trustworthy ${category} brand with a strong offer, simple proof points and direct enquiry paths.`,
    missionStatement: tagline || `Help customers choose ${name} with confidence.`,
    visionStatement: `Become a preferred ${category} choice for the right customers through quality, consistency and memorable branding.`,
    goals: ['Clarify the core offer', 'Improve website and social conversion', 'Build trust with proof and testimonials', 'Create a repeatable content engine'],
    swot: {
      strengths: ['Focused brand promise', 'Ability to present offers clearly', 'Room to build a premium identity'],
      weaknesses: ['Needs stronger proof assets', 'Messaging may need more clarity', 'Follow-up systems should be consistent'],
      opportunities: ['Local search and social discovery', 'Educational content', 'Referral-led growth', 'Retargeting warm visitors'],
      threats: ['Price-based competitors', 'Low-trust online experiences', 'Inconsistent content output'],
    },
    roadmap: [
      { phase: 'Foundation', duration: 'Weeks 1-2', milestones: ['Finalize positioning', 'Prepare service/product proof', 'Launch landing page improvements'] },
      { phase: 'Acquisition', duration: 'Weeks 3-6', milestones: ['Publish weekly content', 'Run focused campaigns', 'Track leads and follow-ups'] },
      { phase: 'Optimization', duration: 'Weeks 7-12', milestones: ['Improve CTAs', 'Retarget engaged users', 'Turn best content into ads'] },
    ],
    kpis: [
      { metric: 'Website enquiries', target: '+20% month-on-month', timeline: '90 days' },
      { metric: 'Lead response time', target: 'Under 15 minutes', timeline: '30 days' },
      { metric: 'Content consistency', target: '3-5 posts weekly', timeline: 'Ongoing' },
    ],
    goToMarket: `Start with a clear ${category} landing page, local proof, WhatsApp/call CTAs and content that explains why ${name} is worth choosing.`,
    competitiveAdvantage: 'Sharper presentation, faster follow-up and proof-led positioning.',
    revenueModel: 'Service or product revenue supported by upsells, packages and repeat customers.',
    marketingChannels: ['Website SEO', 'Instagram', 'Google Business Profile', 'WhatsApp follow-up', 'Referral campaigns'],
    riskMitigation: [{ risk: 'Low trust from new visitors', mitigation: 'Add testimonials, process proof, examples and clear contact options.' }],
  }
}

export async function POST(req: NextRequest) {
  // ── Auth guard: only logged-in users may generate strategy ───────────────
  const session = await auth()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return NextResponse.json(
      { error: 'You must be logged in to generate a business strategy. Please sign in and try again.' },
      { status: 401 }
    )
  }

  // ── Global generation limit check ─────────────────────────────────────────
  const limitResult = await checkGlobalLimit(userId)
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: limitResult.reason || 'Generation limit reached.', limitReached: true, used: limitResult.used, limit: limitResult.limit, period: limitResult.period, resetAt: limitResult.resetAt },
      { status: 429 }
    )
  }

  let generationId: string | null = null

  try {
    const body = await req.json()
    const { companyName, industry, tagline, description, audience, tone } = body

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const usdToInr = await getUsdToInr()

    // ── Create a Generation record FIRST so every attempt (including key-missing
    // failures) is tracked in the admin panel. Must happen before any early-return.
    {
      const template = await db.template.findFirst({ where: { slug: 'noir-card' } }) ?? await db.template.findFirst()
      const gen = await db.generation.create({
        data: {
          userId,
          templateId: template?.id ?? null,
          status: 'PENDING',
          inputData: body as never,
          enrichedData: { genType: 'strategy', companyName, industry },
        },
      }).catch((e: unknown) => { console.error('[generate-strategy] Generation.create failed:', e); return null })
      if (gen) generationId = gen.id
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      if (generationId) {
        await db.generation.update({ where: { id: generationId }, data: { status: 'FAILED' } })
          .catch((e: unknown) => console.error('[generate-strategy] generation.update (no-key) failed:', e))
      }
      await db.apiCallLog.create({
        data: { service: 'claude', endpoint: 'generate-strategy', userId, success: false, generationId },
      }).catch((e: unknown) => console.error('[generate-strategy] apiCallLog (no-key) failed:', e))
      return NextResponse.json(
        { error: 'Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your environment variables.' },
        { status: 500 },
      )
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are a McKinsey-level business strategist. Create a comprehensive business strategy for this company.

COMPANY: ${companyName}
INDUSTRY: ${industry || 'General Business'}
TAGLINE: ${tagline || ''}
DESCRIPTION: ${description || ''}
TARGET AUDIENCE: ${audience || 'General market'}
BRAND TONE: ${tone || 'professional'}

Generate a detailed business strategy with India-ready market logic when no specific non-India market is provided.

STRICT QUALITY RULES:
- No generic ChatGPT phrases: "unlock potential", "game-changing", "innovative solutions", "seamless experience", "one-stop solution", "elevate your business", "cutting-edge".
- Make every recommendation specific to the company, industry, target audience, buyer behaviour, and acquisition channel.
- Include Indian market relevance when applicable: WhatsApp-first enquiry, Google Maps/local search, trust signals, referrals, city/local partnerships, pricing sensitivity, marketplaces, festival/seasonal campaigns, and regional-language copy where useful.
- The competitive advantage must state one sharp differentiator and why it is defensible against crowded competitors.
- GTM and marketing channels must be practical, not abstract. Use concrete channels, offers, funnels, and proof assets.

Return ONLY valid JSON (no markdown, no preamble):

{
  "executiveSummary": "<3-4 specific sentences summarising the company's strategic position, customer problem, Indian/local market opportunity where relevant, and the gap it can own>",
  "missionStatement": "<one powerful sentence>",
  "visionStatement": "<one aspirational sentence>",
  "goals": [
    "<specific 6-month goal>",
    "<specific 12-month goal>",
    "<specific 24-month goal>",
    "<5-year vision goal>"
  ],
  "swot": {
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
    "opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>", "<opportunity 4>"],
    "threats": ["<threat 1>", "<threat 2>", "<threat 3>"]
  },
  "roadmap": [
    {
      "phase": "Phase 1, Foundation",
      "duration": "0–3 months",
      "milestones": ["<milestone 1>", "<milestone 2>", "<milestone 3>"]
    },
    {
      "phase": "Phase 2, Growth",
      "duration": "3–9 months",
      "milestones": ["<milestone 1>", "<milestone 2>", "<milestone 3>"]
    },
    {
      "phase": "Phase 3, Scale",
      "duration": "9–18 months",
      "milestones": ["<milestone 1>", "<milestone 2>", "<milestone 3>"]
    }
  ],
  "kpis": [
    { "metric": "<KPI name>", "target": "<specific target>", "timeline": "<timeline>" },
    { "metric": "<KPI name>", "target": "<specific target>", "timeline": "<timeline>" },
    { "metric": "<KPI name>", "target": "<specific target>", "timeline": "<timeline>" },
    { "metric": "<KPI name>", "target": "<specific target>", "timeline": "<timeline>" },
    { "metric": "<KPI name>", "target": "<specific target>", "timeline": "<timeline>" }
  ],
  "goToMarket": "<3-4 practical sentences on GTM: first customer segment, positioning, offer, channel mix, WhatsApp/phone or lead flow, local/search/social proof assets where relevant>",
  "competitiveAdvantage": "<2-3 specific sentences on the sharp differentiator, proof behind it, and why crowded competitors cannot easily copy it>",
  "revenueModel": "<2-3 sentences on how the business makes money and primary revenue streams>",
  "marketingChannels": ["<specific channel with use case>", "<specific channel with use case>", "<specific channel with use case>", "<specific channel with use case>"] ,
  "riskMitigation": [
    { "risk": "<risk>", "mitigation": "<mitigation strategy>" },
    { "risk": "<risk>", "mitigation": "<mitigation strategy>" },
    { "risk": "<risk>", "mitigation": "<mitigation strategy>" }
  ]
}`

    const { message, model: resolvedModel } = await createAnthropicMessage(client!, {
      model: MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }, [MODEL, 'claude-sonnet-4-5', 'claude-3-5-sonnet-latest', 'claude-haiku-4-5-20251001'])

    const rawText = extractAIText(message.content)
    const strategy = parseAIJson(rawText, buildFallbackStrategy(companyName, industry, tagline, description, audience, tone))

    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens
    const costUsd = calcCost(inputTokens, outputTokens, resolvedModel)
    const costInr = costUsd * usdToInr

    // ── Mark generation COMPLETE ─────────────────────────────────────────────
    if (generationId) {
      await db.generation.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETE',
          outputData: strategy as never,
          tokenCount: inputTokens + outputTokens,
          inputTokens,
          outputTokens,
          modelUsed: resolvedModel,
          costUsd,
        },
      })
    }

    db.apiCallLog.create({
      data: {
        service: 'claude',
        endpoint: 'generate-strategy',
        userId,
        model: resolvedModel,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd,
        costInr,
        generationId,
        success: true,
      },
    }).catch((e: unknown) => console.error('[generate-strategy] apiCallLog (success) failed:', e))

    await incrementUsage(userId)

    return NextResponse.json({ strategy, usage: { inputTokens, outputTokens, costUsd } })

  } catch (error) {
    console.error('[generate-strategy] Unhandled exception:', error)

    // Await both writes so status is FAILED (not PENDING) before we return
    if (generationId) {
      await db.generation.update({
        where: { id: generationId },
        data: { status: 'FAILED' },
      }).catch((e: unknown) => console.error('[generate-strategy] generation.update (catch) failed:', e))
    }

    await db.apiCallLog.create({
      data: { service: 'claude', endpoint: 'generate-strategy', userId, success: false, generationId },
    }).catch((e: unknown) => console.error('[generate-strategy] apiCallLog (catch) failed:', e))

    const isAuthError = error instanceof Error && (error.message.includes('401') || error.message.includes('authentication') || error.message.includes('API key'))
    const isRateLimit = error instanceof Error && error.message.includes('429')
    const msg = isAuthError
      ? 'Invalid or missing Anthropic API key. Check your ANTHROPIC_API_KEY environment variable.'
      : isRateLimit
      ? 'Anthropic rate limit reached. Please wait a moment and try again.'
      : error instanceof Error ? error.message : 'Strategy generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
