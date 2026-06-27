import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || 30), 100)
  const threads = await db.chatThread.findMany({
    where: { userId },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    take: limit,
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  const totals = await db.chatMessage.aggregate({
    where: { userId, role: 'assistant' },
    _sum: { costInr: true, costUsd: true, totalTokens: true },
  })
  return NextResponse.json({ threads, totals: totals._sum })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const title = String(body.title || 'New chat').slice(0, 80)
  const mode = String(body.mode || 'brand_studio').slice(0, 40)
  const thread = await db.chatThread.create({ data: { userId, title, mode, lastMessageAt: new Date() } })
  return NextResponse.json({ thread })
}
