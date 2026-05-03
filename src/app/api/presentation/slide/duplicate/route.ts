import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// ── POST /api/presentation/slide/duplicate ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { slideId } = body as { slideId: string }

    if (!slideId) {
      return NextResponse.json({ error: 'slideId required' }, { status: 400 })
    }

    const original = await db.slide.findUnique({
      where: { id: slideId },
      include: { presentation: { select: { userId: true, id: true } } },
    })

    if (!original || original.presentation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }

    const presentationId = original.presentation.id
    const insertAt = original.order + 1

    // Shift slides after original up by 1
    await db.slide.updateMany({
      where: { presentationId, order: { gte: insertAt } },
      data: { order: { increment: 1 } },
    })

    const duplicate = await db.slide.create({
      data: {
        presentationId,
        order: insertAt,
        content: original.content as never,
      },
    })

    return NextResponse.json({ slide: duplicate }, { status: 201 })
  } catch (err) {
    console.error('[slide/duplicate]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
