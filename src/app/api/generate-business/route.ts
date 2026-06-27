// src/app/api/generate-business/route.ts
// Business mode generation, wired through runBusinessQCPipeline for the same
// sanitisation, classification, and guardrails as personal mode.
// ApiCallLog entries are written for ALL calls (authenticated, guest) so admin
// cost tracking captures business-mode and guest costs correctly.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { runBusinessQCPipeline } from '@/lib/qc/pipeline-business'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { checkUserConcurrency, checkGlobalLimit, incrementUsage } from '@/lib/rateLimit'
import { getUsdToInr } from '@/lib/ai/generate'
import { createAnthropicMessage } from '@/lib/ai/anthropic-fallback'
import { extractAIText, parseAIJson } from '@/lib/ai/safe-json'

let client: Anthropic | null = null
const MODEL = process.env.CLAUDE_BUSINESS_MODEL || process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001'
// Haiku pricing: $0.80/M input, $4.00/M output
function calcCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * 0.0000008) + (outputTokens * 0.000004)
}


function buildFallbackBusinessOutput(companyName: string, industry?: string, tone?: string) {
  const name = companyName || 'Brand'
  const category = industry || 'business'
  return {
    companyName: name,
    industry: category,
    tagline: `${name} — built to be remembered`,
    brandStory: `${name} helps customers choose a clear, trustworthy ${category} brand with confidence.`,
    brandVoice: tone || 'professional',
    logoConceptName: `${name} Signature Mark`,
    logoConceptDescription: `A clean premium wordmark and simple symbol for ${name}.`,
    logoSymbolIdea: 'A refined geometric mark that feels trustworthy and memorable.',
    primaryColors: ['#C9A84C', '#0A0A0E'],
    logoKeywords: ['premium', 'trust', 'clean', 'modern'],
    bannerHeadline: `Build trust with ${name}`,
    bannerSubheadline: `A sharper ${category} brand presence for better enquiries.`,
    bannerCta: 'Enquire Now',
    bannerTheme: 'Premium business campaign',
    flyerTitle: `${name} Services`,
    flyerSubtitle: `Professional ${category} solutions`,
    flyerBody: 'Clear offer, strong proof and direct contact paths for serious customers.',
    flyerCta: 'Contact Now',
    flyerHighlights: ['Clear positioning', 'Premium presentation', 'Fast enquiry flow'],
    posterHeadline: `${name} — Built to Trust`,
    posterTagline: 'Premium, clear and conversion-focused.',
    posterVisualDirection: 'Warm premium background, strong headline, elegant gold accent.',
    posterCallout: 'Start your brand journey',
    copyHeadlines: [`${name} makes choosing easier`, `A better first impression for your ${category} brand`, `Turn attention into enquiries`],
    copySocialCaptions: [`${name} is built for customers who value clarity, quality and trust.`, `Your brand should explain why you are worth choosing before the first call.`],
    copyEmailSubject: `${name}: a clearer brand experience`,
    copyEmailBody: `Hi, ${name} helps customers understand your offer quickly and enquire with confidence.`,
    copyCtas: ['Enquire Now', 'Book a Call', 'View Services'],
    copyAdCopy: `Make your ${category} brand easier to trust and easier to contact with ${name}.`,
  }
}

