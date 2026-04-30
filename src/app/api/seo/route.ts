import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// ── GET /api/seo — fetch own SEO settings ────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seo = await db.seoSettings.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ seo: seo ?? null })
  } catch (err) {
    console.error('[seo/GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PUT /api/seo — upsert SEO settings ───────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const {
      pageTitle,
      metaDescription,
      ogImageUrl,
      twitterHandle,
      canonicalUrl,
      noIndex,
    } = body as {
      pageTitle?: string
      metaDescription?: string
      ogImageUrl?: string
      twitterHandle?: string
      canonicalUrl?: string
      noIndex?: boolean
    }

    const data = {
      ...(pageTitle !== undefined && { pageTitle: pageTitle.trim() }),
      ...(metaDescription !== undefined && { metaDescription: metaDescription.trim() }),
      ...(ogImageUrl !== undefined && { ogImageUrl: ogImageUrl.trim() }),
      ...(twitterHandle !== undefined && { twitterHandle: twitterHandle.replace('@', '').trim() }),
      ...(canonicalUrl !== undefined && { canonicalUrl: canonicalUrl.trim() }),
      ...(noIndex !== undefined && { noIndex }),
    }

    const seo = await db.seoSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    // Also sync to the Portfolio record if one exists (keeps existing seoTitle/seoDescription in sync)
    await db.portfolio.updateMany({
      where: { userId },
      data: {
        ...(pageTitle !== undefined && { seoTitle: pageTitle.trim() }),
        ...(metaDescription !== undefined && { seoDescription: metaDescription.trim() }),
        ...(ogImageUrl !== undefined && { ogImageUrl: ogImageUrl.trim() }),
      },
    })

    return NextResponse.json({ seo })
  } catch (err) {
    console.error('[seo/PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
