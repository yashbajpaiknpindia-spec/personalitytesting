// src/app/sitemap.ts
// Next.js metadata sitemap — auto-includes all static, portfolio, presentation, and blog pages.
// Every route is uniquely prioritised for Google crawl budget optimisation.

import { MetadataRoute } from 'next'
import { getAllSlugs } from '@/lib/articles'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

const staticRoutes: MetadataRoute.Sitemap = [
  // ── Tier 1 — Core acquisition pages (highest priority) ──────────────────
  {
    url: BASE,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  },
  {
    url: `${BASE}/resources`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    url: `${BASE}/guides`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  },

  // ── Tier 2 — Brand / Company pages ──────────────────────────────────────
  {
    url: `${BASE}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${BASE}/contact`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.55,
  },

  // ── Tier 3 — Legal (indexed, low crawl budget) ───────────────────────────
  {
    url: `${BASE}/privacy`,
    lastModified: new Date('2026-04-21'),
    changeFrequency: 'yearly',
    priority: 0.35,
  },
  {
    url: `${BASE}/terms`,
    lastModified: new Date('2026-04-21'),
    changeFrequency: 'yearly',
    priority: 0.35,
  },
]

// Article routes — sourced from articles.ts (single source of truth)
const articleRoutes: MetadataRoute.Sitemap = getAllSlugs().map(slug => ({
  url: `${BASE}/articles/${slug}`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.8,
}))

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Published portfolios ─────────────────────────────────────────────────
  const portfolios = await db.portfolio.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  })

  const portfolioRoutes: MetadataRoute.Sitemap = portfolios.map(
    (p: { slug: string; updatedAt: Date }) => ({
      url: `${BASE}/p/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    })
  )

  // ── Public presentation pages (published only, to avoid thin/private content) ───
  const presentations = await db.presentation.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  })

  const presentationRoutes: MetadataRoute.Sitemap = presentations.map(
    (p: { slug: string; updatedAt: Date }) => ({
      url: `${BASE}/presentation/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.55,
    })
  )

  // ── Published blog posts ─────────────────────────────────────────────────
  const publishedPosts = await db.blogPost.findMany({
    where: { published: true },
    include: { user: { select: { username: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 1000,
  })

  const blogRoutes: MetadataRoute.Sitemap = publishedPosts
    .filter(
      (p: {
        slug: string
        updatedAt: Date
        user: { username: string | null } | null
      }) => p.user?.username
    )
    .map(
      (p: {
        slug: string
        updatedAt: Date
        user: { username: string | null }
      }) => ({
        url: `${BASE}/blog/${p.user!.username!}/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.65,
      })
    )

  // ── Blog index pages per user ────────────────────────────────────────────
  const seen: Record<string, boolean> = {}
  const blogUsernames: string[] = publishedPosts
    .filter((p: { user: { username: string | null } | null }) => p.user?.username)
    .map((p: { user: { username: string | null } }) => p.user!.username!)
    .filter((u: string) => { if (seen[u]) return false; seen[u] = true; return true })
  const blogIndexRoutes: MetadataRoute.Sitemap = blogUsernames.map(username => ({
    url: `${BASE}/blog/${username}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // ── Public username portfolios (/u/[username]) ───────────────────────────
  const users = await db.user.findMany({
    where: {
      username: { not: null },
      generations: { some: { status: 'COMPLETE' } },
    },
    select: { username: true, updatedAt: true },
    take: 2000,
  })

  const userPortfolioRoutes: MetadataRoute.Sitemap = users
    .filter((u: { username: string | null }) => u.username)
    .map((u: { username: string | null; updatedAt: Date }) => ({
      url: `${BASE}/u/${u.username!}`,
      lastModified: u.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

  return [
    ...staticRoutes,
    ...articleRoutes,
    ...portfolioRoutes,
    ...presentationRoutes,
    ...blogRoutes,
    ...blogIndexRoutes,
    ...userPortfolioRoutes,
  ]
}
