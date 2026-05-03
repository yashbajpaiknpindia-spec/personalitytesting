import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'

// Prisma $queryRaw returns PostgreSQL bigint/numeric columns as JS BigInt which
// JSON.stringify cannot serialize. This replacer converts BigInt → Number safely.
function bigintSafeResponse(data: unknown): Response {
  const json = JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  )
  return new Response(json, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── HOW TRACKING WORKS ───────────────────────────────────────────────────────
// usePageTracker inserts TWO rows per page view:
//   1. Arrival ping:   { durationMs: NULL }  — fires when user lands on page
//   2. Departure ping: { durationMs: N }     — fires on next navigation or tab close
//
// So the correct "visit count" = count of arrival pings (durationMs IS NULL).
// Duration stats come only from departure pings (durationMs IS NOT NULL AND > 0).
// This avoids double-counting that COUNT(*) would produce.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin =
    session.user.email === ADMIN_EMAIL ||
    (session.user as unknown as Record<string, unknown>).role === 'ADMIN'
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const days  = Math.min(Number(searchParams.get('days') || '30'), 90)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  try {
    // Run all queries in parallel for speed
    const [topPages, activeUsers, recentVisits, summary, dailyTrend] = await Promise.all([

      // Top pages — visit count = arrival pings; avg duration from departure pings only
      db.$queryRaw`
        SELECT
          pv.page,
          COUNT(*) FILTER (WHERE pv."durationMs" IS NULL)::int            AS visits,
          COUNT(DISTINCT pv."userId") FILTER (WHERE pv."durationMs" IS NULL)::int
                                                                           AS "uniqueUsers",
          COALESCE(
            AVG(pv."durationMs") FILTER (WHERE pv."durationMs" IS NOT NULL AND pv."durationMs" > 0),
            0
          )::int                                                           AS "avgDuration",
          MAX(pv."createdAt")                                              AS "lastVisit"
        FROM page_visits pv
        WHERE pv."createdAt" >= ${since}
        GROUP BY pv.page
        ORDER BY visits DESC
        LIMIT 30
      ` as Promise<Record<string, unknown>[]>,

      // Most active users — visit count = arrival pings; duration from departure pings
      db.$queryRaw`
        SELECT
          pv."userId",
          COALESCE(u.email, 'guest')                                       AS email,
          COALESCE(u.name,  'Guest')                                       AS name,
          COUNT(DISTINCT pv.page) FILTER (WHERE pv."durationMs" IS NULL)::int
                                                                           AS "uniquePages",
          COUNT(*) FILTER (WHERE pv."durationMs" IS NULL)::int             AS "totalVisits",
          COALESCE(
            SUM(pv."durationMs") FILTER (WHERE pv."durationMs" IS NOT NULL AND pv."durationMs" > 0),
            0
          )::float8                                                        AS "totalDuration",
          COALESCE(
            AVG(pv."durationMs") FILTER (WHERE pv."durationMs" IS NOT NULL AND pv."durationMs" > 0),
            0
          )::int                                                           AS "avgDuration"
        FROM page_visits pv
        LEFT JOIN "User" u ON u.id = pv."userId"
        WHERE pv."createdAt" >= ${since}
          AND pv."userId" IS NOT NULL
        GROUP BY pv."userId", u.email, u.name
        ORDER BY "totalVisits" DESC
        LIMIT 25
      ` as Promise<Record<string, unknown>[]>,

      // Recent visits — show arrival pings only (one row per actual page visit)
      // and surface the best-available duration for that visit
      db.$queryRaw`
        SELECT
          pv.id,
          pv."userId",
          pv.page,
          pv."durationMs",
          pv."createdAt",
          COALESCE(u.email, 'guest')  AS email,
          COALESCE(u.name,  'Guest')  AS name
        FROM page_visits pv
        LEFT JOIN "User" u ON u.id = pv."userId"
        WHERE pv."createdAt" >= ${since}
        ORDER BY pv."createdAt" DESC
        LIMIT 200
      ` as Promise<Record<string, unknown>[]>,

      // Summary — visits = arrival pings, duration from departure pings
      db.$queryRaw`
        SELECT
          COUNT(*) FILTER (WHERE "durationMs" IS NULL)::int               AS "totalVisits",
          COUNT(DISTINCT "userId") FILTER (WHERE "durationMs" IS NULL)::int
                                                                           AS "uniqueUsers",
          COUNT(DISTINCT page) FILTER (WHERE "durationMs" IS NULL)::int   AS "uniquePages",
          COALESCE(
            AVG("durationMs") FILTER (WHERE "durationMs" IS NOT NULL AND "durationMs" > 0),
            0
          )::int                                                           AS "avgDuration"
        FROM page_visits
        WHERE "createdAt" >= ${since}
      ` as Promise<Record<string, unknown>[]>,

      // Daily trend — one data point per day, visit count = arrival pings
      db.$queryRaw`
        SELECT
          DATE(pv."createdAt")::text                                       AS date,
          COUNT(*) FILTER (WHERE pv."durationMs" IS NULL)::int             AS visits,
          COUNT(DISTINCT pv."userId") FILTER (WHERE pv."durationMs" IS NULL)::int
                                                                           AS "uniqueUsers"
        FROM page_visits pv
        WHERE pv."createdAt" >= ${since}
        GROUP BY DATE(pv."createdAt")
        ORDER BY date ASC
      ` as Promise<Record<string, unknown>[]>,
    ])

    return bigintSafeResponse({
      topPages,
      activeUsers,
      recentVisits,
      dailyTrend,
      summary: summary[0] ?? { totalVisits: 0, uniqueUsers: 0, uniquePages: 0, avgDuration: 0 },
      days,
    })

  } catch (err) {
    console.error('[page-analytics] DB error:', err)
    // Return empty structure with the actual error so admin can see what's wrong
    return NextResponse.json({
      topPages: [], activeUsers: [], recentVisits: [], dailyTrend: [],
      summary: { totalVisits: 0, uniqueUsers: 0, uniquePages: 0, avgDuration: 0 },
      days,
      _error: String(err),
    })
  }
}
