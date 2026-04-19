import type { RichSlide, SlideLayoutType } from '@/lib/ai/generate'

// ── Image helper: download to buffer for pptxgenjs compatibility ──────────
async function imageToBase64(url: string): Promise<string | null> {
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

export interface Colors {
  W: number
  H: number
  BG: string
  ACCENT: string
  CREAM: string
  MUTED: string
  DARK: string
  WHITE: string
}

export function normaliseLegacySlide(raw: RichSlide & { type?: string }): RichSlide {
  if (raw.layoutType) return raw as RichSlide
  if (raw.type === 'hook') return { layoutType: 'title-only', heading: raw.heading ?? '', subheading: raw.subheading }
  if (raw.type === 'cta')  return { layoutType: 'title-only', heading: raw.heading ?? '' }
  return { layoutType: 'split-left', heading: raw.heading ?? '', body: raw.body, imageQuery: raw.imageQuery }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function renderSlide(pptx: any, slide: RichSlide, imgUrl: string | null, c: Colors, index: number) {
  // Download image to base64 so pptxgenjs can embed it (remote URLs often fail in server context)
  const imgData = imgUrl ? await imageToBase64(imgUrl) : null
  const s = pptx.addSlide()
  const ACCENT = slide.accentOverride ? slide.accentOverride.replace('#', '').toUpperCase() : c.ACCENT

  switch (slide.layoutType as SlideLayoutType) {

    // ── HERO: full-bleed image, large centred title ─────────────────────────
    case 'hero': {
      s.background = { color: c.BG }
      if (imgData) {
        s.addImage({ data: imgData, x: 0, y: 0, w: c.W, h: c.H })
        s.addShape('rect', { x: 0, y: 0, w: c.W, h: c.H, fill: { color: '000000', transparency: 35 }, line: { color: '000000', width: 0 } })
        s.addShape('rect', { x: 0, y: c.H * 0.55, w: c.W, h: c.H * 0.45, fill: { color: '000000', transparency: 15 }, line: { color: '000000', width: 0 } })
      }
      s.addShape('rect', { x: 0, y: 0, w: c.W, h: 0.05, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 0.9, y: 1.8, w: c.W - 1.8, h: 3.0,
        fontFace: 'Georgia', fontSize: 44, color: c.CREAM, align: 'center', bold: false, lineSpacingMultiple: 1.2,
      })
      if (slide.subheading) {
        s.addText(slide.subheading, {
          x: 1.5, y: 5.2, w: c.W - 3.0, h: 0.7,
          fontFace: 'Arial', fontSize: 16, color: c.MUTED, align: 'center',
        })
      }
      break
    }

    // ── STATS: dark bg, 3 large numbers ────────────────────────────────────
    case 'stats': {
      s.background = { color: c.BG }
      s.addShape('rect', { x: 0, y: 0, w: c.W, h: 0.05, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 0.9, y: 0.5, w: c.W - 1.8, h: 0.9,
        fontFace: 'Georgia', fontSize: 22, color: c.CREAM, align: 'center',
      })
      const statsItems = slide.stats ?? []
      const colW = (c.W - 2.0) / Math.max(statsItems.length, 1)
      statsItems.forEach((stat, i) => {
        const xPos = 1.0 + i * colW
        s.addShape('rect', { x: xPos + 0.1, y: 1.8, w: colW - 0.3, h: 3.5, fill: { color: c.DARK }, line: { color: ACCENT, width: 0.5 }, rectRadius: 0.05 })
        s.addShape('rect', { x: xPos + 0.1, y: 1.8, w: colW - 0.3, h: 0.06, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addText(stat.value, {
          x: xPos + 0.1, y: 2.4, w: colW - 0.3, h: 1.6,
          fontFace: 'Georgia', fontSize: 52, color: ACCENT, align: 'center', bold: false,
        })
        s.addText(stat.label, {
          x: xPos + 0.1, y: 4.1, w: colW - 0.3, h: 0.9,
          fontFace: 'Arial', fontSize: 13, color: c.MUTED, align: 'center', charSpacing: 1.5,
        })
      })
      if (slide.subheading) {
        s.addText(slide.subheading, {
          x: 0.9, y: 5.9, w: c.W - 1.8, h: 0.6,
          fontFace: 'Arial', fontSize: 12, color: c.MUTED, align: 'center',
        })
      }
      break
    }

    // ── SPLIT-LEFT: text left, image right ──────────────────────────────────
    case 'split-left': {
      s.background = { color: c.BG }
      if (imgData) {
        s.addImage({ data: imgData, x: c.W / 2, y: 0, w: c.W / 2, h: c.H })
        s.addShape('rect', { x: c.W / 2, y: 0, w: c.W / 2, h: c.H, fill: { color: '000000', transparency: 40 }, line: { color: '000000', width: 0 } })
      }
      s.addShape('rect', { x: c.W / 2 - 0.04, y: 0, w: 0.04, h: c.H, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(String(index).padStart(2, '0'), {
        x: 0.4, y: 0.35, w: 1, h: 0.4,
        fontFace: 'Courier New', fontSize: 10, color: ACCENT,
      })
      s.addText(slide.heading, {
        x: 0.5, y: 1.0, w: c.W / 2 - 0.9, h: 2.0,
        fontFace: 'Georgia', fontSize: 28, color: c.CREAM, lineSpacingMultiple: 1.25,
      })
      if (slide.body) {
        s.addText(slide.body, {
          x: 0.5, y: 3.3, w: c.W / 2 - 0.9, h: 2.5,
          fontFace: 'Arial', fontSize: 14, color: c.MUTED, lineSpacingMultiple: 1.6, paraSpaceAfter: 6,
        })
      }
      if (slide.subheading) {
        s.addText(slide.subheading, {
          x: 0.5, y: 6.2, w: c.W / 2 - 0.9, h: 0.6,
          fontFace: 'Courier New', fontSize: 11, color: ACCENT,
        })
      }
      break
    }

    // ── SPLIT-RIGHT: image left, text right ─────────────────────────────────
    case 'split-right': {
      s.background = { color: c.BG }
      if (imgData) {
        s.addImage({ data: imgData, x: 0, y: 0, w: c.W / 2, h: c.H })
        s.addShape('rect', { x: 0, y: 0, w: c.W / 2, h: c.H, fill: { color: '000000', transparency: 40 }, line: { color: '000000', width: 0 } })
      }
      s.addShape('rect', { x: c.W / 2, y: 0, w: 0.04, h: c.H, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: c.W / 2 + 0.5, y: 1.0, w: c.W / 2 - 0.9, h: 2.0,
        fontFace: 'Georgia', fontSize: 28, color: c.CREAM, lineSpacingMultiple: 1.25,
      })
      if (slide.body) {
        s.addText(slide.body, {
          x: c.W / 2 + 0.5, y: 3.3, w: c.W / 2 - 0.9, h: 2.5,
          fontFace: 'Arial', fontSize: 14, color: c.MUTED, lineSpacingMultiple: 1.6, paraSpaceAfter: 6,
        })
      }
      if (slide.subheading) {
        s.addText(slide.subheading, {
          x: c.W / 2 + 0.5, y: 6.2, w: c.W / 2 - 0.9, h: 0.6,
          fontFace: 'Courier New', fontSize: 11, color: ACCENT,
        })
      }
      break
    }

    // ── BULLETS: heading + bullet list, optional image column ───────────────
    case 'bullets': {
      s.background = { color: c.BG }
      const hasImg = !!imgData
      const textW = hasImg ? c.W / 2 - 0.6 : c.W - 1.6
      if (hasImg && imgData) {
        s.addImage({ data: imgData, x: c.W / 2 + 0.2, y: 0.8, w: c.W / 2 - 0.4, h: c.H - 1.4 })
        s.addShape('rect', { x: c.W / 2 + 0.2, y: 0.8, w: c.W / 2 - 0.4, h: c.H - 1.4, fill: { color: '000000', transparency: 45 }, line: { color: '000000', width: 0 } })
      }
      s.addShape('rect', { x: 0, y: 0, w: 0.05, h: c.H, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 0.5, y: 0.7, w: textW, h: 1.3,
        fontFace: 'Georgia', fontSize: 26, color: c.CREAM, lineSpacingMultiple: 1.2,
      })
      s.addShape('rect', { x: 0.5, y: 2.1, w: 2.0, h: 0.03, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      const bulletItems = slide.bullets ?? []
      bulletItems.forEach((bullet, i) => {
        s.addText(`›  ${bullet}`, {
          x: 0.5, y: 2.4 + i * 0.75, w: textW, h: 0.65,
          fontFace: 'Arial', fontSize: 14, color: c.MUTED, lineSpacingMultiple: 1.3,
        })
      })
      break
    }

    // ── QUOTE: large centred pull-quote ─────────────────────────────────────
    case 'quote': {
      s.background = { color: c.DARK }
      s.addShape('rect', { x: 0, y: c.H * 0.35, w: c.W, h: c.H * 0.3, fill: { color: ACCENT, transparency: 88 }, line: { color: ACCENT, width: 0 } })
      s.addText('\u201C', {
        x: 0.5, y: 0.3, w: 2, h: 2,
        fontFace: 'Georgia', fontSize: 120, color: ACCENT, transparency: 70,
      })
      s.addText(slide.quote ?? slide.heading, {
        x: 1.2, y: 1.4, w: c.W - 2.4, h: 3.2,
        fontFace: 'Georgia', fontSize: 26, color: c.CREAM, align: 'center',
        italic: true, lineSpacingMultiple: 1.4,
      })
      if (slide.attribution) {
        s.addShape('rect', { x: c.W / 2 - 1.0, y: 5.0, w: 2.0, h: 0.03, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addText(`— ${slide.attribution}`, {
          x: 1.2, y: 5.2, w: c.W - 2.4, h: 0.6,
          fontFace: 'Courier New', fontSize: 12, color: ACCENT, align: 'center',
        })
      }
      break
    }

    // ── GRID: 2–3 cards in a row ────────────────────────────────────────────
    case 'grid': {
      s.background = { color: c.BG }
      s.addShape('rect', { x: 0, y: 0, w: c.W, h: 0.05, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 0.9, y: 0.4, w: c.W - 1.8, h: 0.9,
        fontFace: 'Georgia', fontSize: 22, color: c.CREAM, align: 'center',
      })
      const cards = slide.cards ?? []
      const numCards = cards.length
      const cardW = (c.W - 1.8 - (numCards - 1) * 0.3) / Math.max(numCards, 1)
      cards.forEach((card, i) => {
        const xPos = 0.9 + i * (cardW + 0.3)
        s.addShape('rect', { x: xPos, y: 1.6, w: cardW, h: 4.8, fill: { color: c.DARK }, line: { color: ACCENT + '60', width: 0.5 }, rectRadius: 0.05 })
        s.addShape('rect', { x: xPos, y: 1.6, w: cardW, h: 0.07, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addText(String(i + 1).padStart(2, '0'), {
          x: xPos + 0.2, y: 1.85, w: 0.6, h: 0.4,
          fontFace: 'Courier New', fontSize: 10, color: ACCENT,
        })
        s.addText(card.title, {
          x: xPos + 0.2, y: 2.4, w: cardW - 0.4, h: 1.1,
          fontFace: 'Georgia', fontSize: 16, color: c.CREAM, lineSpacingMultiple: 1.2,
        })
        s.addText(card.body, {
          x: xPos + 0.2, y: 3.65, w: cardW - 0.4, h: 2.4,
          fontFace: 'Arial', fontSize: 13, color: c.MUTED, lineSpacingMultiple: 1.5,
        })
      })
      break
    }

    // ── TITLE-ONLY: minimal large centred heading ────────────────────────────
    case 'title-only': {
      s.background = { color: c.BG }
      s.addShape('rect', { x: 0, y: 0, w: c.W, h: 0.05, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addShape('rect', { x: 0, y: c.H - 0.05, w: c.W, h: 0.05, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 1.0, y: 1.8, w: c.W - 2.0, h: 3.0,
        fontFace: 'Georgia', fontSize: 46, color: c.CREAM, align: 'center',
        bold: false, lineSpacingMultiple: 1.2,
      })
      if (slide.subheading) {
        s.addShape('rect', { x: c.W / 2 - 1.5, y: 5.1, w: 3.0, h: 0.04, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addText(slide.subheading, {
          x: 1.0, y: 5.4, w: c.W - 2.0, h: 0.7,
          fontFace: 'Courier New', fontSize: 14, color: ACCENT, align: 'center', charSpacing: 2,
        })
      }
      break
    }

    // ── FALLBACK: treat as split-left without image ─────────────────────────
    default: {
      s.background = { color: c.BG }
      s.addShape('rect', { x: 0, y: 0, w: 0.05, h: c.H, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 0.5, y: 1.0, w: c.W - 1.0, h: 2.0,
        fontFace: 'Georgia', fontSize: 30, color: c.CREAM,
      })
      if (slide.body) {
        s.addText(slide.body, {
          x: 0.5, y: 3.3, w: c.W - 1.0, h: 3.0,
          fontFace: 'Arial', fontSize: 14, color: c.MUTED, lineSpacingMultiple: 1.6,
        })
      }
      break
    }
  }
}
