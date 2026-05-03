import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// ── PUT /api/presentation/slide/:slideId ──────────────────────────────────
// Update slide content (inline editing persists here)
export async function PUT(
  req: NextRequest,
  { params }: { params: { slideId: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { content } = body as { content: object }

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    // Verify ownership via joined query
    const slide = await db.slide.findUnique({
      where: { id: params.slideId },
      include: { presentation: { select: { userId: true } } },
    })

    if (!slide || slide.presentation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }

    const updated = await db.slide.update({
      where: { id: params.slideId },
      data: { content: content as never },
    })

    return NextResponse.json({ slide: updated })
  } catch (err) {
    console.error('[slide/PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── DELETE /api/presentation/slide/:slideId ───────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slideId: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slide = await db.slide.findUnique({
      where: { id: params.slideId },
      include: { presentation: { select: { userId: true, id: true } } },
    })

    if (!slide || slide.presentation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }

    const presentationId = slide.presentation.id
    const deletedOrder = slide.order

    await db.slide.delete({ where: { id: params.slideId } })

    // Re-compact orders
    await db.slide.updateMany({
      where: { presentationId, order: { gt: deletedOrder } },
      data: { order: { decrement: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[slide/DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
