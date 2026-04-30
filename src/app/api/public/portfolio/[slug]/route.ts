// src/app/api/public/portfolio/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/analytics/track'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const portfolio = await db.portfolio.findUnique({
    where: { slug, isPublished: true },
    include: {
      user: {
        select: {
          id: true, name: true, username: true, jobTitle: true,
          company: true, location: true, website: true,
          linkedin: true, bio: true, accentColor: true, image: true,
        },
      },
      generation: {
        select: { outputData: true, inputData: true },
      },
    },
  })

  if (!portfolio) {
    return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
  }

  // Async view tracking — don't block response
  void db.portfolio.update({
    where: { id: portfolio.id },
    data: { viewCount: { increment: 1 } },
  })
  void trackEvent({
    ownerId: portfolio.userId,
    type: 'PORTFOLIO_VIEW',
    metadata: { slug },
    request: req,
  })

  return NextResponse.json({
    user: portfolio.user,
    outputData: portfolio.generation.outputData,
    slug: portfolio.slug,
    viewCount: portfolio.viewCount,
    seoTitle: portfolio.seoTitle,
    seoDescription: portfolio.seoDescription,
    ogImageUrl: portfolio.ogImageUrl,
  })
}
