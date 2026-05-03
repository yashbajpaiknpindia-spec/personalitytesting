// src/app/api/generate-business/route.ts
// Business mode generation — wired through runBusinessQCPipeline for the same
// sanitisation, classification, and guardrails as personal mode.
// ApiCallLog entries are written for ALL calls (authenticated, guest) so admin
// cost tracking captures business-mode and guest costs correctly.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { runBusinessQCPipeline } from '@/lib/qc/pipeline-business'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { checkUserConcurrency, checkMonthlyUsage } from '@/lib/rateLimit'
import { getUsdToInr } from '@/lib/ai/generate'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-haiku-4-5-20251001'
// Haiku pricing: $0.80/M input, $4.00/M output
function calcCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * 0.0000008) + (outputTokens * 0.000004)
}

type Plan = 'FREE' | 'PRO' | 'TEAM'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyName, industry, tagline, description,
      audience, tone, outputTypes: rawOutputTypes, presentationSlideCount,
    } = body

    const outputTypes: string[] = Array.isArray(rawOutputTypes)
      ? rawOutputTypes
      : typeof rawOutputTypes === 'string'
        ? JSON.parse(rawOutputTypes)
        : ['logo', 'banner', 'flyer', 'poster', 'copy']

    const qc = await runBusinessQCPipeline({
      companyName, industry, tagline, description,
      audience, tone, outputTypes, presentationSlideCount,
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
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: qc.enrichedPrompt }],
      })

      const rawText = message.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('')

      const clean = rawText.replace(/```json\n?|```\n?/g, '').trim()
      const output = JSON.parse(clean)

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
          model: MODEL,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          costInr,
          success: true,
        },
      }).catch(e => console.error('[ApiCallLog] guest-business log failed:', e))

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

    const withinLimit = await checkMonthlyUsage(userId, userPlan)
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Monthly generation limit reached. Upgrade to Pro for unlimited generations.' },
        { status: 403 },
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
        inputData: body as never,
        enrichedData: {
          prompt:        qc.enrichedPrompt,
          sector:        qc.sector,
          brandTone:     qc.brandTone,
          businessStage: qc.businessStage,
        },
      },
    })

    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: qc.enrichedPrompt }],
      })

      const rawText = message.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('')

      const clean = rawText.replace(/```json\n?|```\n?/g, '').trim()
      const output = JSON.parse(clean)

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
          modelUsed:    MODEL,
          costUsd,
        },
      })

      // Log to ApiCallLog so admin cost dashboard captures business-mode costs
      db.apiCallLog.create({
        data: {
          service:      'claude',
          endpoint:     'generate-business',
          userId,
          model:        MODEL,
          inputTokens,
          outputTokens,
          totalTokens:  tokenCount,
          costUsd,
          costInr,
          generationId: generation.id,
          success:      true,
        },
      }).catch(e => console.error('[ApiCallLog] business log failed:', e))

      await db.user.update({
        where: { id: userId },
        data: { usageCount: { increment: 1 } },
      })

      return NextResponse.json({
        generationId: generation.id,
        output,
        meta: { sector: qc.sector, brandTone: qc.brandTone, businessStage: qc.businessStage },
        usage: { inputTokens, outputTokens, tokenCount, costUsd, costInr, model: MODEL },
      })
    } catch (aiError) {
      await db.generation.update({
        where: { id: generation.id },
        data: { status: 'FAILED' },
      })
      throw aiError
    }
  } catch (error) {
    console.error('[generate-business]', error)
    const msg = error instanceof Error ? error.message : 'Business generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
