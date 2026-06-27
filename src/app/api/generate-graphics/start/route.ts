// src/app/api/generate-graphics/start/route.ts
// Creates a pending generation row before image rendering starts so the frontend
// can poll it and show each poster variation as soon as it is saved.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { checkGlobalLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limitResult = await checkGlobalLimit(session.user.id)
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'We could not generate content. Please upgrade your plan.', limitReached: true, used: limitResult.used, limit: limitResult.limit, period: limitResult.period, resetAt: limitResult.resetAt },
      { status: 429 }
    )
  }

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { body = {} }

  const companyName = String(body.companyName ?? body.businessName ?? '').trim() || 'Brand'
  const industry = body.industry ? String(body.industry) : undefined

  const template = await db.template.findFirst({ where: { slug: 'noir-card' } })
    ?? await db.template.findFirst()

  const generation = await db.generation.create({
    data: {
      userId: session.user.id,
      templateId: template?.id ?? null,
      status: 'PENDING',
      inputData: body as never,
      enrichedData: { genType: 'campaign-image', companyName, industry } as never,
      outputData: {
        genType: 'campaign-image',
        companyName,
        industry,
        graphics: [],
        variations: [],
        isPartial: true,
        partialCount: 0,
      } as never,
    },
  })

  return NextResponse.json({ generationId: generation.id })
}
