// src/app/u/[username]/page.tsx
// Public portfolio at /u/{username} — uses the same enhanced shell as /p/{slug}

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PublicPortfolioShell from '@/app/p/[slug]/PublicPortfolioShell'
import type { BrandOutput } from '@/lib/ai/generate'

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

  const user = await db.user.findUnique({
    where: { username },
    select: { name: true, jobTitle: true, bio: true, image: true, company: true, location: true },
  })
  if (!user) return { title: 'Profile Not Found | Brand Syndicate' }

  const title = user.name
    ? `${user.name}${user.jobTitle ? ' — ' + user.jobTitle : ''} | Brand Syndicate`
    : `@${username} | Brand Syndicate`
  const description = user.bio
    || `${user.name ?? username}'s professional portfolio${user.company ? ' at ' + user.company : ''}${user.location ? ' · ' + user.location : ''}.`

  return {
    title,
    description,
    alternates: { canonical: `${APP_URL}/u/${username}` },
    openGraph: {
      title,
      description,
      url: `${APP_URL}/u/${username}`,
      type: 'profile',
      siteName: 'Brand Syndicate',
      ...(user.image ? { images: [{ url: user.image, width: 400, height: 400, alt: user.name ?? username }] } : {}),
    },
    twitter: {
      card: user.image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(user.image ? { images: [user.image] } : {}),
    },
    robots: { index: true, follow: true },
  }
}

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      jobTitle: true,
      company: true,
      location: true,
      website: true,
      linkedin: true,
      bio: true,
      accentColor: true,
      image: true,
    },
  })
  if (!user) notFound()

  const generation = await db.generation.findFirst({
    where: { userId: user.id, status: 'COMPLETE' },
    orderBy: { createdAt: 'desc' },
  })

  const [projects, blogPosts] = await Promise.all([
    db.project.findMany({
      where: { userId: user.id, publishedAt: { not: null } },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        imageUrl: true,
        tags: true,
        featured: true,
      },
    }),
    db.blogPost.findMany({
      where: { userId: user.id, published: true },
      orderBy: { publishedAt: 'desc' },
      take: 4,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        readingMinutes: true,
        tags: true,
      },
    }),
  ])

  // Safe cast: Prisma returns Json — cast through unknown first
  const out = (generation?.outputData ?? null) as unknown as BrandOutput | null

  return (
    <PublicPortfolioShell
      user={user}
      out={out}
      slug={username}
      ownerId={user.id}
      projects={projects}
      blogPosts={blogPosts}
      username={username}
    />
  )
}
