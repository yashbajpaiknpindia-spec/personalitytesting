import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function bigintSafeResponse(data: unknown): Response {
  const json = JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  )
  return new Response(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const days = Math.min(Math.max(Number(searchParams.get('days') || '30'), 1), 365)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  try {
    const [topPages, activeUsers, recentVisits, dailyTrend, visitSummary, signupSummary] = await Promise.all([
      db.$queryRaw`
        SELECT
          pv.page,
          COUNT(*) FILTER (WHERE pv."durationMs" IS NULL)::int AS visits,
          COUNT(DISTINCT pv."userId") FILTER (WHERE pv."durationMs" IS NULL)::int AS "uniqueUsers",
          COALESCE(AVG(pv."durationMs") FILTER (WHERE pv."durationMs" IS NOT NULL AND pv."durationMs" > 0), 0)::int AS "avgDuration",
          MAX(pv."createdAt") AS "lastVisit"
        FROM page_visits pv
        WHERE pv."createdAt" >= ${since}
        GROUP BY pv.page
        ORDER BY visits DESC
        LIMIT 30
      ` as Promise<Record<string, unknown>[]>,

      db.$queryRaw`
        SELECT
          pv."userId",
          COALESCE(u.email, '') AS email,
          COALESCE(u.name, u.email, u.phone, 'User') AS name,
          u.phone,
          u.plan::text AS plan,
          u.location,
          COUNT(DISTINCT pv.page) FILTER (WHERE pv."durationMs" IS NULL)::int AS "uniquePages",
          COUNT(*) FILTER (WHERE pv."durationMs" IS NULL)::int AS "totalVisits",
          COALESCE(SUM(pv."durationMs") FILTER (WHERE pv."durationMs" IS NOT NULL AND pv."durationMs" > 0), 0)::float8 AS "totalDuration",
          COALESCE(AVG(pv."durationMs") FILTER (WHERE pv."durationMs" IS NOT NULL AND pv."durationMs" > 0), 0)::int AS "avgDuration",
          MAX(pv."createdAt") AS "lastSeen"
        FROM page_visits pv
        LEFT JOIN "User" u ON u.id = pv."userId"
        WHERE pv."createdAt" >= ${since}
          AND pv."userId" IS NOT NULL
        GROUP BY pv."userId", u.email, u.name, u.phone, u.plan, u.location
        ORDER BY "totalVisits" DESC
        LIMIT 25
      ` as Promise<Record<string, unknown>[]>,

      db.$queryRaw`
        SELECT
          pv.id,
          pv."userId",
          pv.page,
          pv."durationMs",
          pv."createdAt",
          COALESCE(u.email, '') AS email,
          COALESCE(u.name, u.email, u.phone, 'User') AS name,
          u.phone,
          u.plan::text AS plan,
          u.location
        FROM page_visits pv
        LEFT JOIN "User" u ON u.id = pv."userId"
        WHERE pv."createdAt" >= ${since}
        ORDER BY pv."createdAt" DESC
        LIMIT 250
      ` as Promise<Record<string, unknown>[]>,

      db.$queryRaw`
        SELECT
          d.day::date::text AS date,
          COALESCE(v.visits, 0)::int AS visits,
          COALESCE(v."uniqueUsers", 0)::int AS "uniqueUsers",
          COALESCE(s.signups, 0)::int AS signups,
          CASE WHEN COALESCE(v.visits, 0) > 0 THEN ROUND((COALESCE(s.signups, 0)::numeric / v.visits::numeric) * 100, 2)::float8 ELSE 0 END AS "signupRate"
        FROM generate_series(date_trunc('day', ${since}::timestamp), date_trunc('day', NOW()), interval '1 day') d(day)
        LEFT JOIN (
          SELECT DATE(pv."createdAt") AS day,
                 COUNT(*) FILTER (WHERE pv."durationMs" IS NULL)::int AS visits,
                 COUNT(DISTINCT pv."userId") FILTER (WHERE pv."durationMs" IS NULL)::int AS "uniqueUsers"
          FROM page_visits pv
          WHERE pv."createdAt" >= ${since}
          GROUP BY DATE(pv."createdAt")
        ) v ON v.day = d.day::date
        LEFT JOIN (
          SELECT DATE(u."createdAt") AS day, COUNT(*)::int AS signups
          FROM "User" u
          WHERE u."createdAt" >= ${since}
          GROUP BY DATE(u."createdAt")
        ) s ON s.day = d.day::date
        ORDER BY date ASC
      ` as Promise<Record<string, unknown>[]>,

      db.$queryRaw`
        SELECT
          COUNT(*) FILTER (WHERE "durationMs" IS NULL)::int AS "totalVisits",
          COUNT(DISTINCT "userId") FILTER (WHERE "durationMs" IS NULL)::int AS "uniqueUsers",
          COUNT(DISTINCT page) FILTER (WHERE "durationMs" IS NULL)::int AS "uniquePages",
          COALESCE(AVG("durationMs") FILTER (WHERE "durationMs" IS NOT NULL AND "durationMs" > 0), 0)::int AS "avgDuration"
        FROM page_visits
        WHERE "createdAt" >= ${since}
      ` as Promise<Record<string, unknown>[]>,

      db.$queryRaw`
        SELECT COUNT(*)::int AS signups
        FROM "User"
        WHERE "createdAt" >= ${since}
      ` as Promise<Record<string, unknown>[]>,
    ])

    const baseSummary = (visitSummary[0] ?? {}) as Record<string, any>
    const totalVisits = Number(baseSummary.totalVisits ?? 0)
    const signups = Number((signupSummary[0] as any)?.signups ?? 0)
    const summary = {
      totalVisits,
      uniqueUsers: Number(baseSummary.uniqueUsers ?? 0),
      uniquePages: Number(baseSummary.uniquePages ?? 0),
      avgDuration: Number(baseSummary.avgDuration ?? 0),
      signups,
      signupRate: totalVisits > 0 ? Number(((signups / totalVisits) * 100).toFixed(2)) : 0,
    }

    return bigintSafeResponse({
      topPages,
      activeUsers,
      recentVisits,
      dailyTrend,
      summary,
      days,
    })
  } catch (err) {
    console.error('[page-analytics] DB error:', err)
    return NextResponse.json({
      topPages: [], activeUsers: [], recentVisits: [], dailyTrend: [],
      summary: { totalVisits: 0, uniqueUsers: 0, uniquePages: 0, avgDuration: 0, signups: 0, signupRate: 0 },
      days,
      _error: String(err),
    })
  }
}
