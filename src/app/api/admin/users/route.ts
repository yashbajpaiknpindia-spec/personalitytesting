import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user.email !== ADMIN_EMAIL && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50
  const search = searchParams.get('search') ?? ''

  const where = search ? {
    OR: [
      { email: { contains: search, mode: 'insensitive' as const } },
      { name: { contains: search, mode: 'insensitive' as const } },
    ]
  } : {}

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, email: true, name: true, plan: true, role: true,
        usageCount: true, usageResetAt: true, isSuspended: true, suspendReason: true,
        dailyGenLimit: true, monthlyGenLimit: true, yearlyGenLimit: true,
        createdAt: true, onboarded: true,
        _count: { select: { generations: true } },
      },
    }),
    db.user.count({ where }),
  ])

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) })
}
