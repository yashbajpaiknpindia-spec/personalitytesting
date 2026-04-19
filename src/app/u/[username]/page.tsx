// src/app/u/[username]/page.tsx
// Public portfolio at /u/{username} — uses the same enhanced shell as /p/{slug}

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import PublicPortfolioShell from '@/app/p/[slug]/PublicPortfolioShell'
import type { BrandOutput } from '@/lib/ai/generate'

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
