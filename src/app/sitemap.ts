// src/app/sitemap.ts
// Canonical sitemap for Brand Syndicate — all static, plan, article, portfolio, and blog routes.
// Tiered by crawl priority. Regenerated on every deployment (force-dynamic).

import { MetadataRoute } from 'next'
import { getAllSlugs } from '@/lib/articles'
import { db } from '@/lib/db'
import { WEBSITE_TEMPLATE_LIBRARY } from '@/lib/website/templates'

export const dynamic = 'force-dynamic'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

const staticRoutes: MetadataRoute.Sitemap = [
  // ── Tier 1 · Core acquisition (highest crawl priority) ────────────────────
  {
    url: BASE,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  },
  {
    url: `${BASE}/pricing`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.95,
  },

  // ── Tier 2 · Plan detail pages ────────────────────────────────────────────
  {
    url: `${BASE}/plans/free-starter`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.90,
  },
  {
    url: `${BASE}/plans/ai-creator`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.90,
  },
  {
    url: `${BASE}/plans/business-pro`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.90,
  },
  {
    url: `${BASE}/plans/unlimited-growth`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.90,
  },

  // ── Tier 3 · Content hubs ─────────────────────────────────────────────────
  {
    url: `${BASE}/resources`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  },
  {
    url: `${BASE}/guides`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  },
  {
    url: `${BASE}/blog`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.85,
  },

  // ── Tier 4 · Brand / company pages ───────────────────────────────────────
  {
    url: `${BASE}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.70,
  },
  {
    url: `${BASE}/contact`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.60,
  },
  {
    url: `${BASE}/faq`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.65,
  },

  // ── Tier 5 · Core app action pages ───────────────────────────────────────
  {
    url: `${BASE}/generate`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.90,
  },
  {
    url: `${BASE}/templates`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.90,
  },
  {
    url: `${BASE}/support`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.55,
  },

  // ── Tier 6 · Auth entry points (indexed so Google can find sign-up) ───────
  {
    url: `${BASE}/signup`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.50,
  },

  // ── Tier 6 · Legal (crawled, low budget) ──────────────────────────────────
  {
    url: `${BASE}/privacy`,
    lastModified: new Date('2026-04-21'),
    changeFrequency: 'yearly',
    priority: 0.30,
  },
  {
    url: `${BASE}/terms`,
    lastModified: new Date('2026-04-21'),
    changeFrequency: 'yearly',
    priority: 0.30,
  },
]

const templateRoutes: MetadataRoute.Sitemap = WEBSITE_TEMPLATE_LIBRARY.map(t => ({
  url: `${BASE}/templates/${t.id}`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.72,
}))

// Article routes — single source of truth from articles.ts
const articleRoutes: MetadataRoute.Sitemap = getAllSlugs().map(slug => ({
  url: `${BASE}/articles/${slug}`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.80,
}))

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ── Published user portfolios (/p/[slug]) ─────────────────────────────────
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

  // ── Published blog posts (/blog/[username]/[slug]) ────────────────────────
  const publishedPosts = await db.blogPost.findMany({
    where: { published: true },
    include: { user: { select: { username: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 1000,
  })
  const blogRoutes: MetadataRoute.Sitemap = publishedPosts
    .filter((p: { user: { username: string | null } | null }) => p.user?.username)
    .map((p: { slug: string; updatedAt: Date; user: { username: string | null } }) => ({
      url: `${BASE}/blog/${p.user!.username!}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    }))

  // ── Blog index per user (/blog/[username]) ────────────────────────────────
  const seen: Record<string, boolean> = {}
  const blogUsernames: string[] = publishedPosts
    .filter((p: { user: { username: string | null } | null }) => p.user?.username)
    .map((p: { user: { username: string | null } }) => p.user!.username!)
    .filter((u: string) => { if (seen[u]) return false; seen[u] = true; return true })
  const blogIndexRoutes: MetadataRoute.Sitemap = blogUsernames.map(username => ({
    url: `${BASE}/blog/${username}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.60,
  }))

  // ── Public username profiles (/u/[username]) ──────────────────────────────
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
      priority: 0.60,
    }))

  return [
    ...staticRoutes,
    ...templateRoutes,
    ...articleRoutes,
    ...portfolioRoutes,
    ...blogRoutes,
    ...blogIndexRoutes,
    ...userPortfolioRoutes,
  ]
}
