import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

// ── GET /api/blog/:slug — fetch own post by slug ──────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const post = await db.blogPost.findUnique({
      where: { userId_slug: { userId: session.user.id, slug: params.slug } },
    })

    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (err) {
    console.error('[blog/slug/GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PUT /api/blog/:slug — update post ────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const existing = await db.blogPost.findUnique({
      where: { userId_slug: { userId, slug: params.slug } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      title, content, excerpt, coverImageUrl,
      tags, published, seoTitle, seoDescription,
    } = body as {
      title?: string
      content?: string
      excerpt?: string
      coverImageUrl?: string
      tags?: string[]
      published?: boolean
      seoTitle?: string
      seoDescription?: string
    }

    // If publishing for the first time, set publishedAt
    const publishedAt =
      published && !existing.published ? new Date()
      : !published ? null
      : existing.publishedAt

    const post = await db.blogPost.update({
      where: { userId_slug: { userId, slug: params.slug } },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && {
          content,
          readingMinutes: estimateReadingMinutes(content),
        }),
        ...(excerpt !== undefined && { excerpt: excerpt.trim() }),
        ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl.trim() }),
        ...(tags !== undefined && { tags }),
        ...(published !== undefined && { published, publishedAt }),
        ...(seoTitle !== undefined && { seoTitle: seoTitle.trim() }),
        ...(seoDescription !== undefined && { seoDescription: seoDescription.trim() }),
      },
    })

    return NextResponse.json({ post })
  } catch (err) {
    console.error('[blog/slug/PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── DELETE /api/blog/:slug ────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const existing = await db.blogPost.findUnique({
      where: { userId_slug: { userId, slug: params.slug } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.blogPost.delete({ where: { userId_slug: { userId, slug: params.slug } } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[blog/slug/DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
