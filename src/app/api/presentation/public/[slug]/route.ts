import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET /api/presentation/public/:slug ────────────────────────────────────
// No auth required — public read-only view for share links
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const presentation = await db.presentation.findUnique({
      where: { slug: params.slug },
      include: {
        slides: { orderBy: { order: 'asc' } },
        user: { select: { name: true, jobTitle: true, image: true } },
      },
    })

    if (!presentation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Strip userId from public response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId, ...safe } = presentation

    return NextResponse.json({ presentation: safe })
  } catch (err) {
    console.error('[presentation/public]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
