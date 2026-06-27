import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// ── PUT /api/projects/:id ─────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await db.project.findUnique({ where: { id: params.id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }

    const body = await req.json()
    const { title, description, url, imageUrl, tags, featured, order } = body as {
      title?: string
      description?: string
      url?: string
      imageUrl?: string
      tags?: string[]
      featured?: boolean
      order?: number
    }

    const project = await db.project.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(url !== undefined && { url: url.trim() }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl.trim() }),
        ...(tags !== undefined && { tags }),
        ...(featured !== undefined && { featured }),
        ...(order !== undefined && { order }),
      },
    })

    return NextResponse.json({ project })
  } catch (err) {
    console.error('[projects/PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── DELETE /api/projects/:id ──────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await db.project.findUnique({ where: { id: params.id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }

    await db.project.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[projects/DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
