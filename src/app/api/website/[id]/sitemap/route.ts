// src/app/api/website/[id]/sitemap/route.ts
// GET /api/website/[id]/sitemap
// Generates sitemap.xml for a published user website.
// Users submit this URL to Google Search Console.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const site = await db.userWebsite.findUnique({
    where:  { id: params.id },
    select: { slug: true, name: true, isPublished: true, updatedAt: true, customDomain: true, domainVerified: true },
  })

  if (!site || !site.isPublished || !site.slug) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Use custom domain if verified, otherwise the brandsyndicate.in subdomain
  const siteBase = (site.customDomain && site.domainVerified)
    ? `https://${site.customDomain}`
    : `${BASE}/w/${site.slug}`

  const lastmod = site.updatedAt.toISOString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteBase}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
