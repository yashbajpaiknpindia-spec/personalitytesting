// src/app/api/dashboard/leads/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20'))
    const skip = (page - 1) * limit

    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where: { ownerId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.contact.count({ where: { ownerId: session.user.id } }),
    ])

    return NextResponse.json({
      contacts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[dashboard/leads]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
