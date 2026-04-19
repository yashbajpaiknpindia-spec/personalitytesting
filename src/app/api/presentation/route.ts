import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// ── POST /api/presentation ─────────────────────────────────────────────────
// Creates a presentation (optionally seeded from a generation's presentationSlides)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const {
      title = 'Untitled Presentation',
      accentColor = '#C9A84C',
      generationId,           // optional — seed slides from a generation
      presentationHook,       // optional — hook text for slide 1
      presentationSlides = [], // optional — rich slide array
    } = body as {
      title?: string
      accentColor?: string
      generationId?: string
      presentationHook?: string
      presentationSlides?: Array<{
        title?: string
        heading?: string
        layoutType?: string
        subheading?: string
        body?: string
        imageQuery?: string
        bullets?: string[]
        stats?: Array<{ value: string; label: string }>
        quote?: string
        attribution?: string
        cards?: Array<{ title: string; body: string }>
      }>
    }

    // Generate unique slug: last 6 chars of userId + 8-char hex fragment
    const uuidFrag = randomUUID().replace(/-/g, '').slice(0, 8)
    const slug = `${userId.slice(-6)}-${uuidFrag}`

    // Build initial slide content array
    // Slide 0 = Hook / Title slide
    const slideData: Array<{ order: number; content: object }> = []

    if (presentationHook || presentationSlides.length === 0) {
      slideData.push({
        order: 0,
        content: {
          type: 'hook',
          heading: presentationHook ?? 'Your presentation starts here.',
          subheading: '',
        },
      })
    }

    presentationSlides.forEach((slide, i) => {
      slideData.push({
        order: i + (presentationHook ? 1 : 0),
        content: {
          // Store the full rich slide shape — layoutType takes priority
          layoutType:  slide.layoutType ?? 'split-left',
          type:        'content',  // keep for backward compat
          heading:     slide.heading ?? slide.title ?? '',
          subheading:  slide.subheading,
          body:        slide.body,
          imageQuery:  slide.imageQuery ?? '',
          bullets:     slide.bullets,
          stats:       slide.stats,
          quote:       slide.quote,
          attribution: slide.attribution,
          cards:       slide.cards,
        },
      })
    })

    // If nothing was provided, create one blank slide
    if (slideData.length === 0) {
      slideData.push({
        order: 0,
        content: { type: 'content', heading: 'Slide Title', body: 'Add your content here.' },
      })
    }

    const presentation = await db.presentation.create({
      data: {
        userId,
        title,
        slug,
        accentColor,
        slides: {
          create: slideData.map(s => ({
            order: s.order,
            content: s.content as never,
          })),
        },
      },
      include: { slides: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({ presentation }, { status: 201 })
  } catch (err) {
    console.error('[presentation/POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── GET /api/presentation — list user's presentations ─────────────────────
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const presentations = await db.presentation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: { slides: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({ presentations })
  } catch (err) {
    console.error('[presentation/GET-list]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
