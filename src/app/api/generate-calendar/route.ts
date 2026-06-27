// src/app/api/generate-calendar/route.ts
// Generates a 3-month content calendar using Claude Sonnet 4.6.
// Creates a Generation record (PENDING → COMPLETE/FAILED) so admin panel
// tracks calendar generations + failures alongside other generation types.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { getUsdToInr, calcCostUsd } from '@/lib/ai/generate'
import { createAnthropicMessage } from '@/lib/ai/anthropic-fallback'
import { extractAIText, parseAIJson } from '@/lib/ai/safe-json'
import { checkGlobalLimit, incrementUsage } from '@/lib/rateLimit'

let client: Anthropic | null = null
const MODEL = process.env.CLAUDE_CALENDAR_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-5'

function calcCost(input: number, output: number, model = MODEL) {
  return calcCostUsd(model, input, output)
}

function buildFallbackCalendar(companyName: string, industry?: string, tagline?: string, description?: string, audience?: string, tone?: string) {
  const name = companyName || 'Brand'
  const category = industry || 'business'
  const platforms = ['instagram', 'linkedin', 'instagram', 'facebook']
  const makePosts = (monthNumber: number) => Array.from({ length: 8 }, (_, i) => ({
    week: Math.floor(i / 2) + 1,
    platform: platforms[i % platforms.length],
    type: i % 3 === 0 ? 'Reel' : i % 3 === 1 ? 'Carousel' : 'Static Post',
    topic: `${name} ${category} trust point ${i + 1}`,
    caption: `Show customers why ${name} is the right ${category} choice. Highlight one real benefit, one proof point and a clear enquiry CTA.`,
    hashtags: [`#${name.replace(/\s+/g, '')}`, '#BrandSyndicate', '#BusinessGrowth', '#Marketing'],
    bestTime: i % 2 === 0 ? 'Tue 7pm' : 'Thu 11am',
  }))
  return {
    strategy: `Use simple, proof-led content for ${name}: educate the buyer, show credibility, explain the offer and push clear enquiries.`,
    contentPillars: ['Trust & proof', 'Services/products', 'Customer education', 'Offers & enquiries'],
    months: [1, 2, 3].map(m => ({ month: `Month ${m}`, theme: m === 1 ? 'Build trust' : m === 2 ? 'Explain the offer' : 'Convert warm leads', focus: `Grow ${category} enquiries with consistent content.`, posts: makePosts(m) })),
    growthTips: ['Keep captions specific to buyer pain points', 'Add a direct WhatsApp or call CTA', 'Reuse best posts as ads', 'Track enquiries by source every week'],
  }
}

export async function POST(req: NextRequest) {
  // ── Auth guard: only logged-in users may generate content calendars ───────
  const session = await auth()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return NextResponse.json(
      { error: 'You must be logged in to generate a content calendar. Please sign in and try again.' },
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
          enrichedData: { genType: 'calendar', companyName, industry },
        },
      }).catch((e: unknown) => { console.error('[generate-calendar] Generation.create failed:', e); return null })
      if (gen) generationId = gen.id
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      if (generationId) {
        await db.generation.update({ where: { id: generationId }, data: { status: 'FAILED' } })
          .catch((e: unknown) => console.error('[generate-calendar] generation.update (no-key) failed:', e))
      }
      await db.apiCallLog.create({
        data: { service: 'claude', endpoint: 'generate-calendar', userId, success: false, generationId },
      }).catch((e: unknown) => console.error('[generate-calendar] apiCallLog (no-key) failed:', e))
      return NextResponse.json(
        { error: 'Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your environment variables.' },
        { status: 500 },
      )
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are an expert social media strategist and content creator. Create a detailed 3-month content calendar for this business.

COMPANY: ${companyName}
INDUSTRY: ${industry || 'General Business'}
TAGLINE: ${tagline || ''}
DESCRIPTION: ${description || ''}
TARGET AUDIENCE: ${audience || 'General market'}
BRAND TONE: ${tone || 'professional'}

Create a comprehensive content calendar. Return ONLY valid JSON (no markdown, no preamble):

