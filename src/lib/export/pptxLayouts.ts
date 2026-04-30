import type { RichSlide, SlideLayoutType } from '@/lib/ai/generate'

// ── Image helper ──────────────────────────────────────────────────────────
async function imageToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get('content-type') || 'image/jpeg'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch { return null }
}

// ── Theme system ──────────────────────────────────────────────────────────
export interface ThemeColors {
  BG: string      // main background
  BG2: string     // secondary/card background
  CREAM: string   // primary text
  MUTED: string   // secondary text
  DARK: string    // dark surface
  WHITE: string
}

export const THEMES: Record<string, ThemeColors> = {
  'noir':      { BG:'09090A', BG2:'111113', CREAM:'F8F4EE', MUTED:'A09890', DARK:'111113', WHITE:'FFFFFF' },
  'corporate': { BG:'0F1923', BG2:'192433', CREAM:'EFF4F8', MUTED:'8BA0B4', DARK:'192433', WHITE:'FFFFFF' },
  'minimal':   { BG:'FAFAF8', BG2:'F0F0ED', CREAM:'1A1A18', MUTED:'6B6B68', DARK:'F0F0ED', WHITE:'FFFFFF' },
  'bold':      { BG:'1A0533', BG2:'2A0F4A', CREAM:'F5EEFF', MUTED:'9B7EC8', DARK:'2A0F4A', WHITE:'FFFFFF' },
  'warm':      { BG:'1C1208', BG2:'2A1C0C', CREAM:'FDF5E6', MUTED:'B09060', DARK:'2A1C0C', WHITE:'FFFFFF' },
  'ocean':     { BG:'030D1A', BG2:'071A30', CREAM:'E8F4FD', MUTED:'6BA3C0', DARK:'071A30', WHITE:'FFFFFF' },
}

export const FONT_PAIRS: Record<string, { heading: string; body: string; mono: string }> = {
  'georgia-arial':       { heading:'Georgia',             body:'Arial',       mono:'Courier New' },
  'playfair-lato':       { heading:'Playfair Display',    body:'Lato',        mono:'Courier New' },
  'montserrat-opensans': { heading:'Montserrat',          body:'Open Sans',   mono:'Courier New' },
  'dmserif-karla':       { heading:'DM Serif Display',    body:'Karla',       mono:'Courier New' },
  'raleway-mulish':      { heading:'Raleway',             body:'Mulish',      mono:'Courier New' },
}

export interface Colors {
  W: number; H: number
  BG: string; BG2: string; ACCENT: string; CREAM: string
  MUTED: string; DARK: string; WHITE: string
  isLight: boolean  // true for minimal theme — flips text logic
  heading: string; body: string; mono: string
}

export function buildColors(
  themeKey: string,
  accentHex: string,
  fontPairKey: string,
  W: number,
  H: number
): Colors {
  const theme = THEMES[themeKey] ?? THEMES['noir']
  const fonts = FONT_PAIRS[fontPairKey] ?? FONT_PAIRS['georgia-arial']
  const ACCENT = accentHex.replace('#', '').toUpperCase()
  const isLight = themeKey === 'minimal'
  return { W, H, BG: theme.BG, BG2: theme.BG2, ACCENT, CREAM: theme.CREAM, MUTED: theme.MUTED, DARK: theme.DARK, WHITE: theme.WHITE, isLight, heading: fonts.heading, body: fonts.body, mono: fonts.mono }
}

export function normaliseLegacySlide(raw: RichSlide & { type?: string }): RichSlide {
  if (raw.layoutType) return raw as RichSlide
  if (raw.type === 'hook') return { layoutType: 'title-only', heading: raw.heading ?? '', subheading: raw.subheading }
  if (raw.type === 'cta')  return { layoutType: 'title-only', heading: raw.heading ?? '' }
  return { layoutType: 'split-left', heading: raw.heading ?? '', body: raw.body, imageQuery: raw.imageQuery }
}

