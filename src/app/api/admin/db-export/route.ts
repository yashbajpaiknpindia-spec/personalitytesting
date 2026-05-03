import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'

// BigInt-safe JSON serializer — Prisma $queryRaw can return BigInt for numeric columns.
function safeJson(data: unknown): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  )
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user.email !== ADMIN_EMAIL && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const tablesParam = url.searchParams.get('tables')
  const filterTables = tablesParam ? tablesParam.split(',').map(t => t.trim().toLowerCase()) : null

  const include = (name: string) => !filterTables || filterTables.includes(name)

  // Wraps a Prisma model query with a raw SQL fallback.
  // Some models (Contact, CardView, SocialLinks, ResumeVersion) have no @@map so
  // their table names in Postgres are PascalCase. If the Prisma client call fails
  // for any reason (client not regenerated, connection hiccup) we fall back to raw SQL.
  async function safeQuery<T>(
    name: string,
    fn: () => Promise<T>,
    rawFallback?: () => Promise<unknown>
  ): Promise<T | null> {
    try {
      return await fn()
    } catch (primaryErr) {
      console.warn(`[db-export] primary query failed for "${name}":`, String(primaryErr))
      if (rawFallback) {
        try {
          const result = await rawFallback()
          return result as T
        } catch (fallbackErr) {
          console.warn(`[db-export] raw fallback also failed for "${name}":`, String(fallbackErr))
        }
      }
      return null
    }
  }

  try {
    const [
      users,
      templates,
      generations,
      exports_,
      portfolios,
      contacts,
      cardViews,
      analyticsEvents,
      socialLinks,
      domains,
      projects,
      seoSettings,
      blogPosts,
      presentations,
      slides,
      resumeVersions,
      apiCallLogs,
      adminSettings,
      notifications,
      notificationReads,
      pageVisits,
      pricingPlans,
    ] = await Promise.all([
      include('users')
        ? safeQuery('users', () => db.user.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      include('templates')
        ? safeQuery('templates', () => db.template.findMany({ orderBy: { sortOrder: 'asc' } }))
        : Promise.resolve(null),

      include('generations')
        ? safeQuery('generations', () => db.generation.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      include('exports')
        ? safeQuery('exports', () => db['export'].findMany({ orderBy: { createdAt: 'asc' } }),
            () => db.$queryRaw`SELECT * FROM "Export" ORDER BY "createdAt" ASC`)
        : Promise.resolve(null),

      include('portfolios')
        ? safeQuery('portfolios', () => db.portfolio.findMany({ orderBy: { publishedAt: 'asc' } }))
        : Promise.resolve(null),

      // Contact has no @@map → table is "Contact" in Postgres
      include('contacts')
        ? safeQuery('contacts', () => db.contact.findMany({ orderBy: { createdAt: 'asc' } }),
            () => db.$queryRaw`SELECT * FROM "Contact" ORDER BY "createdAt" ASC`)
        : Promise.resolve(null),

      // CardView has no @@map → table is "CardView" in Postgres
      include('cardviews')
        ? safeQuery('cardViews', () => db.cardView.findMany({ orderBy: { createdAt: 'asc' } }),
            () => db.$queryRaw`SELECT * FROM "CardView" ORDER BY "createdAt" ASC`)
        : Promise.resolve(null),

      include('analytics_events')
        ? safeQuery('analyticsEvents', () => db.analyticsEvent.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      // SocialLinks has no @@map → table is "SocialLinks" in Postgres
      include('sociallinks')
        ? safeQuery('socialLinks', () => db.socialLinks.findMany({ orderBy: { createdAt: 'asc' } }),
            () => db.$queryRaw`SELECT * FROM "SocialLinks" ORDER BY "createdAt" ASC`)
        : Promise.resolve(null),

      include('domains')
        ? safeQuery('domains', () => db.domain.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      include('projects')
        ? safeQuery('projects', () => db.project.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      include('seo_settings')
        ? safeQuery('seoSettings', () => db.seoSettings.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      include('blog_posts')
        ? safeQuery('blogPosts', () => db.blogPost.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      include('presentations')
        ? safeQuery('presentations', () =>
            db.presentation.findMany({
              orderBy: { createdAt: 'asc' },
              include: { slides: { orderBy: { order: 'asc' } } },
            }))
        : Promise.resolve(null),

      include('slides')
        ? safeQuery('slides', () => db.slide.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      // ResumeVersion has no @@map → table is "ResumeVersion" in Postgres
      include('resumeversions')
        ? safeQuery('resumeVersions', () => db.resumeVersion.findMany({ orderBy: { createdAt: 'asc' } }),
            () => db.$queryRaw`SELECT * FROM "ResumeVersion" ORDER BY "createdAt" ASC`)
        : Promise.resolve(null),

      include('api_call_logs')
        ? safeQuery('apiCallLogs', () => db.apiCallLog.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      include('admin_settings')
        ? safeQuery('adminSettings', () => db.adminSettings.findMany())
        : Promise.resolve(null),

      include('notifications')
        ? safeQuery('notifications', () => db.notification.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      include('notification_reads')
        ? safeQuery('notificationReads', () => db.notificationRead.findMany({ orderBy: { readAt: 'asc' } }))
        : Promise.resolve(null),

      include('page_visits')
        ? safeQuery('pageVisits', () => db.pageVisit.findMany({ orderBy: { createdAt: 'asc' } }))
        : Promise.resolve(null),

      include('pricing_plans')
        ? safeQuery('pricingPlans', () => db.pricingPlan.findMany({ orderBy: { sortOrder: 'asc' } }))
        : Promise.resolve(null),
    ])

    const safeUsers = users?.map(u => {
      const { password: _pw, ...rest } = u as Record<string, unknown>
      void _pw
      return rest
    }) ?? null

    // Build the data map
    const dataMap: Record<string, unknown> = {
      users:              safeUsers,
      templates,
      generations,
      exports:            exports_,
      portfolios,
      contacts,
      card_views:         cardViews,
      analytics_events:   analyticsEvents,
      social_links:       socialLinks,
      domains,
      projects,
      seo_settings:       seoSettings,
      blog_posts:         blogPosts,
      presentations,
      slides,
      resume_versions:    resumeVersions,
      api_call_logs:      apiCallLogs,
      admin_settings:     adminSettings,
      notifications,
      notification_reads: notificationReads,
      page_visits:        pageVisits,
      pricing_plans:      pricingPlans,
    }

    // _meta always lists ALL 22 tables — null means query failed (skip in import)
    const tableMeta = Object.entries(dataMap).map(([table, v]) => ({
      table,
      rowCount: Array.isArray(v) ? v.length : null,
      status: v === null ? 'skipped' : 'ok',
    }))

    const payload = {
      _meta: {
        exportedAt:    new Date().toISOString(),
        exportedBy:    session?.user?.email ?? 'admin',
        appVersion:    '1.0.0',
        schemaVersion: '7',
        note:          'Passwords are excluded from export for security. Re-hash on import. Tables with status="skipped" had query errors and contain no data.',
        totalTables:   tableMeta.length,
        exportedCount: tableMeta.filter(t => t.status === 'ok').length,
        skippedCount:  tableMeta.filter(t => t.status === 'skipped').length,
        tables:        tableMeta,
      },
      data: dataMap,
    }

    const json = safeJson(payload)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `brandsyndicate-db-export-${timestamp}.json`

    const exportedTables = tableMeta.filter(t => t.status === 'ok')

    return new Response(json, {
      status: 200,
      headers: {
        'Content-Type':        'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
        'X-Export-Total':      String(tableMeta.length),
        'X-Export-Rows':       exportedTables.map(t => `${t.table}:${t.rowCount}`).join(', '),
        'X-Export-Skipped':    tableMeta.filter(t => t.status === 'skipped').map(t => t.table).join(', '),
      },
    })
  } catch (err) {
    console.error('[db-export]', err)
    return NextResponse.json({ error: 'Export failed', detail: String(err) }, { status: 500 })
  }
}
