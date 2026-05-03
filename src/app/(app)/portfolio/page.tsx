import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import PortfolioManagerClient from './PortfolioManagerClient'

export const metadata = { title: 'Portfolio Manager — Brand Syndicate' }

export default async function PortfolioManagerPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id
  const [projects, blogPosts, user] = await Promise.all([
    db.project.findMany({ where: { userId }, orderBy: [{ featured: 'desc' }, { order: 'asc' }] }),
    db.blogPost.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' },
      select: { id:true, title:true, slug:true, published:true, publishedAt:true, readingMinutes:true, viewCount:true, tags:true, excerpt:true, createdAt:true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { username:true, name:true, accentColor:true } }),
  ])
  return (
    <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}><div style={{ width:28, height:28, border:'1px solid rgba(255,255,255,0.1)', borderTopColor:'#C9A84C', borderRadius:'50%', animation:'spin 1s linear infinite' }}/></div>}>
      <PortfolioManagerClient initialProjects={projects} initialPosts={blogPosts} username={user?.username??null} accentColor={user?.accentColor??'#C9A84C'}/>
    </Suspense>
  )
}
