// src/app/api/portfolio/publish/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { generatePortfolioSlug } from '@/lib/portfolio/slug'

function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || ''
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return 'https://www.brandsyndicate.in'
}

// GET — fetch current published portfolio slug for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const portfolio = await db.portfolio.findUnique({
      where: { userId: session.user.id },
      select: { slug: true, isPublished: true, generationId: true, websiteTheme: true },
    })
    if (!portfolio || !portfolio.isPublished) {
      return NextResponse.json({ slug: null })
    }
    const baseUrl = getBaseUrl(req)
    return NextResponse.json({
      slug: portfolio.slug,
      url: `${baseUrl}/p/${portfolio.slug}`,
      generationId: portfolio.generationId,
      websiteTheme: portfolio.websiteTheme,
    })
  } catch (err) {
    console.error('[portfolio/publish GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { generationId, websiteTheme } = await req.json()

    if (!generationId) {
      return NextResponse.json({ error: 'generationId required' }, { status: 400 })
    }

    // Verify generation belongs to user and is complete
    const generation = await db.generation.findFirst({
      where: { id: generationId, userId, status: 'COMPLETE' },
    })
    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    // Fetch user for slug generation
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true, accentColor: true },
    })

    const themeToSave = websiteTheme || 'the-manifesto'

    // Check if a portfolio already exists — update it instead of creating a new one
    const existing = await db.portfolio.findUnique({ where: { userId } })

    let portfolio
    if (existing) {
      portfolio = await db.portfolio.update({
        where: { userId },
        data: {
          generationId,
          isPublished: true,
          publishedAt: new Date(),
          updatedAt: new Date(),
          websiteTheme: themeToSave,
        },
      })
    } else {
      const nameForSlug = user?.username || user?.name || userId
      const slug = await generatePortfolioSlug(nameForSlug)

      portfolio = await db.portfolio.create({
        data: {
          userId,
          generationId,
          slug,
          isPublished: true,
          websiteTheme: themeToSave,
        },
      })
    }

    const baseUrl = getBaseUrl(req)
    const publicUrl = `${baseUrl}/p/${portfolio.slug}`

    return NextResponse.json({
      success: true,
      slug: portfolio.slug,
      url: publicUrl,
      usernameUrl: user?.username ? `${baseUrl}/u/${user.username}` : null,
    })
  } catch (err) {
    console.error('[portfolio/publish]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.portfolio.updateMany({
      where: { userId: session.user.id },
      data: { isPublished: false },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[portfolio/publish DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
