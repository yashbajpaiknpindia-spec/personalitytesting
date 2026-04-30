import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// ── PUT /api/presentation/slide/reorder ───────────────────────────────────
// Body: { presentationId: string, orderedIds: string[] }
// orderedIds = slide IDs in their new order (index === new order value)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { presentationId, orderedIds } = body as {
      presentationId: string
      orderedIds: string[]
    }

    if (!presentationId || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'presentationId and orderedIds required' }, { status: 400 })
    }

    // Verify ownership
    const presentation = await db.presentation.findUnique({
      where: { id: presentationId },
      select: { userId: true },
    })

    if (!presentation || presentation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }

    // Batch-update orders in a transaction
    await db.$transaction(
      orderedIds.map((slideId, newOrder) =>
        db.slide.update({
          where: { id: slideId },
          data: { order: newOrder },
        }),
      ),
    )

    // Return fresh ordered slides
    const slides = await db.slide.findMany({
      where: { presentationId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ slides })
  } catch (err) {
    console.error('[slide/reorder]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
