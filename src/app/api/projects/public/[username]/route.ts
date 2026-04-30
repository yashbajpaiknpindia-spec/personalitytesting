import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET /api/projects/public/:username — no auth required ─────────────────
// Used by the public portfolio page to display the owner's projects
export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } },
) {
  try {
    const user = await db.user.findUnique({
      where: { username: params.username },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const projects = await db.project.findMany({
      where: {
        userId: user.id,
        publishedAt: { not: null },
      },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      select: {
        id: true, title: true, description: true,
        url: true, imageUrl: true, tags: true,
        featured: true, publishedAt: true,
      },
    })

    return NextResponse.json({ projects })
  } catch (err) {
    console.error('[projects/public/GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
