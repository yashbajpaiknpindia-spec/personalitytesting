// src/app/api/website/[id]/blog/route.ts
// GET /api/website/[id]/blog
// Public endpoint — no auth required.
// Returns published blog posts belonging to the site owner,
// used by bs-backend.js to render blog previews on generated websites.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const site = await db.userWebsite.findUnique({
      where:  { id: params.id },
      select: { userId: true, isPublished: true },
    })
    if (!site || !site.isPublished) {
      return NextResponse.json({ posts: [] })
    }

    const posts = await db.blogPost.findMany({
      where:   { userId: site.userId, published: true },
      orderBy: { publishedAt: 'desc' },
      take:    6,
      select: {
        id:            true,
        title:         true,
        slug:          true,
        excerpt:       true,
        coverImageUrl: true,
        publishedAt:   true,
        readingMinutes:true,
        tags:          true,
      },
    })

    return NextResponse.json({ posts })
  } catch (e) {
    console.error('[GET /api/website/[id]/blog]', e)
    return NextResponse.json({ posts: [] })
  }
}
