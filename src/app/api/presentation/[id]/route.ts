import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// ── GET /api/presentation/:id ─────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const presentation = await db.presentation.findUnique({
      where: { id: params.id },
      include: {
        slides: { orderBy: { order: 'asc' } },
      },
    })

    if (!presentation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Only owner can access (unless public share via slug route)
    if (presentation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ presentation })
  } catch (err) {
    console.error('[presentation/GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── DELETE /api/presentation/:id ─────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await db.presentation.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ success: true }) // already gone
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cascade deletes slides via FK constraint
    await db.presentation.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[presentation/DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
// ── PUT /api/presentation/:id ─────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, accentColor } = body as { title?: string; accentColor?: string }

    const existing = await db.presentation.findUnique({ where: { id: params.id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }

    const updated = await db.presentation.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(accentColor !== undefined && { accentColor }),
      },
      include: { slides: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({ presentation: updated })
  } catch (err) {
    console.error('[presentation/PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
