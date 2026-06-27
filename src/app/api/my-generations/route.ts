export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') // 'business' | null (personal)
    const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))
    const limit = Math.min(40, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const skip = page * limit

    // Fetch all matching for filtering, then paginate
    const allGenerations = await db.generation.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['COMPLETE', 'PENDING' as any, 'FAILED'] },
      },
      select: {
        id: true,
        createdAt: true,
        inputData: true,
        outputData: true,
        status: true,
        version: true,
        template: { select: { name: true, category: true, accentColor: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // internal cap
    })

    type GenerationRow = (typeof allGenerations)[number]

    let filtered: GenerationRow[]

    if (mode === 'business') {
      filtered = allGenerations.filter((g: GenerationRow) => {
        try {
          const input = g.inputData as Record<string, unknown>
          const output = g.outputData as Record<string, unknown> | null
          const hasCompanyName = typeof input?.companyName === 'string' && input.companyName.trim().length > 0
          const isVideo = input?.generationType === 'removed-video' || output?.generationType === 'removed-video'
          return hasCompanyName || isVideo
        } catch { return false }
      })
    } else {
      filtered = allGenerations.filter((g: GenerationRow) => {
        try {
          const input = g.inputData as Record<string, unknown>
          const output = g.outputData as Record<string, unknown> | null
          const hasCompanyName = typeof input?.companyName === 'string' && input.companyName.trim().length > 0
          const isVideo = input?.generationType === 'removed-video' || output?.generationType === 'removed-video'
          return !hasCompanyName && !isVideo
        } catch { return true }
      })
    }

    const total = filtered.length
    const generations = filtered.slice(skip, skip + limit)
    const hasMore = skip + limit < total

    return NextResponse.json({ generations, total, hasMore, page, limit })
  } catch (e) {
    console.error('[my-generations]', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