{
  "strategy": "<2-3 sentences on the overall content strategy, pillars, and approach>",
  "contentPillars": ["<pillar 1>", "<pillar 2>", "<pillar 3>", "<pillar 4>"],
  "months": [
    {
      "month": "Month 1",
      "theme": "<overarching monthly theme>",
      "focus": "<what this month's content achieves>",
      "posts": [
        {
          "week": 1,
          "platform": "instagram",
          "type": "<Reel | Carousel | Story | Static Post>",
          "topic": "<brief topic>",
          "caption": "<full engaging caption with emojis, max 150 words>",
          "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
          "bestTime": "<Mon 9am | Tue 6pm | etc>"
        },
        {
          "week": 1,
          "platform": "linkedin",
          "type": "<Article | Post | Poll | Video>",
          "topic": "<brief topic>",
          "caption": "<professional caption, max 200 words>",
          "hashtags": ["#tag1", "#tag2", "#tag3"],
          "bestTime": "<Tue 8am | Wed 12pm | etc>"
        },
        {
          "week": 2,
          "platform": "instagram",
          "type": "<Reel | Carousel | Story | Static Post>",
          "topic": "<brief topic>",
          "caption": "<full engaging caption>",
          "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
          "bestTime": "<day time>"
        },
        {
          "week": 2,
          "platform": "twitter",
          "type": "<Tweet | Thread | Poll>",
          "topic": "<brief topic>",
          "caption": "<punchy tweet, max 280 chars>",
          "hashtags": ["#tag1", "#tag2"],
          "bestTime": "<day time>"
        },
        {
          "week": 3,
          "platform": "instagram",
          "type": "<Reel | Carousel | Story | Static Post>",
          "topic": "<brief topic>",
          "caption": "<full engaging caption>",
          "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
          "bestTime": "<day time>"
        },
        {
          "week": 3,
          "platform": "linkedin",
          "type": "<Article | Post | Poll>",
          "topic": "<brief topic>",
          "caption": "<professional caption>",
          "hashtags": ["#tag1", "#tag2", "#tag3"],
          "bestTime": "<day time>"
        },
        {
          "week": 4,
          "platform": "instagram",
          "type": "<Reel | Carousel | Story | Static Post>",
          "topic": "<brief topic>",
          "caption": "<full engaging caption>",
          "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
          "bestTime": "<day time>"
        },
        {
          "week": 4,
          "platform": "twitter",
          "type": "<Tweet | Thread>",
          "topic": "<brief topic>",
          "caption": "<punchy tweet>",
          "hashtags": ["#tag1", "#tag2"],
          "bestTime": "<day time>"
        }
      ]
    },
    {
      "month": "Month 2",
      "theme": "<overarching monthly theme>",
      "focus": "<what this month achieves>",
      "posts": [ ]
    },
    {
      "month": "Month 3",
      "theme": "<overarching monthly theme>",
      "focus": "<what this month achieves>",
      "posts": [ ]
    }
  ],
  "growthTips": [
    "<actionable growth tip 1>",
    "<actionable growth tip 2>",
    "<actionable growth tip 3>",
    "<actionable growth tip 4>"
  ]
}`

    const { message, model: resolvedModel } = await createAnthropicMessage(client!, {
      model: MODEL,
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    }, [MODEL, 'claude-sonnet-4-5', 'claude-3-5-sonnet-latest', 'claude-haiku-4-5-20251001'])

    const rawText = extractAIText(message.content)
    const contentCalendar = parseAIJson(rawText, buildFallbackCalendar(companyName, industry, tagline, description, audience, tone))

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
          outputData: contentCalendar as never,
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
        endpoint: 'generate-calendar',
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
    }).catch((e: unknown) => console.error('[generate-calendar] apiCallLog (success) failed:', e))

    await incrementUsage(userId)

    return NextResponse.json({ contentCalendar, usage: { inputTokens, outputTokens, costUsd } })

  } catch (error) {
    console.error('[generate-calendar] Unhandled exception:', error)

    // Await both writes so status is FAILED (not PENDING) before we return
    if (generationId) {
      await db.generation.update({
        where: { id: generationId },
        data: { status: 'FAILED' },
      }).catch((e: unknown) => console.error('[generate-calendar] generation.update (catch) failed:', e))
    }

    await db.apiCallLog.create({
      data: { service: 'claude', endpoint: 'generate-calendar', userId, success: false, generationId },
    }).catch((e: unknown) => console.error('[generate-calendar] apiCallLog (catch) failed:', e))

    const isAuthError = error instanceof Error && (error.message.includes('401') || error.message.includes('authentication') || error.message.includes('API key'))
    const isRateLimit = error instanceof Error && error.message.includes('429')
    const msg = isAuthError
      ? 'Invalid or missing Anthropic API key. Check your ANTHROPIC_API_KEY environment variable.'
      : isRateLimit
      ? 'Anthropic rate limit reached. Please wait a moment and try again.'
      : error instanceof Error ? error.message : 'Calendar generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
