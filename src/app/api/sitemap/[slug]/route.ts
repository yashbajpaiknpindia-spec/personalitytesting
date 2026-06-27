// src/app/api/sitemap/[slug]/route.ts
// Generates a sitemap.xml for a specific published portfolio, includes the
// portfolio page itself, any published blog posts, and any published projects.
// Users submit this URL to Google Search Console: /api/sitemap/{slug}
//
// Example: https://brandsyndicate.in/api/sitemap/yash-agarwal

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Verify portfolio exists and is published
  const portfolio = await db.portfolio.findUnique({
    where: { slug, isPublished: true },
    select: { userId: true, updatedAt: true, user: { select: { username: true } } },
  })

  if (!portfolio) {
    return new NextResponse('Portfolio not found', { status: 404 })
  }

  const now = new Date().toISOString()
  const portfolioUpdated = portfolio.updatedAt.toISOString()
  const username = portfolio.user?.username

  // Fetch published blog posts for this user
  const blogPosts = username
    ? await db.blogPost.findMany({
        where: { userId: portfolio.userId, published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 200,
      })
    : []

  // Build URL entries
  const urls: Array<{ loc: string; lastmod: string; priority: string; changefreq: string }> = [
    // The portfolio page itself, highest priority
    {
      loc: `${BASE}/p/${slug}`,
      lastmod: portfolioUpdated,
      priority: '1.0',
      changefreq: 'weekly',
    },
  ]

  // Blog posts, only if user has a username (public blog)
  for (const post of blogPosts) {
    urls.push({
      loc: `${BASE}/blog/${username}/${post.slug}`,
      lastmod: post.updatedAt.toISOString(),
      priority: '0.7',
      changefreq: 'monthly',
    })
  }

  // Blog index page (if user has blog posts)
  if (username && blogPosts.length > 0) {
    urls.push({
      loc: `${BASE}/blog/${username}`,
      lastmod: now,
      priority: '0.6',
      changefreq: 'weekly',
    })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
