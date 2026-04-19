import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import PortfolioManagerClient from './PortfolioManagerClient'

export const metadata = { title: 'Portfolio Manager — Brand Syndicate' }

export default async function PortfolioManagerPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [projects, seoSettings, blogPosts, user] = await Promise.all([
    db.project.findMany({
      where: { userId },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    }),
    db.seoSettings.findUnique({ where: { userId } }),
    db.blogPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, slug: true, published: true,
        publishedAt: true, readingMinutes: true, viewCount: true,
        tags: true, excerpt: true, createdAt: true,
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { username: true, name: true, accentColor: true },
    }),
  ])

  return (
    <PortfolioManagerClient
      initialProjects={projects}
      initialSeo={seoSettings}
      initialPosts={blogPosts}
      username={user?.username ?? null}
      accentColor={user?.accentColor ?? '#C9A84C'}
    />
  )
}
