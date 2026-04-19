// src/app/api/portfolio/publish/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { generatePortfolioSlug } from '@/lib/portfolio/slug'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { generationId } = await req.json()

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
        },
      })
    } else {
      // Generate slug from username > name > fallback
      const nameForSlug = user?.username || user?.name || userId
      const slug = await generatePortfolioSlug(nameForSlug)

      portfolio = await db.portfolio.create({
        data: {
          userId,
          generationId,
          slug,
          isPublished: true,
        },
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandsyndicate.co'
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
