import type { BrandOutput } from '@/lib/ai/generate'
import { fetchPexelsImage } from '@/lib/ai/pexels'
import { renderSlide, normaliseLegacySlide, type Colors } from '@/lib/export/pptxLayouts'

async function getImageUrl(query: string | undefined): Promise<string | null> {
  if (!query) return null
  const url = await fetchPexelsImage(query)
  if (!url) return null
  // Download to base64 so pptxgenjs can embed it (server can't load arbitrary remote URLs via path)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get('content-type') || 'image/jpeg'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

function hex(color: string): string {
  return color.replace('#', '').toUpperCase()
}

export async function generatePPTX(data: BrandOutput, userName: string, accentColor = '#C9A84C'): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PptxGenJS = require('pptxgenjs')
  const pptx = new PptxGenJS()

  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
  pptx.layout = 'WIDE'

  const W = 13.33
  const H = 7.5
  const BG     = '09090A'
  const ACCENT = hex(accentColor)
  const CREAM  = 'F8F4EE'
  const MUTED  = 'A09890'
  const DARK   = '111113'
  const WHITE  = 'FFFFFF'

  const colors: Colors = { W, H, BG, ACCENT, CREAM, MUTED, DARK, WHITE }

  // Pre-fetch all images in parallel
  const imageMap = new Map<string, string | null>()
  await Promise.all(
    data.presentationSlides
      .filter(s => s.imageQuery)
      .map(async s => {
        if (s.imageQuery) {
          const url = await getImageUrl(s.imageQuery)
          imageMap.set(s.imageQuery, url)
        }
      })
  )

  // ── TITLE / HOOK SLIDE ────────────────────────────────────────────────────
  const titleSlide = pptx.addSlide()
  titleSlide.background = { color: BG }
  titleSlide.addShape('rect', { x: 0, y: 0, w: W, h: 0.05, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
  titleSlide.addText(data.presentationHook, {
    x: 0.9, y: 1.6, w: 10, h: 3.0,
    fontFace: 'Georgia', fontSize: 42, color: CREAM, bold: false, lineSpacingMultiple: 1.25,
  })
  titleSlide.addText(data.tagline, {
    x: 0.9, y: 4.8, w: 9, h: 0.8,
    fontFace: 'Arial', fontSize: 16, color: MUTED,
  })
  titleSlide.addShape('rect', { x: 0.9, y: 5.9, w: 2.5, h: 0.04, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
  titleSlide.addText(userName, {
    x: 0.9, y: 6.15, w: 6, h: 0.5,
    fontFace: 'Arial', fontSize: 13, color: ACCENT, bold: true,
  })

  // ── CONTENT SLIDES ────────────────────────────────────────────────────────
  for (let i = 0; i < data.presentationSlides.length; i++) {
    const rawSlide = data.presentationSlides[i]
    const slide = normaliseLegacySlide(rawSlide as Parameters<typeof normaliseLegacySlide>[0])
    const imgUrl = slide.imageQuery ? (imageMap.get(slide.imageQuery) ?? null) : null
    await renderSlide(pptx, slide, imgUrl, colors, i + 2)
  }

  // ── CLOSING SLIDE ─────────────────────────────────────────────────────────
  const closing = pptx.addSlide()
  closing.background = { color: BG }
  closing.addShape('rect', { x: 0, y: 0, w: W, h: 0.05, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
  closing.addText(data.cta, {
    x: 1, y: 2.4, w: 11.33, h: 2.5,
    fontFace: 'Georgia', fontSize: 44, color: CREAM, align: 'center', lineSpacingMultiple: 1.25,
  })
  closing.addText(userName, {
    x: 1, y: 5.8, w: 11.33, h: 0.6,
    fontFace: 'Courier New', fontSize: 14, color: ACCENT, align: 'center',
  })

  const buf = await pptx.write({ outputType: 'nodebuffer' })
  return buf as Buffer
}
