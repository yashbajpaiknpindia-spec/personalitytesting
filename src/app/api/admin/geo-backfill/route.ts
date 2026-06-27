// src/app/api/admin/geo-backfill/route.ts
// One-shot: for users whose location is null, look up IP from their most recent
// page_visit userAgent (we don't store IPs in page_visits) — so instead we use
// a different strategy: scan ApiCallLog for stored generationId, which has no IP either.
//
// Practical reality: we have NO stored IPs for existing users.
// This endpoint instead lets the admin MANUALLY set a default location for all
// null-location users (e.g. "India") so the region chart shows data, AND it
// returns a count of how many users still have no location.
//
// Going forward, new registrations get geo-located automatically via register/route.ts.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session.user
}

// GET — returns count of users missing location
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const [total, withLocation, withoutLocation] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { location: { not: null } } }),
    db.user.count({ where: { location: null } }),
  ])

  return NextResponse.json({ total, withLocation, withoutLocation })
}

// POST — body: { defaultLocation: "India" } → sets location for all null-location users
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const defaultLocation = typeof body.defaultLocation === 'string' && body.defaultLocation.trim()
    ? body.defaultLocation.trim()
    : 'India'

  const result = await db.user.updateMany({
    where: { location: null },
    data: { location: defaultLocation },
  })

  return NextResponse.json({
    updated: result.count,
    location: defaultLocation,
    message: `Set location="${defaultLocation}" for ${result.count} users who had no location.`,
  })
}
