import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { threadId: string } }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thread = await db.chatThread.findFirst({
    where: { id: params.threadId, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!thread) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  return NextResponse.json({ thread })
}

export async function DELETE(_: Request, { params }: { params: { threadId: string } }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thread = await db.chatThread.findFirst({ where: { id: params.threadId, userId } })
  if (!thread) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

  // ChatMessage rows cascade-delete via the schema's onDelete: Cascade relation.
  await db.chatThread.delete({ where: { id: params.threadId } })
  return NextResponse.json({ success: true })
}