// ── Decorative layer — rich geometric shapes for visual depth ─────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addDecoLayer(s: any, c: Colors, ACCENT: string, variant: 'corner' | 'side' | 'center' | 'none' = 'corner') {
  if (variant === 'none') return

  // Large primary circle — top-right bleed
  s.addShape('ellipse', { x: c.W - 2.5, y: -2.2, w: 5.5, h: 5.5, fill: { color: ACCENT, transparency: 90 }, line: { color: ACCENT, transparency: 75, width: 0.5 } })
  // Medium secondary circle — offset from primary
  s.addShape('ellipse', { x: c.W - 1.6, y: -0.8, w: 2.8, h: 2.8, fill: { color: ACCENT, transparency: 82 }, line: { color: ACCENT, width: 0 } })
  // Small accent dot
  s.addShape('ellipse', { x: c.W - 0.55, y: 1.0, w: 0.4, h: 0.4, fill: { color: ACCENT, transparency: 55 }, line: { color: ACCENT, width: 0 } })

  if (variant === 'corner') {
    // Bottom-left large circle
    s.addShape('ellipse', { x: -1.2, y: c.H - 2.4, w: 4.0, h: 4.0, fill: { color: ACCENT, transparency: 87 }, line: { color: ACCENT, transparency: 72, width: 0.5 } })
    // Bottom-left small dot
    s.addShape('ellipse', { x: 0.5, y: c.H - 0.8, w: 0.5, h: 0.5, fill: { color: ACCENT, transparency: 60 }, line: { color: ACCENT, width: 0 } })
    // Diagonal accent line
    s.addShape('rect', { x: c.W * 0.55, y: c.H * 0.65, w: 1.6, h: 0.025, fill: { color: ACCENT, transparency: 70 }, line: { color: ACCENT, width: 0 }, rotate: -28 })
    // Grid dot cluster top-left
    for (let gx = 0; gx < 3; gx++) {
      for (let gy = 0; gy < 2; gy++) {
        s.addShape('ellipse', { x: 0.25 + gx * 0.25, y: 0.3 + gy * 0.25, w: 0.1, h: 0.1, fill: { color: ACCENT, transparency: 65 }, line: { color: ACCENT, width: 0 } })
      }
    }
  }
  if (variant === 'side') {
    // Right-edge vertical bar
    s.addShape('rect', { x: c.W - 0.12, y: 0, w: 0.12, h: c.H, fill: { color: ACCENT, transparency: 78 }, line: { color: ACCENT, width: 0 } })
    // Horizontal band mid-slide
    s.addShape('rect', { x: 0, y: c.H * 0.5, w: c.W, h: 0.03, fill: { color: ACCENT, transparency: 82 }, line: { color: ACCENT, width: 0 } })
    // Small decorative circles along right side
    s.addShape('ellipse', { x: c.W - 0.7, y: c.H * 0.25, w: 0.35, h: 0.35, fill: { color: ACCENT, transparency: 68 }, line: { color: ACCENT, width: 0 } })
    s.addShape('ellipse', { x: c.W - 0.7, y: c.H * 0.65, w: 0.35, h: 0.35, fill: { color: ACCENT, transparency: 68 }, line: { color: ACCENT, width: 0 } })
  }
  if (variant === 'center') {
    // Center radial decorations
    s.addShape('ellipse', { x: c.W / 2 - 3.5, y: c.H / 2 - 3.5, w: 7.0, h: 7.0, fill: { color: ACCENT, transparency: 94 }, line: { color: ACCENT, transparency: 80, width: 0.75 } })
    s.addShape('ellipse', { x: c.W / 2 - 2.2, y: c.H / 2 - 2.2, w: 4.4, h: 4.4, fill: { color: ACCENT, transparency: 91 }, line: { color: ACCENT, transparency: 82, width: 0.5 } })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function renderSlide(pptx: any, slide: RichSlide, imgUrl: string | null, c: Colors, index: number) {
  const imgData = imgUrl ? await imageToBase64(imgUrl) : null
  const s = pptx.addSlide()
  const ACCENT = slide.accentOverride ? slide.accentOverride.replace('#', '').toUpperCase() : c.ACCENT
  const textColor = c.isLight ? c.BG : c.CREAM

  switch (slide.layoutType as SlideLayoutType) {

    case 'hero': {
      s.background = { color: c.BG }
      if (imgData) {
        s.addImage({ data: imgData, x: 0, y: 0, w: c.W, h: c.H })
        s.addShape('rect', { x: 0, y: 0, w: c.W, h: c.H, fill: { color: '000000', transparency: c.isLight ? 15 : 30 }, line: { color: '000000', width: 0 } })
        s.addShape('rect', { x: 0, y: c.H * 0.45, w: c.W, h: c.H * 0.55, fill: { color: c.BG, transparency: 30 }, line: { color: c.BG, width: 0 } })
      }
      addDecoLayer(s, c, ACCENT, 'corner')
      s.addShape('rect', { x: 0, y: 0, w: c.W, h: 0.06, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 0.9, y: 1.6, w: c.W - 1.8, h: 3.2,
        fontFace: c.heading, fontSize: 46, color: imgData ? 'FFFFFF' : textColor,
        align: 'center', bold: false, lineSpacingMultiple: 1.2,
        shadow: imgData ? { type: 'outer', blur: 8, offset: 2, angle: 270, color: '000000', opacity: 0.5 } : undefined,
      })
      if (slide.subheading) {
        s.addText(slide.subheading, {
          x: 1.5, y: 5.1, w: c.W - 3.0, h: 0.8,
          fontFace: c.body, fontSize: 16, color: imgData ? 'E0E0E0' : c.MUTED, align: 'center',
        })
      }
      s.addShape('rect', { x: c.W / 2 - 0.6, y: 6.0, w: 1.2, h: 0.04, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      break
    }

    case 'stats': {
      s.background = { color: c.BG }
      addDecoLayer(s, c, ACCENT, 'side')
      s.addShape('rect', { x: 0, y: 0, w: c.W, h: 0.06, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 0.9, y: 0.45, w: c.W - 1.8, h: 0.9,
        fontFace: c.heading, fontSize: 24, color: textColor, align: 'center',
      })
      s.addShape('rect', { x: c.W / 2 - 1.5, y: 1.45, w: 3.0, h: 0.03, fill: { color: ACCENT, transparency: 40 }, line: { color: ACCENT, width: 0 } })
      const statsItems = slide.stats ?? []
      const colW = (c.W - 2.0) / Math.max(statsItems.length, 1)
      statsItems.forEach((stat, i) => {
        const xPos = 1.0 + i * colW
        s.addShape('ellipse', { x: xPos + colW / 2 - 1.2, y: 1.8, w: 2.4, h: 2.4, fill: { color: ACCENT, transparency: 90 }, line: { color: ACCENT, transparency: 75, width: 0.75 } })
        s.addShape('rect', { x: xPos + 0.15, y: 1.9, w: colW - 0.35, h: 3.2, fill: { color: c.BG2 }, line: { color: ACCENT + '50', width: 0.5 }, rectRadius: 0.08 })
        s.addShape('rect', { x: xPos + 0.15, y: 1.9, w: colW - 0.35, h: 0.08, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addText(stat.value, {
          x: xPos + 0.15, y: 2.3, w: colW - 0.35, h: 1.7,
          fontFace: c.heading, fontSize: 58, color: ACCENT, align: 'center', bold: false,
        })
        s.addText(stat.label.toUpperCase(), {
          x: xPos + 0.15, y: 4.15, w: colW - 0.35, h: 0.75,
          fontFace: c.mono, fontSize: 11, color: c.MUTED, align: 'center', charSpacing: 2.0,
        })
      })
      if (slide.subheading) {
        s.addText(slide.subheading, {
          x: 0.9, y: 5.7, w: c.W - 1.8, h: 0.6,
          fontFace: c.body, fontSize: 12, color: c.MUTED, align: 'center',
        })
      }
      break
    }

    case 'split-left': {
      s.background = { color: c.BG }
      if (imgData) {
        s.addImage({ data: imgData, x: c.W / 2, y: 0, w: c.W / 2, h: c.H })
        s.addShape('rect', { x: c.W / 2, y: 0, w: c.W / 2, h: c.H, fill: { color: c.BG, transparency: c.isLight ? 50 : 35 }, line: { color: c.BG, width: 0 } })
      } else {
        s.addShape('rect', { x: c.W / 2, y: 0, w: c.W / 2, h: c.H, fill: { color: c.BG2 }, line: { color: c.BG2, width: 0 } })
        addDecoLayer(s, c, ACCENT, 'corner')
      }
      s.addShape('rect', { x: c.W / 2 - 0.05, y: 0, w: 0.05, h: c.H, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(String(index).padStart(2, '0'), {
        x: 0.4, y: 0.35, w: 1, h: 0.4,
        fontFace: c.mono, fontSize: 10, color: ACCENT,
      })
      s.addText(slide.heading, {
        x: 0.5, y: 0.9, w: c.W / 2 - 0.9, h: 2.1,
        fontFace: c.heading, fontSize: 30, color: textColor, lineSpacingMultiple: 1.2,
      })
      if (slide.body) {
        s.addText(slide.body, {
          x: 0.5, y: 3.2, w: c.W / 2 - 0.9, h: 2.7,
          fontFace: c.body, fontSize: 14, color: c.MUTED, lineSpacingMultiple: 1.65, paraSpaceAfter: 6,
        })
      }
      if (slide.subheading) {
        s.addShape('rect', { x: 0.5, y: 6.1, w: 1.8, h: 0.03, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addText(slide.subheading, {
          x: 0.5, y: 6.25, w: c.W / 2 - 0.9, h: 0.6,
          fontFace: c.mono, fontSize: 11, color: ACCENT,
        })
      }
      break
    }

    case 'split-right': {
      s.background = { color: c.BG }
      if (imgData) {
        s.addImage({ data: imgData, x: 0, y: 0, w: c.W / 2, h: c.H })
        s.addShape('rect', { x: 0, y: 0, w: c.W / 2, h: c.H, fill: { color: c.BG, transparency: c.isLight ? 50 : 35 }, line: { color: c.BG, width: 0 } })
      } else {
        s.addShape('rect', { x: 0, y: 0, w: c.W / 2, h: c.H, fill: { color: c.BG2 }, line: { color: c.BG2, width: 0 } })
      }
      s.addShape('rect', { x: c.W / 2, y: 0, w: 0.05, h: c.H, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(String(index).padStart(2, '0'), {
        x: c.W / 2 + 0.4, y: 0.35, w: 1, h: 0.4,
        fontFace: c.mono, fontSize: 10, color: ACCENT,
      })
      s.addText(slide.heading, {
        x: c.W / 2 + 0.5, y: 0.9, w: c.W / 2 - 0.9, h: 2.1,
        fontFace: c.heading, fontSize: 30, color: textColor, lineSpacingMultiple: 1.2,
      })
      if (slide.body) {
        s.addText(slide.body, {
          x: c.W / 2 + 0.5, y: 3.2, w: c.W / 2 - 0.9, h: 2.7,
          fontFace: c.body, fontSize: 14, color: c.MUTED, lineSpacingMultiple: 1.65, paraSpaceAfter: 6,
        })
      }
      if (slide.subheading) {
        s.addShape('rect', { x: c.W / 2 + 0.5, y: 6.1, w: 1.8, h: 0.03, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addText(slide.subheading, {
          x: c.W / 2 + 0.5, y: 6.25, w: c.W / 2 - 0.9, h: 0.6,
          fontFace: c.mono, fontSize: 11, color: ACCENT,
        })
      }
      break
    }

    case 'bullets': {
      s.background = { color: c.BG }
      const hasImg = !!imgData
      const textW = hasImg ? c.W / 2 - 0.6 : c.W - 1.6
      if (hasImg && imgData) {
        s.addImage({ data: imgData, x: c.W / 2 + 0.2, y: 0.8, w: c.W / 2 - 0.4, h: c.H - 1.4 })
        s.addShape('rect', { x: c.W / 2 + 0.2, y: 0.8, w: c.W / 2 - 0.4, h: c.H - 1.4, fill: { color: '000000', transparency: 45 }, line: { color: '000000', width: 0 } })
      } else {
        addDecoLayer(s, c, ACCENT, 'corner')
      }
      s.addShape('rect', { x: 0, y: 0, w: 0.06, h: c.H, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 0.55, y: 0.65, w: textW, h: 1.4,
        fontFace: c.heading, fontSize: 28, color: textColor, lineSpacingMultiple: 1.2,
      })
      s.addShape('rect', { x: 0.55, y: 2.15, w: 2.2, h: 0.04, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      const bulletItems = slide.bullets ?? []
      bulletItems.forEach((bullet, i) => {
        s.addShape('ellipse', { x: 0.55, y: 2.55 + i * 0.82, w: 0.08, h: 0.08, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addText(bullet, {
          x: 0.75, y: 2.45 + i * 0.82, w: textW - 0.25, h: 0.68,
          fontFace: c.body, fontSize: 14, color: c.MUTED, lineSpacingMultiple: 1.35,
        })
      })
      break
    }

    case 'quote': {
      s.background = { color: c.BG }
      s.addShape('rect', { x: 0, y: c.H * 0.33, w: c.W, h: c.H * 0.34, fill: { color: ACCENT, transparency: 91 }, line: { color: ACCENT, width: 0 } })
      s.addShape('rect', { x: 0, y: 0, w: 0.06, h: c.H, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText('\u201C', {
        x: 0.4, y: -0.1, w: 2.5, h: 2.8,
        fontFace: c.heading, fontSize: 160, color: ACCENT, transparency: 65,
      })
      s.addShape('ellipse', { x: c.W - 3.5, y: c.H - 3.5, w: 4.5, h: 4.5, fill: { color: ACCENT, transparency: 93 }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.quote ?? slide.heading, {
        x: 1.2, y: 1.5, w: c.W - 2.4, h: 3.0,
        fontFace: c.heading, fontSize: 28, color: textColor, align: 'center',
        italic: true, lineSpacingMultiple: 1.45,
      })
      if (slide.attribution) {
        s.addShape('rect', { x: c.W / 2 - 1.2, y: 5.0, w: 2.4, h: 0.04, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addText(`— ${slide.attribution}`, {
          x: 1.2, y: 5.2, w: c.W - 2.4, h: 0.65,
          fontFace: c.mono, fontSize: 13, color: ACCENT, align: 'center',
        })
      }
      break
    }

    case 'grid': {
      s.background = { color: c.BG }
      addDecoLayer(s, c, ACCENT, 'corner')
      s.addShape('rect', { x: 0, y: 0, w: c.W, h: 0.06, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 0.9, y: 0.38, w: c.W - 1.8, h: 0.95,
        fontFace: c.heading, fontSize: 24, color: textColor, align: 'center',
      })
      s.addShape('rect', { x: c.W / 2 - 1.5, y: 1.42, w: 3.0, h: 0.03, fill: { color: ACCENT, transparency: 50 }, line: { color: ACCENT, width: 0 } })
      const cards = slide.cards ?? []
      const numCards = cards.length
      const cardW = (c.W - 1.8 - (numCards - 1) * 0.35) / Math.max(numCards, 1)
      cards.forEach((card, i) => {
        const xPos = 0.9 + i * (cardW + 0.35)
        s.addShape('rect', { x: xPos, y: 1.6, w: cardW, h: 4.8, fill: { color: c.BG2 }, line: { color: ACCENT + '55', width: 0.5 }, rectRadius: 0.08 })
        s.addShape('rect', { x: xPos, y: 1.6, w: cardW, h: 0.08, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addShape('ellipse', { x: xPos + 0.2, y: 1.85, w: 0.45, h: 0.45, fill: { color: ACCENT, transparency: 80 }, line: { color: ACCENT, width: 0 } })
        s.addText(String(i + 1), {
          x: xPos + 0.2, y: 1.85, w: 0.45, h: 0.45,
          fontFace: c.mono, fontSize: 10, color: ACCENT, align: 'center', valign: 'middle',
        })
        s.addText(card.title, {
          x: xPos + 0.2, y: 2.5, w: cardW - 0.4, h: 1.15,
          fontFace: c.heading, fontSize: 17, color: textColor, lineSpacingMultiple: 1.2,
        })
        s.addText(card.body, {
          x: xPos + 0.2, y: 3.75, w: cardW - 0.4, h: 2.45,
          fontFace: c.body, fontSize: 13, color: c.MUTED, lineSpacingMultiple: 1.55,
        })
      })
      break
    }

    case 'title-only': {
      s.background = { color: c.BG }
      s.addShape('rect', { x: 0, y: 0, w: c.W, h: 0.06, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addShape('rect', { x: 0, y: c.H - 0.06, w: c.W, h: 0.06, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addShape('ellipse', { x: -1.5, y: -1.5, w: 5.0, h: 5.0, fill: { color: ACCENT, transparency: 92 }, line: { color: ACCENT, width: 0 } })
      s.addShape('ellipse', { x: c.W - 2.5, y: c.H - 2.5, w: 5.0, h: 5.0, fill: { color: ACCENT, transparency: 92 }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 1.0, y: 1.8, w: c.W - 2.0, h: 3.0,
        fontFace: c.heading, fontSize: 48, color: textColor,
        align: 'center', bold: false, lineSpacingMultiple: 1.2,
      })
      if (slide.subheading) {
        s.addShape('rect', { x: c.W / 2 - 1.8, y: 5.1, w: 3.6, h: 0.04, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
        s.addText(slide.subheading, {
          x: 1.0, y: 5.4, w: c.W - 2.0, h: 0.75,
          fontFace: c.mono, fontSize: 15, color: ACCENT, align: 'center', charSpacing: 2.5,
        })
      }
      break
    }

    default: {
      s.background = { color: c.BG }
      s.addShape('rect', { x: 0, y: 0, w: 0.06, h: c.H, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } })
      s.addText(slide.heading, {
        x: 0.55, y: 1.0, w: c.W - 1.0, h: 2.0,
        fontFace: c.heading, fontSize: 32, color: textColor,
      })
      if (slide.body) {
        s.addText(slide.body, {
          x: 0.55, y: 3.3, w: c.W - 1.0, h: 3.0,
          fontFace: c.body, fontSize: 14, color: c.MUTED, lineSpacingMultiple: 1.65,
        })
      }
      break
    }
  }
}
