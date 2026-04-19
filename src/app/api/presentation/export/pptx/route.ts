import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import type { RichSlide } from '@/lib/ai/generate'
import { fetchPexelsImage } from '@/lib/ai/pexels'
import { renderSlide, normaliseLegacySlide, type Colors } from '@/lib/export/pptxLayouts'

// Supports both legacy shape ({ type, heading, body, imageQuery })
// and new RichSlide shape ({ layoutType, heading, body, imageQuery, stats, bullets, quote, cards })
type SlideContent = RichSlide & {
  type?: 'hook' | 'content' | 'cta'
}

// ── GET /api/presentation/export/pptx?id=:presentationId ─────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const presentationId = searchParams.get('id')

    if (!presentationId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const presentation = await db.presentation.findUnique({
      where: { id: presentationId },
      include: {
        slides: { orderBy: { order: 'asc' } },
        user: { select: { name: true } },
      },
    })

    if (!presentation || presentation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PptxGenJS = require('pptxgenjs')
    const pptx = new PptxGenJS()

    pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
    pptx.layout = 'WIDE'

    const W = 13.33
    const H = 7.5
    const BG    = '09090A'
    const ACCENT = presentation.accentColor.replace('#', '').toUpperCase()
    const CREAM  = 'F8F4EE'
    const MUTED  = 'A09890'
    const DARK   = '111113'
    const WHITE  = 'FFFFFF'
    const userName = presentation.user?.name ?? 'Brand Syndicate'

    const colors: Colors = { W, H, BG, ACCENT, CREAM, MUTED, DARK, WHITE }

    // Normalise all slides (handle legacy shape)
    const richSlides: RichSlide[] = presentation.slides.map(s =>
      normaliseLegacySlide(s.content as unknown as SlideContent)
    )

    // Pre-fetch all images in parallel, downloading to base64 for pptxgenjs
    const imageMap = new Map<string, string | null>()
    await Promise.all(
      richSlides
        .filter(s => s.imageQuery)
        .map(async s => {
          if (s.imageQuery && !imageMap.has(s.imageQuery)) {
            const url = await fetchPexelsImage(s.imageQuery)
            if (url) {
              try {
                const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
                if (res.ok) {
                  const buf = Buffer.from(await res.arrayBuffer())
                  const mime = res.headers.get('content-type') || 'image/jpeg'
                  imageMap.set(s.imageQuery, `data:${mime};base64,${buf.toString('base64')}`)
                } else {
                  imageMap.set(s.imageQuery, null)
                }
              } catch {
                imageMap.set(s.imageQuery, null)
              }
            } else {
              imageMap.set(s.imageQuery, null)
            }
          }
        })
    )

    for (let idx = 0; idx < richSlides.length; idx++) {
      const slide = richSlides[idx]
      const imgUrl = slide.imageQuery ? (imageMap.get(slide.imageQuery) ?? null) : null
      await renderSlide(pptx, slide, imgUrl, colors, idx + 1)
    }

    // Closing slide
    const closing = pptx.addSlide()
    closing.background = { color: BG }
    closing.addShape('rect', { x: 0, y: 0, w: W, h: 0.05, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
    closing.addText(presentation.title, {
      x: 1, y: 2.4, w: 11.33, h: 2.5,
      fontFace: 'Georgia', fontSize: 44, color: CREAM, align: 'center', lineSpacingMultiple: 1.25,
    })
    closing.addText(userName, {
      x: 1, y: 5.8, w: 11.33, h: 0.6,
      fontFace: 'Courier New', fontSize: 14, color: ACCENT, align: 'center',
    })

    const buf: Buffer = await pptx.write({ outputType: 'nodebuffer' })
    const safeTitle = presentation.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${safeTitle}.pptx"`,
        'Content-Length': buf.length.toString(),
      },
    })
  } catch (err) {
    console.error('[presentation/export/pptx]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
