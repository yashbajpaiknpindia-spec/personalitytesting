// src/app/api/website/[id]/track/route.ts
// POST /api/website/[id]/track
// Public endpoint — no auth. Records a page visit from an anonymous website visitor.
// Called by the bs-tracker snippet injected into every /w/[slug] served page.
//
// Body: { sessionId: string, durationMs?: number }
//   - First call: durationMs omitted → records the page view
//   - Second call (on pagehide/visibilitychange): durationMs set → records session duration

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Write-rate limiter: max 60 POSTs per IP per minute (prevents bot spam)
const rl = new Map<string, { count: number; resetAt: number }>()

function allow(ip: string): boolean {
  const now = Date.now()
  const entry = rl.get(ip)
  if (!entry || now > entry.resetAt) {
    rl.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 60) return false
  entry.count++
  return true
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
    if (!allow(ip)) return NextResponse.json({ ok: false }, { status: 429 })

    const site = await db.userWebsite.findUnique({
      where:  { id: params.id },
      select: { userId: true, slug: true, isPublished: true },
    })
    if (!site || !site.isPublished || !site.slug) {
      return NextResponse.json({ ok: false })
    }

    const body = await req.json().catch(() => ({}))
    const { sessionId, durationMs } = body as { sessionId?: string; durationMs?: number }

    const safeSession  = sessionId ? String(sessionId).slice(0, 64) : null
    const safeDuration = typeof durationMs === 'number' && durationMs > 0 && durationMs < 7_200_000
      ? Math.round(durationMs)
      : null
    const ua   = req.headers.get('user-agent')?.slice(0, 300) ?? null
    const page = `/w/${site.slug}`

    // Use Prisma ORM — no raw SQL, no extension dependencies
    await db.pageVisit.create({
      data: {
        userId:     site.userId,
        page,
        durationMs: safeDuration,
        sessionId:  safeSession,
        userAgent:  ua,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Swallow silently — tracking must never block or error the visitor
    console.error('[track]', err)
    return NextResponse.json({ ok: false })
  }
}
