// src/app/api/user-websites/[id]/analytics/route.ts
// GET /api/user-websites/[id]/analytics?days=30
// Returns built-in analytics for a user's website (no GA4 required)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

function bigintSafe(data: unknown): NextResponse {
  const json = JSON.stringify(data, (_k, v) =>
    typeof v === 'bigint' ? Number(v) : v
  )
  return new NextResponse(json, { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.email === 'yashbajpaiknpindia@gmail.com'

  // Verify ownership
  const website = isAdmin
    ? await db.userWebsite.findUnique({ where: { id: params.id }, select: { id: true, slug: true, name: true, isPublished: true } })
    : await db.userWebsite.findFirst({ where: { id: params.id, userId: session.user.id }, select: { id: true, slug: true, name: true, isPublished: true } })

  if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!website.slug) return NextResponse.json({ analytics: null, message: 'No slug yet' })

  const { searchParams } = new URL(req.url)
  const daysParam = Number(searchParams.get('days') || '30')
  // Cap at 3650 (10 years) — the overview tab requests 9999 for all-time
  const days = Math.min(daysParam, 3650)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const slug = website.slug
  // Website pages are tracked as /w/<slug> or /w/<slug>/*
  const pagePattern = `/w/${slug}`

  try {
    const [summary, dailyTrend, topReferrers, recentVisits] = await Promise.all([

      // Overall summary: total views, unique sessions, avg duration
      db.$queryRaw`
        SELECT
          COUNT(*) FILTER (WHERE "durationMs" IS NULL)::int           AS "totalViews",
          COUNT(DISTINCT "sessionId") FILTER (WHERE "durationMs" IS NULL)::int AS "uniqueSessions",
          COALESCE(AVG("durationMs") FILTER (WHERE "durationMs" IS NOT NULL AND "durationMs" > 0), 0)::int AS "avgDurationMs"
        FROM page_visits
        WHERE page LIKE ${pagePattern + '%'}
          AND "createdAt" >= ${since}
      ` as Promise<Array<{ totalViews: number; uniqueSessions: number; avgDurationMs: number }>>,

      // Daily breakdown for trend chart
      db.$queryRaw`
        SELECT
          DATE("createdAt" AT TIME ZONE 'UTC')::text  AS date,
          COUNT(*) FILTER (WHERE "durationMs" IS NULL)::int  AS views,
          COUNT(DISTINCT "sessionId") FILTER (WHERE "durationMs" IS NULL)::int AS visitors
        FROM page_visits
        WHERE page LIKE ${pagePattern + '%'}
          AND "createdAt" >= ${since}
        GROUP BY DATE("createdAt" AT TIME ZONE 'UTC')
        ORDER BY date ASC
      ` as Promise<Array<{ date: string; views: number; visitors: number }>>,

      // Top pages within this website (for sites with sub-pages)
      db.$queryRaw`
        SELECT
          page,
          COUNT(*) FILTER (WHERE "durationMs" IS NULL)::int AS views,
          COALESCE(AVG("durationMs") FILTER (WHERE "durationMs" IS NOT NULL AND "durationMs" > 0), 0)::int AS "avgDurationMs"
        FROM page_visits
        WHERE page LIKE ${pagePattern + '%'}
          AND "createdAt" >= ${since}
          AND "durationMs" IS NULL
        GROUP BY page
        ORDER BY views DESC
        LIMIT 10
      ` as Promise<Array<{ page: string; views: number; avgDurationMs: number }>>,

      // Recent 200 visits — used for device/browser breakdown (10 is too few for real data)
      db.$queryRaw`
        SELECT
          "createdAt",
          "userAgent",
          "sessionId"
        FROM page_visits
        WHERE page LIKE ${pagePattern + '%'}
          AND "durationMs" IS NULL
        ORDER BY "createdAt" DESC
        LIMIT 200
      ` as Promise<Array<{ createdAt: Date; userAgent: string | null; sessionId: string | null }>>,

    ])

    const s = summary[0] ?? { totalViews: 0, uniqueSessions: 0, avgDurationMs: 0 }

    // Fill missing days in trend (so chart has continuous axis)
    const trendMap = new Map(dailyTrend.map(r => [r.date, r]))
    const filledTrend: Array<{ date: string; views: number; visitors: number }> = []
    for (let d = 0; d < days; d++) {
      const dt = new Date(since.getTime() + d * 86400000)
      const key = dt.toISOString().slice(0, 10)
      filledTrend.push(trendMap.get(key) ?? { date: key, views: 0, visitors: 0 })
    }

    // Parse device/browser from userAgent simply
    function parseDevice(ua: string | null) {
      if (!ua) return 'Unknown'
      if (/Mobile|Android|iPhone/i.test(ua)) return 'Mobile'
      if (/Tablet|iPad/i.test(ua)) return 'Tablet'
      return 'Desktop'
    }
    function parseBrowser(ua: string | null) {
      if (!ua) return 'Unknown'
      if (/Edg\//i.test(ua)) return 'Edge'
      if (/Chrome/i.test(ua)) return 'Chrome'
      if (/Firefox/i.test(ua)) return 'Firefox'
      if (/Safari/i.test(ua)) return 'Safari'
      if (/Opera|OPR/i.test(ua)) return 'Opera'
      return 'Other'
    }

    // Device breakdown from recent visits
    const deviceCount: Record<string, number> = {}
    const browserCount: Record<string, number> = {}
    for (const v of recentVisits) {
      const device = parseDevice(v.userAgent)
      const browser = parseBrowser(v.userAgent)
      deviceCount[device] = (deviceCount[device] ?? 0) + 1
      browserCount[browser] = (browserCount[browser] ?? 0) + 1
    }

    return bigintSafe({
      websiteId: website.id,
      slug,
      days,
      summary: {
        totalViews:    s.totalViews,
        uniqueSessions: s.uniqueSessions,
        avgDurationMs: s.avgDurationMs,
        avgDurationSec: Math.round(s.avgDurationMs / 1000),
      },
      trend:       filledTrend,
      topPages:    topReferrers,
      devices:     Object.entries(deviceCount).map(([name, count]) => ({ name, count })),
      browsers:    Object.entries(browserCount).map(([name, count]) => ({ name, count })),
      recentVisits: recentVisits.slice(0, 5).map(v => ({
        createdAt: v.createdAt,
        device: parseDevice(v.userAgent),
        browser: parseBrowser(v.userAgent),
      })),
    })
  } catch (err) {
    console.error('[website-analytics]', err)
    return NextResponse.json({ error: 'Analytics query failed' }, { status: 500 })
  }
}
