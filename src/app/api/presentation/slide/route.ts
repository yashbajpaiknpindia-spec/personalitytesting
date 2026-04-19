import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// ── POST /api/presentation/slide ──────────────────────────────────────────
// Add a new blank slide to a presentation
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { presentationId, afterOrder, content } = body as {
      presentationId: string
      afterOrder?: number   // insert after this order index; defaults to end
      content?: object
    }

    if (!presentationId) {
      return NextResponse.json({ error: 'presentationId required' }, { status: 400 })
    }

    // Verify ownership
    const presentation = await db.presentation.findUnique({
      where: { id: presentationId },
      include: { slides: { orderBy: { order: 'asc' } } },
    })
    if (!presentation || presentation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }

    // Determine insertion order
    const insertAt = afterOrder !== undefined ? afterOrder + 1 : presentation.slides.length

    // Shift all slides at or after insertAt up by 1
    await db.slide.updateMany({
      where: { presentationId, order: { gte: insertAt } },
      data: { order: { increment: 1 } },
    })

    const defaultContent = content ?? { type: 'content', heading: 'New Slide', body: '' }

    const slide = await db.slide.create({
      data: {
        presentationId,
        order: insertAt,
        content: defaultContent as never,
      },
    })

    return NextResponse.json({ slide }, { status: 201 })
  } catch (err) {
    console.error('[slide/POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
