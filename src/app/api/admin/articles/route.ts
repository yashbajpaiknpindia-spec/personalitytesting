import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null
  return session
}

function slugify(input: string) {
  return (input || 'article')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || `article-${Date.now()}`
}

function estimateReadingMinutes(text: string) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 180))
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const articles = await db.blogPost.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, title: true, slug: true, excerpt: true, published: true,
      publishedAt: true, coverImageUrl: true, tags: true, readingMinutes: true,
      viewCount: true, createdAt: true,
    },
  })

  return NextResponse.json({ articles })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const title = String(body.title || '').trim()
  const content = String(body.content || '').trim()
  if (!title || !content) {
    return NextResponse.json({ error: 'Title and article content are required' }, { status: 400 })
  }

  const currentUser = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, username: true, name: true } })
  let authorUsername = currentUser?.username || 'brand-syndicate'
  if (!currentUser?.username) {
    let candidate = authorUsername
    for (let i = 2; i < 50; i++) {
      const exists = await db.user.findUnique({ where: { username: candidate }, select: { id: true } }).catch(() => null)
      if (!exists || exists.id === session.user.id) break
      candidate = `${authorUsername}-${i}`
    }
    await db.user.update({ where: { id: session.user.id }, data: { username: candidate } }).catch(() => {})
    authorUsername = candidate
  }

  const base = slugify(body.slug || title)
  let slug = base
  for (let i = 2; i < 100; i++) {
    const exists = await db.blogPost.findFirst({ where: { userId: session.user.id, slug }, select: { id: true } })
    if (!exists) break
    slug = `${base}-${i}`
  }

  const published = body.published !== false
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 8)
    : String(body.tags || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 8)

  const article = await db.blogPost.create({
    data: {
      userId: session.user.id,
      title,
      slug,
      excerpt: String(body.excerpt || '').trim() || content.replace(/[#*_>`]/g, '').slice(0, 180),
      content,
      coverImageUrl: String(body.coverImageUrl || '').trim() || null,
      tags,
      published,
      publishedAt: published ? new Date() : null,
      seoTitle: String(body.seoTitle || title).slice(0, 70),
      seoDescription: String(body.seoDescription || body.excerpt || '').slice(0, 160) || null,
      readingMinutes: estimateReadingMinutes(content),
    },
    select: { id: true, title: true, slug: true, published: true },
  })

  return NextResponse.json({ ok: true, article, url: `/blog/${authorUsername}/${article.slug}` })
}
