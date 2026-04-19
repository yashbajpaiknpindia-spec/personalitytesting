// src/app/p/[slug]/page.tsx
// Public portfolio page — accessible at /p/{slug}

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { trackEvent } from '@/lib/analytics/track'
import { headers } from 'next/headers'
import PublicPortfolioShell from './PublicPortfolioShell'
import type { BrandOutput } from '@/lib/ai/generate'


async function getPortfolio(slug: string) {
  return db.portfolio.findUnique({
    where: { slug, isPublished: true },
    include: {
      user: {
        select: {
          id: true, name: true, username: true, jobTitle: true,
          company: true, location: true, website: true,
          linkedin: true, bio: true, accentColor: true, image: true,
        },
      },
      generation: { select: { outputData: true } },
    },
  })
}

// ── Dynamic SEO Metadata ──────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const portfolio = await getPortfolio(slug)
  if (!portfolio) return { title: 'Portfolio Not Found' }

  const out = portfolio.generation.outputData as unknown as BrandOutput | null
  const user = portfolio.user
  const title = portfolio.seoTitle || out?.headline || user.name || 'Personal Portfolio'
  const description = portfolio.seoDescription || out?.bio || user.bio || `${user.name}'s professional portfolio.`
  const ogImage = portfolio.ogImageUrl || user.image

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandsyndicate.co'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/p/${slug}`,
      siteName: 'Brand Syndicate',
      type: 'profile',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${baseUrl}/p/${slug}`,
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function PublicSlugPortfolioPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const portfolio = await getPortfolio(slug)
  if (!portfolio) notFound()

  // Server-side view tracking
  const hdrs = await headers()
  const ip = (hdrs.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined
  const ua = hdrs.get('user-agent') ?? undefined

  await Promise.all([
    db.portfolio.update({
      where: { id: portfolio.id },
      data: { viewCount: { increment: 1 } },
    }),
    db.analyticsEvent.create({
      data: {
        ownerId: portfolio.userId,
        type: 'PORTFOLIO_VIEW',
        metadata: { slug, via: 'page' },
        visitorIp: ip,
        userAgent: ua,
      },
    }),
  ])

  const out = portfolio.generation.outputData as unknown as BrandOutput | null

  // Phase 5: fetch projects and recent blog posts in parallel
  const [projects, blogPosts] = await Promise.all([
    db.project.findMany({
      where: { userId: portfolio.userId, publishedAt: { not: null } },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      select: { id: true, title: true, description: true, url: true, imageUrl: true, tags: true, featured: true },
    }),
    db.blogPost.findMany({
      where: { userId: portfolio.userId, published: true },
      orderBy: { publishedAt: 'desc' },
      take: 4,
      select: { title: true, slug: true, excerpt: true, publishedAt: true, readingMinutes: true, tags: true },
    }),
  ])

  return (
    <PublicPortfolioShell
      user={portfolio.user}
      out={out}
      slug={slug}
      ownerId={portfolio.userId}
      projects={projects}
      blogPosts={blogPosts}
      username={portfolio.user.username}
    />
  )
}
