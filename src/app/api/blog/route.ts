import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

// ── POST /api/blog — create a blog post ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const {
      title,
      content = '',
      excerpt,
      coverImageUrl,
      tags = [],
      published = false,
      seoTitle,
      seoDescription,
    } = body as {
      title: string
      content?: string
      excerpt?: string
      coverImageUrl?: string
      tags?: string[]
      published?: boolean
      seoTitle?: string
      seoDescription?: string
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    // Generate unique slug — append counter if collision
    let baseSlug = toSlug(title)
    let slug = baseSlug
    let counter = 1
    while (await db.blogPost.findUnique({ where: { userId_slug: { userId, slug } } })) {
      slug = `${baseSlug}-${counter++}`
    }

    const post = await db.blogPost.create({
      data: {
        userId,
        title: title.trim(),
        slug,
        content,
        excerpt: excerpt?.trim(),
        coverImageUrl: coverImageUrl?.trim(),
        tags,
        published,
        publishedAt: published ? new Date() : null,
        seoTitle: seoTitle?.trim(),
        seoDescription: seoDescription?.trim(),
        readingMinutes: estimateReadingMinutes(content),
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    console.error('[blog/POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── GET /api/blog — list own posts (all statuses) ─────────────────────────
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const posts = await db.blogPost.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, slug: true, excerpt: true,
        published: true, publishedAt: true, tags: true,
        coverImageUrl: true, readingMinutes: true, viewCount: true,
        createdAt: true, updatedAt: true,
      },
    })

    return NextResponse.json({ posts })
  } catch (err) {
    console.error('[blog/GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
