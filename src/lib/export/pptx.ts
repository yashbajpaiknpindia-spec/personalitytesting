import type { BrandOutput } from '@/lib/ai/generate'
import { fetchPexelsImage } from '@/lib/ai/pexels'
import { renderSlide, normaliseLegacySlide, buildColors } from '@/lib/export/pptxLayouts'

async function getImageUrl(query: string | undefined): Promise<string | null> {
  if (!query) return null
  const url = await fetchPexelsImage(query)
  if (!url) return null
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

export async function generatePPTX(data: BrandOutput, userName: string, accentColor = '#C9A84C'): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PptxGenJS = require('pptxgenjs')
  const pptx = new (PptxGenJS.default ?? PptxGenJS)()
  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
  pptx.layout = 'WIDE'

  const W = 13.33
  const H = 7.5

  // ── Use theme system ──────────────────────────────────────────────────
  const themeKey    = data.presentationTheme    ?? 'noir'
  const fontPairKey = data.presentationFontPair ?? 'georgia-arial'
  const colors = buildColors(themeKey, accentColor, fontPairKey, W, H)
  const { BG, ACCENT, CREAM, MUTED, heading: HF, mono: MF, isLight } = colors
  const textColor = isLight ? colors.BG : CREAM

  // Pre-fetch images (unchanged)
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

  // ── TITLE SLIDE ───────────────────────────────────────────────────────
  const titleSlide = pptx.addSlide()
  titleSlide.background = { color: BG }
  titleSlide.addShape('ellipse', { x: -1.5, y: -1.5, w: 5.5, h: 5.5, fill: { color: ACCENT, transparency: 92 }, line: { color: ACCENT, width: 0 } })
  titleSlide.addShape('ellipse', { x: W - 3.0, y: H - 3.0, w: 5.5, h: 5.5, fill: { color: ACCENT, transparency: 92 }, line: { color: ACCENT, width: 0 } })
  titleSlide.addShape('rect', { x: 0, y: 0, w: W, h: 0.06, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
  titleSlide.addShape('rect', { x: 0, y: H - 0.06, w: W, h: 0.06, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
  titleSlide.addText(data.presentationHook, {
    x: 0.9, y: 1.6, w: 10, h: 3.0,
    fontFace: HF, fontSize: 44, color: textColor, bold: false, lineSpacingMultiple: 1.25,
  })
  titleSlide.addText(data.tagline, {
    x: 0.9, y: 4.9, w: 9, h: 0.8,
    fontFace: colors.body, fontSize: 16, color: MUTED,
  })
  titleSlide.addShape('rect', { x: 0.9, y: 6.0, w: 2.8, h: 0.04, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
  titleSlide.addText(userName, {
    x: 0.9, y: 6.2, w: 6, h: 0.5,
    fontFace: MF, fontSize: 13, color: ACCENT, bold: true,
  })

  // ── CONTENT SLIDES ────────────────────────────────────────────────────
  for (let i = 0; i < data.presentationSlides.length; i++) {
    const rawSlide = data.presentationSlides[i]
    const slide = normaliseLegacySlide(rawSlide as Parameters<typeof normaliseLegacySlide>[0])
    const imgUrl = slide.imageQuery ? (imageMap.get(slide.imageQuery) ?? null) : null
    await renderSlide(pptx, slide, imgUrl, colors, i + 2)
  }

  // ── CLOSING SLIDE ─────────────────────────────────────────────────────
  const closing = pptx.addSlide()
  closing.background = { color: BG }
  closing.addShape('ellipse', { x: W / 2 - 3.5, y: H / 2 - 3.5, w: 7.0, h: 7.0, fill: { color: ACCENT, transparency: 94 }, line: { color: ACCENT, width: 0 } })
  closing.addShape('rect', { x: 0, y: 0, w: W, h: 0.06, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
  closing.addShape('rect', { x: 0, y: H - 0.06, w: W, h: 0.06, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
  closing.addText(data.cta, {
    x: 1, y: 2.2, w: 11.33, h: 2.8,
    fontFace: HF, fontSize: 46, color: textColor, align: 'center', lineSpacingMultiple: 1.25,
  })
  closing.addShape('rect', { x: W / 2 - 1.5, y: 5.5, w: 3.0, h: 0.04, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
  closing.addText(userName, {
    x: 1, y: 5.75, w: 11.33, h: 0.65,
    fontFace: MF, fontSize: 14, color: ACCENT, align: 'center',
  })

  const buf = await pptx.write({ outputType: 'nodebuffer' })
  return buf as Buffer
}
