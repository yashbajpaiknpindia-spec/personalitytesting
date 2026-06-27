import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { updateUserLastLocation } from '@/lib/geo'

export const dynamic = 'force-dynamic'

// POST /api/analytics/page-visit, track a page visit with duration
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false })

  const userId = session.user.id

  try {
    const body = await req.json()
    const { page, durationMs, sessionId } = body

    if (!page) return NextResponse.json({ ok: false })

    // Update last known approximate location when a real page entry is recorded.
    // This is best-effort and skipped when a usable location already exists unless edge headers provide a fresher one.
    if (durationMs === null || durationMs === undefined) {
      updateUserLastLocation(userId, req, { force: true }).catch(() => {})
    }

    await db.$executeRaw`
      INSERT INTO page_visits (id, "userId", page, "durationMs", "sessionId", "userAgent", "createdAt")
      VALUES (
        gen_random_uuid()::text,
        ${userId},
        ${String(page).substring(0, 255)},
        ${durationMs ? Number(durationMs) : null},
        ${sessionId || null},
        ${req.headers.get('user-agent')?.substring(0, 300) || null},
        NOW()
      )
    `

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
