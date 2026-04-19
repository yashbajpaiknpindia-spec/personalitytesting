// src/app/sitemap.ts
// Next.js metadata sitemap — auto-includes all published portfolios.

import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandsyndicate.co'

  const portfolios = await db.portfolio.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  })

  // Phase 4: include public presentation share pages in sitemap
  const presentations = await db.presentation.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  })

  // Phase 5: include published blog posts
  const publishedPosts = await db.blogPost.findMany({
    where: { published: true },
    include: { user: { select: { username: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 1000,
  })

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/generate`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/templates`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ]

  const portfolioRoutes: MetadataRoute.Sitemap = portfolios.map((p: { slug: string; updatedAt: Date }) => ({
    url: `${baseUrl}/p/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const presentationRoutes: MetadataRoute.Sitemap = presentations.map((p: { slug: string; updatedAt: Date }) => ({
    url: `${baseUrl}/presentation/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const blogRoutes: MetadataRoute.Sitemap = publishedPosts
    .filter((p: { slug: string; updatedAt: Date; user: { username: string | null } | null }) => p.user?.username)
    .map((p: { slug: string; updatedAt: Date; user: { username: string | null } }) => ({
      url: `${baseUrl}/blog/${p.user!.username!}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

  return [...staticRoutes, ...portfolioRoutes, ...presentationRoutes, ...blogRoutes]
}
