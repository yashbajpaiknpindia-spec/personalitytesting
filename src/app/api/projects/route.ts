import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// ── POST /api/projects — create a project ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const {
      title,
      description,
      url,
      imageUrl,
      tags = [],
      featured = false,
    } = body as {
      title: string
      description?: string
      url?: string
      imageUrl?: string
      tags?: string[]
      featured?: boolean
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    // Place new project at end of list
    const maxOrder = await db.project.aggregate({
      where: { userId },
      _max: { order: true },
    })
    const order = (maxOrder._max.order ?? -1) + 1

    const project = await db.project.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim(),
        url: url?.trim(),
        imageUrl: imageUrl?.trim(),
        tags,
        featured,
        order,
        publishedAt: new Date(),
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (err) {
    console.error('[projects/POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── GET /api/projects — list own projects ────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await db.project.findMany({
      where: { userId: session.user.id },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    })

    return NextResponse.json({ projects })
  } catch (err) {
    console.error('[projects/GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