type Plan = 'FREE' | 'PRO' | 'TEAM'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your environment variables.' },
        { status: 500 },
      )
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const body = await req.json()
    const {
      companyName, industry, tagline, description,
      audience, tone, outputTypes: rawOutputTypes,
    } = body

    const outputTypes: string[] = Array.isArray(rawOutputTypes)
      ? rawOutputTypes
      : typeof rawOutputTypes === 'string'
        ? JSON.parse(rawOutputTypes)
        : ['logo', 'flyer', 'poster', 'copy']

    const qc = await runBusinessQCPipeline({
      companyName, industry, tagline, description,
      audience, tone, outputTypes,
    })

    if (!qc.valid) {
      return NextResponse.json(
        { error: qc.flagReason || 'Validation failed' },
        { status: 400 },
      )
    }

    const session = await auth()
    const usdToInr = await getUsdToInr()

    // ── GUEST PATH ────────────────────────────────────────────────────────────
    if (!session?.user?.id) {
      const { message, model: resolvedModel } = await createAnthropicMessage(client!, {
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: qc.enrichedPrompt }],
      }, [MODEL, 'claude-haiku-4-5-20251001', 'claude-3-5-haiku-latest'])

      const rawText = extractAIText(message.content)
      const output = parseAIJson(rawText, buildFallbackBusinessOutput(companyName, industry, tone))

      const inputTokens = message.usage.input_tokens
      const outputTokens = message.usage.output_tokens
      const costUsd = calcCost(inputTokens, outputTokens)
      const costInr = costUsd * usdToInr

      // Log guest business generation cost
      db.apiCallLog.create({
        data: {
          service: 'claude',
          endpoint: 'generate-business-guest',
          userId: null,
          model: resolvedModel,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          costInr,
          success: true,
        },
      }).catch((e: unknown) => console.error('[ApiCallLog] guest-business log failed:', e))

      return NextResponse.json({
        output,
        meta: { sector: qc.sector, brandTone: qc.brandTone, businessStage: qc.businessStage },
        usage: { inputTokens, outputTokens, costUsd },
        guest: true,
      })
    }

    // ── AUTHENTICATED PATH ────────────────────────────────────────────────────
    const userId   = session.user.id
    const userPlan = session.user.plan as Plan

    const userRecord = await db.user.findUnique({ where: { id: userId } })
    if (userRecord?.isSuspended) {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 },
      )
    }

    const canProceed = await checkUserConcurrency(userId)
    if (!canProceed) {
      return NextResponse.json({ error: 'Too many active generations. Please wait.' }, { status: 429 })
    }

    // Use fresh plan from DB, not potentially-stale JWT
    const limitResult = await checkGlobalLimit(userId)
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: limitResult.reason || 'Generation limit reached.',
          limitReached: true,
          used: limitResult.used,
          limit: limitResult.limit,
          period: limitResult.period,
          resetAt: limitResult.resetAt,
        },
        { status: 429 },
      )
    }

    let template = await db.template.findFirst({ where: { slug: 'noir-card' } })
    if (!template) template = await db.template.findFirst()
    if (!template) return NextResponse.json({ error: 'No templates found' }, { status: 500 })

    const generation = await db.generation.create({
      data: {
        userId,
        templateId: template.id,
        status: 'PENDING',
        // Ensure outputTypes is stored as an array (client sends it as JSON string sometimes)
        inputData: {
          ...(body as Record<string, unknown>),
          outputTypes,
        } as never,
        enrichedData: {
          prompt:        qc.enrichedPrompt,
          sector:        qc.sector,
          brandTone:     qc.brandTone,
          businessStage: qc.businessStage,
        },
      },
    })

    try {
      const { message, model: resolvedModel } = await createAnthropicMessage(client!, {
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: qc.enrichedPrompt }],
      }, [MODEL, 'claude-haiku-4-5-20251001', 'claude-3-5-haiku-latest'])

      const rawText = extractAIText(message.content)
      const output = parseAIJson(rawText, buildFallbackBusinessOutput(companyName, industry, tone))

      const inputTokens  = message.usage.input_tokens
      const outputTokens = message.usage.output_tokens
      const tokenCount   = inputTokens + outputTokens
      const costUsd      = calcCost(inputTokens, outputTokens)
      const costInr      = costUsd * usdToInr

      await db.generation.update({
        where: { id: generation.id },
        data: {
          status:       'COMPLETE',
          outputData:   output as never,
          tokenCount,
          inputTokens,
          outputTokens,
          modelUsed:    resolvedModel,
          costUsd,
        },
      })

      // Log to ApiCallLog so admin cost dashboard captures business-mode costs
      db.apiCallLog.create({
        data: {
          service:      'claude',
          endpoint:     'generate-business',
          userId,
          model:        resolvedModel,
          inputTokens,
          outputTokens,
          totalTokens:  tokenCount,
          costUsd,
          costInr,
          generationId: generation.id,
          success:      true,
        },
      }).catch((e: unknown) => console.error('[ApiCallLog] business log failed:', e))

      await incrementUsage(userId)

      return NextResponse.json({
        generationId: generation.id,
        output,
        meta: { sector: qc.sector, brandTone: qc.brandTone, businessStage: qc.businessStage },
        usage: { inputTokens, outputTokens, tokenCount, costUsd, costInr },
      })
    } catch (aiError) {
      await db.generation.update({
        where: { id: generation.id },
        data: { status: 'FAILED' },
      })
      await db.apiCallLog.create({
        data: { service: 'claude', endpoint: 'generate-business', userId, success: false, generationId: generation.id },
      }).catch((e: unknown) => console.error('[generate-business] apiCallLog (aiError) failed:', e))
      throw aiError
    }
  } catch (error) {
    console.error('[generate-business] Unhandled exception:', error)
    await db.apiCallLog.create({ data: { service: 'claude', endpoint: 'generate-business', userId: null, success: false } })
      .catch((e: unknown) => console.error('[generate-business] apiCallLog (catch) failed:', e))
    const msg = error instanceof Error ? error.message : 'Business generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
