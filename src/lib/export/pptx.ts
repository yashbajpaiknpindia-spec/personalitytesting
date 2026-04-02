import type { BrandOutput } from '@/lib/ai/generate'
import { fetchPexelsImage } from '@/lib/ai/pexels'

export async function generatePPTX(data: BrandOutput, userName: string, accentColor = '#C9A84C'): Promise<Buffer> {
  // pptxgenjs must be required at runtime (CommonJS module)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PptxGenJS = require('pptxgenjs')
  const pptx = new PptxGenJS()

  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
  pptx.layout = 'WIDE'

  const BG   = '09090A'
  const GOLD = accentColor.replace('#', '')
  const CREAM = 'F0EAE0'
  const MUTED = '5C564E'

  // ── Title slide ────────────────────────────────────────────────────────────
  const title = pptx.addSlide()
  title.background = { color: BG }
  title.addShape('rect', { x: 0, y: 0, w: 13.33, h: 0.03, fill: { color: GOLD }, line: { color: GOLD, width: 0 } })
  title.addText(data.presentationHook, { x: 0.8, y: 1.4, w: 10, h: 2.5, fontFace: 'Georgia', fontSize: 38, color: CREAM, bold: false })
  title.addText(data.tagline, { x: 0.8, y: 4.2, w: 9, h: 0.8, fontFace: 'Arial', fontSize: 16, color: MUTED })
  title.addShape('rect', { x: 0.8, y: 5.8, w: 3, h: 0.03, fill: { color: GOLD }, line: { color: GOLD, width: 0 } })
  title.addText(userName, { x: 0.8, y: 6.1, w: 5, h: 0.5, fontFace: 'Arial', fontSize: 13, color: GOLD, bold: true })

  // ── Content slides ─────────────────────────────────────────────────────────
  const imageUrls = await Promise.all(data.presentationSlides.map(s => fetchPexelsImage(s.imageQuery)))

  for (let i = 0; i < data.presentationSlides.length; i++) {
    const slide = data.presentationSlides[i]
    const imgUrl = imageUrls[i]
    const s = pptx.addSlide()
    s.background = { color: BG }

    if (imgUrl) {
      try {
        s.addImage({ path: imgUrl, x: 6.5, y: 0, w: 6.83, h: 7.5 })
        s.addShape('rect', { x: 6.5, y: 0, w: 6.83, h: 7.5, fill: { color: '000000', transparency: 45 }, line: { color: '000000', width: 0 } })
      } catch { /* Skip image if fetch fails */ }
    }

    s.addShape('rect', { x: 0, y: 0, w: 0.06, h: 7.5, fill: { color: GOLD }, line: { color: GOLD, width: 0 } })
    s.addText(`0${i + 1}`, { x: 0.4, y: 0.4, w: 1, h: 0.4, fontFace: 'Courier New', fontSize: 11, color: GOLD })
    s.addText(slide.title, { x: 0.4, y: 1.1, w: 5.6, h: 1.8, fontFace: 'Georgia', fontSize: 26, color: CREAM })
    s.addText(slide.body, { x: 0.4, y: 3.1, w: 5.6, h: 2.8, fontFace: 'Arial', fontSize: 14, color: MUTED, paraSpaceAfter: 8 })
  }

  // ── CTA slide ──────────────────────────────────────────────────────────────
  const cta = pptx.addSlide()
  cta.background = { color: BG }
  cta.addShape('rect', { x: 0, y: 0, w: 13.33, h: 0.03, fill: { color: GOLD }, line: { color: GOLD, width: 0 } })
  cta.addText(data.cta, { x: 1, y: 2.2, w: 11.33, h: 2.5, fontFace: 'Georgia', fontSize: 42, color: CREAM, align: 'center' })
  cta.addText(userName, { x: 1, y: 5.5, w: 11.33, h: 0.6, fontFace: 'Courier New', fontSize: 14, color: GOLD, align: 'center' })

  const buf = await pptx.write({ outputType: 'nodebuffer' })
  return buf as Buffer
}
