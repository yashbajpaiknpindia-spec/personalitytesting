import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { runQCPipeline } from '@/lib/qc/pipeline'
import { generateBrandContent } from '@/lib/ai/generate'
import { checkUserConcurrency, checkMonthlyUsage } from '@/lib/rateLimit'
import { sendLimitHitEmail } from '@/lib/email'
import type { Plan } from '@prisma/client'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const { name, headline, tagline, jobTitle, company, location, bio, skills, tone, templateSlug, outputTypes } = body

    // QC Pipeline (runs for everyone)
    const qc = await runQCPipeline({ name, headline, tagline, jobTitle, company, location, bio, skills, tone, templateSlug, outputTypes })
    if (!qc.valid) {
      return NextResponse.json({ error: qc.flagReason || 'Validation failed' }, { status: 400 })
    }

    // ── GUEST PATH — no DB, no rate limiting, just generate ──────────────────
    if (!session?.user?.id) {
      const { output, tokenCount } = await generateBrandContent(qc.enrichedPrompt)
      return NextResponse.json({ output, tokenCount, guest: true })
    }

    // ── AUTHENTICATED PATH — full DB + rate limiting ──────────────────────────
    const userId = session.user.id
    const userPlan = session.user.plan as Plan

    const canProceed = await checkUserConcurrency(userId)
    if (!canProceed) {
      return NextResponse.json({ error: 'Too many active generations. Please wait.' }, { status: 429 })
    }

    const withinLimit = await checkMonthlyUsage(userId, userPlan)
    if (!withinLimit) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.email) sendLimitHitEmail(user.email, user.name || 'there').catch(() => {})
      return NextResponse.json({ error: 'Monthly generation limit reached. Upgrade to Pro for unlimited generations.' }, { status: 403 })
    }

    let template = await db.template.findFirst({ where: { slug: templateSlug || 'noir-card' } })
    if (!template) template = await db.template.findFirst()
    if (!template) return NextResponse.json({ error: 'No templates found' }, { status: 500 })

    const generation = await db.generation.create({
      data: {
        userId,
        templateId: template.id,
        status: 'PENDING',
        inputData: body as unknown as Prisma.InputJsonValue,
        enrichedData: { prompt: qc.enrichedPrompt, tone: qc.tone, industry: qc.industry },
      },
    })

    try {
      const { output, tokenCount } = await generateBrandContent(qc.enrichedPrompt)

      await db.generation.update({
        where: { id: generation.id },
        data: { status: 'COMPLETE', outputData: output as unknown as Prisma.InputJsonValue, tokenCount },
      })

      await db.user.update({
        where: { id: userId },
        data: { usageCount: { increment: 1 } },
      })

      return NextResponse.json({ generationId: generation.id, output, tokenCount })
    } catch (aiError) {
      await db.generation.update({
        where: { id: generation.id },
        data: { status: 'FAILED' },
      })
      throw aiError
    }
  } catch (error) {
    console.error('Generate error:', error)
    const msg = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
