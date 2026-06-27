// src/app/api/admin/logs/route.ts
// GET /api/admin/logs?page=1&service=claude&endpoint=&userId=
// Paginated API call log viewer for the admin panel.
// Returns 50 entries per page with user info, full metadata, and linked generationId.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

const PAGE_SIZE = 50

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page     = Math.max(1, Number(searchParams.get('page') || '1'))
  const service  = searchParams.get('service') || ''   // '' | 'claude' | 'openai'
  const endpoint = searchParams.get('endpoint') || ''  // optional filter
  const userId   = searchParams.get('userId') || ''    // optional user filter

  const where: Record<string, unknown> = {}
  if (service)  where.service  = service
  if (endpoint) where.endpoint = { contains: endpoint }
  if (userId)   where.userId   = userId

  const [total, logs] = await Promise.all([
    db.apiCallLog.count({ where }),
    db.apiCallLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id:           true,
        service:      true,
        endpoint:     true,
        model:        true,
        inputTokens:  true,
        outputTokens: true,
        totalTokens:  true,
        costUsd:      true,
        costInr:      true,
        query:        true,
        success:      true,
        cached:       true,
        generationId: true,
        userId:       true,
        createdAt:    true,
        user: {
          select: { id: true, email: true, name: true, phone: true, plan: true },
        },
      },
    }),
  ])

  return NextResponse.json({
    logs,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}
