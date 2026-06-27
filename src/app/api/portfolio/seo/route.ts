// src/app/api/portfolio/seo/route.ts
// Per-portfolio SEO, writes to the Portfolio row, not global SeoSettings
// Now also handles googleAnalyticsId and gscVerificationToken

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// GET, fetch SEO fields from the user's published portfolio
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const portfolio = await db.portfolio.findUnique({
      where: { userId: session.user.id },
      select: {
        seoTitle: true,
        seoDescription: true,
        ogImageUrl: true,
        slug: true,
        websiteTheme: true,
        googleAnalyticsId: true,
        gscVerificationToken: true,
      },
    })

    return NextResponse.json({ seo: portfolio ?? null })
  } catch (err) {
    console.error('[portfolio/seo GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT, update SEO fields on the Portfolio row
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      seoTitle,
      seoDescription,
      ogImageUrl,
      websiteTheme,
      googleAnalyticsId,
      gscVerificationToken,
    } = await req.json() as {
      seoTitle?: string
      seoDescription?: string
      ogImageUrl?: string
      websiteTheme?: string
      googleAnalyticsId?: string
      gscVerificationToken?: string
    }

    const existing = await db.portfolio.findUnique({ where: { userId: session.user.id } })
    if (!existing) {
      return NextResponse.json({ seo: null })
    }

    const updated = await db.portfolio.update({
      where: { userId: session.user.id },
      data: {
        ...(seoTitle !== undefined && { seoTitle: seoTitle.trim() || null }),
        ...(seoDescription !== undefined && { seoDescription: seoDescription.trim() || null }),
        ...(ogImageUrl !== undefined && { ogImageUrl: ogImageUrl.trim() || null }),
        ...(websiteTheme !== undefined && { websiteTheme }),
        ...(googleAnalyticsId !== undefined && { googleAnalyticsId: googleAnalyticsId.trim() || null }),
        ...(gscVerificationToken !== undefined && { gscVerificationToken: gscVerificationToken.trim() || null }),
      },
      select: {
        seoTitle: true,
        seoDescription: true,
        ogImageUrl: true,
        slug: true,
        websiteTheme: true,
        googleAnalyticsId: true,
        gscVerificationToken: true,
      },
    })

    return NextResponse.json({ seo: updated })
  } catch (err) {
    console.error('[portfolio/seo PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
