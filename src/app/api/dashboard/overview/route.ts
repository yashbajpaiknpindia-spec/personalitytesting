// src/app/api/dashboard/overview/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalGenerations,
      totalExports,
      totalLeads,
      portfolioViews,
      cardViews,
      portfolio,
      recentEvents,
      recentLeads,
    ] = await Promise.all([
      db.generation.count({ where: { userId, status: 'COMPLETE' } }),
      db.export.count({ where: { userId } }),
      db.contact.count({ where: { ownerId: userId } }),
      db.analyticsEvent.count({ where: { ownerId: userId, type: 'PORTFOLIO_VIEW' } }),
      db.analyticsEvent.count({ where: { ownerId: userId, type: 'CARD_VIEW' } }),
      db.portfolio.findUnique({
        where: { userId },
        select: { slug: true, isPublished: true, viewCount: true, publishedAt: true },
      }),
      db.analyticsEvent.findMany({
        where: { ownerId: userId, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { type: true, createdAt: true, metadata: true },
      }),
      db.contact.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { name: true, email: true, company: true, createdAt: true },
      }),
    ])

    const totalViews = portfolioViews + cardViews

    return NextResponse.json({
      stats: {
        totalViews,
        portfolioViews,
        cardViews,
        totalLeads,
        totalGenerations,
        totalExports,
      },
      portfolio: portfolio
        ? {
            slug: portfolio.slug,
            isPublished: portfolio.isPublished,
            viewCount: portfolio.viewCount,
            publishedAt: portfolio.publishedAt,
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://brandsyndicate.co'}/p/${portfolio.slug}`,
          }
        : null,
      recentActivity: recentEvents,
      recentLeads,
    })
  } catch (err) {
    console.error('[dashboard/overview]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
