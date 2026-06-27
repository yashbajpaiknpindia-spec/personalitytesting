import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { runQCPipeline } from '@/lib/qc/pipeline'
import { generateBrandContent } from '@/lib/ai/generate'
import { checkUserConcurrency, checkGlobalLimit, incrementUsage } from '@/lib/rateLimit'
import { sendLimitHitEmail } from '@/lib/email'

type Plan = 'FREE' | 'PRO' | 'TEAM'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const { name, headline, tagline, jobTitle, company, location, bio, skills, tone, templateSlug, outputTypes } = body

    const qc = await runQCPipeline({ name, headline, tagline, jobTitle, company, location, bio, skills, tone, templateSlug, outputTypes })
    if (!qc.valid) {
      return NextResponse.json({ error: qc.flagReason || 'Validation failed' }, { status: 400 })
    }

    // ── GUEST PATH ────────────────────────────────────────────────────────
    if (!session?.user?.id) {
      const { output, tokenCount, usage } = await generateBrandContent(qc.enrichedPrompt)
      return NextResponse.json({ output, tokenCount, usage, guest: true })
    }

    // ── AUTHENTICATED PATH ────────────────────────────────────────────────
    const userId = session.user.id
    // Always fetch fresh plan from DB, JWT can be stale
    const userRecord = await db.user.findUnique({ where: { id: userId } })
    if (userRecord?.isSuspended) {
      return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 })
    }

    const canProceed = await checkUserConcurrency(userId)
    if (!canProceed) {
      return NextResponse.json({ error: 'Too many active generations. Please wait.' }, { status: 429 })
    }

    const limitResult = await checkGlobalLimit(userId)
    if (!limitResult.allowed) {
      if (userRecord?.email) sendLimitHitEmail(userRecord.email, userRecord.name || 'there').catch(() => {})
      return NextResponse.json({
        error: limitResult.reason || 'Generation limit reached.',
        limitReached: true,
        used: limitResult.used,
        limit: limitResult.limit,
        period: limitResult.period,
        resetAt: limitResult.resetAt,
      }, { status: 429 })
    }

    let template = await db.template.findFirst({ where: { slug: templateSlug || 'noir-card' } })
    if (!template) template = await db.template.findFirst()
    if (!template) return NextResponse.json({ error: 'No templates found' }, { status: 500 })

    const generation = await db.generation.create({
      data: {
        userId,
        templateId: template.id,
        status: 'PENDING',
        inputData: body as never,
        enrichedData: { prompt: qc.enrichedPrompt, tone: qc.tone, industry: qc.industry },
      },
    })

    try {
      const { output, tokenCount, usage } = await generateBrandContent(qc.enrichedPrompt, userId, generation.id)

      await db.generation.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETE',
          outputData: output as never,
          tokenCount,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          modelUsed: usage.model,
          costUsd: usage.costUsd,
        },
      })

      await incrementUsage(userId)

      return NextResponse.json({ generationId: generation.id, output, tokenCount, usage })
    } catch (aiError) {
      await db.generation.update({
        where: { id: generation.id },
        data: { status: 'FAILED' },
      })
      // Log failure to apiCallLog so admin stats shows correct fail count
      db.apiCallLog.create({
        data: {
          service:  'claude',
          endpoint: 'generate',
          userId,
          success:  false,
        },
      }).catch(() => {})
      throw aiError
    }
  } catch (error) {
    console.error('Generate error:', error)
    const msg = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
