// src/lib/image-engine/renderer/render-poster.ts
// Backend poster renderer. Uses Sharp for compositing.
// Flow: fetch background image → apply effects → composite text overlay via SVG → export PNG.
// Falls back gracefully — never throws hard errors to the route.
//
// FIX SUMMARY (June 2026):
//   Fix 1: Sepia implemented as warm tint overlay, not grayscale
//   Fix 2: CSS gradient effects (warmCreamGradient, founderBlueGlow, festivalWarmGlow,
//           luxuryGoldWash, etc.) converted to Sharp SVG composite layers
//   Fix 3: Variation C renders a real vertical editorial-panel layout
//   Fix 4: CD temperature raised to 0.75 + diverse routing (see creative-director.ts)
//   Fix 5: Overlay-color effects (goldAccent, redAccent) now applied as tint layers

import type { RenderContract, RenderedPoster } from '../types'
import { EFFECTS } from '../effects'
import { exportPosterBuffer } from './export-poster'

interface SharpInstance {
  resize: (w: number, h: number, opts?: object) => SharpInstance
  composite: (layers: object[]) => SharpInstance
  modulate: (opts: object) => SharpInstance
  grayscale: () => SharpInstance
  negate: (opts?: object) => SharpInstance
  sharpen: () => SharpInstance
  png: () => SharpInstance
  toBuffer: () => Promise<Buffer>
  metadata: () => Promise<{ width?: number; height?: number }>
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'BrandSyndicate/2.0 (poster-renderer)' },
    })
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.warn('[render-poster] Image fetch failed:', err)
    return null
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '').slice(0, 6)
  if (cleaned.length < 6) return { r: 10, g: 10, b: 14 }
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  }
}

// FIX-A: Contrast enforcement — never let text colour be invisible on its background.
// Computes relative luminance (WCAG formula) and returns a safe readable colour.
function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1)
  const l2 = luminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker  = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Returns a text colour that is guaranteed ≥4.5:1 contrast against the effective bg.
// effectiveBg should be the gradient scrim colour, NOT the raw photo — we approximate
// it as a semi-transparent dark overlay (#000 at 70% opacity over the palette bg).
function resolveContrastSafeTextColor(
  cdTextColor: string | undefined,
  paletteBackground: string | undefined,
  isDarkOverlay: boolean   // true when a dark gradient scrim is over the photo
): string {
  const candidate = cdTextColor ?? '#ffffff'

  // For templates with a dark photo scrim the effective background is very dark (~#1a1a1a).
  // For solid-colour templates (no background image) the effective bg is the palette colour.
  const effectiveBg = isDarkOverlay ? '#1a1a1a' : (paletteBackground ?? '#ffffff')

  const ratio = contrastRatio(candidate, effectiveBg)

  if (ratio >= 4.5) return candidate   // already passing WCAG AA

  // Candidate fails — pick white or black, whichever wins more contrast
  const whiteRatio = contrastRatio('#ffffff', effectiveBg)
  const blackRatio = contrastRatio('#111111', effectiveBg)
  return whiteRatio >= blackRatio ? '#ffffff' : '#111111'
}

function buildSolidColorSvg(width: number, height: number, hex: string): Buffer {
  const { r, g, b } = hexToRgb(hex)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="rgb(${r},${g},${b})"/></svg>`
  return Buffer.from(svg)
}

// FIX-B1: Layout-aware gradient scrim — darkness goes WHERE the text actually lives.
// layout='bottom-left'|'bottom-center'  → bottom-up scrim (safe full-bleed text zone)
// layout='center'|'top-center'          → full soft dark wash (text is in middle/top)
// isFullBleed (variation B)             → always bottom-up, heavier opacity
// isDarkTemplate                        → stronger overall opacity
function buildGradientOverlaySvg(
  width: number,
  height: number,
  isFullBleed: boolean,
  isDark: boolean,
  textLayout: 'bottom-left' | 'bottom-center' | 'center' | 'top-center' = 'bottom-left'
): Buffer {
  const sc = '0,0,0'
  const strong = isDark ? '0.88' : '0.78'
  const mid    = isDark ? '0.45' : '0.38'
  const fade   = '0.04'

  let gradDef: string

  if (isFullBleed || textLayout === 'bottom-left' || textLayout === 'bottom-center') {
    // Bottom → up: darkest at bottom where text lives.
    // Note: bottom-left is intentionally handled here; the old side-scrim branch
    // was unreachable after disabling the broken half-panel layout and caused TS narrowing errors.
    gradDef = `<linearGradient id="g" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0"    stop-color="rgb(${sc})" stop-opacity="${strong}"/>
      <stop offset="0.50" stop-color="rgb(${sc})" stop-opacity="${mid}"/>
      <stop offset="1"    stop-color="rgb(${sc})" stop-opacity="${fade}"/>
    </linearGradient>`
  } else {
    // Center/top-center: radial soft wash over full image
    gradDef = `<radialGradient id="g" cx="50%" cy="50%" r="70%">
      <stop offset="0"   stop-color="rgb(${sc})" stop-opacity="${mid}"/>
      <stop offset="100%" stop-color="rgb(${sc})" stop-opacity="${strong}"/>
    </radialGradient>`
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs>${gradDef}</defs><rect width="${width}" height="${height}" fill="url(#g)"/></svg>`
  return Buffer.from(svg)
}

function buildVignetteSvg(width: number, height: number, strength: number): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="v" cx="50%" cy="50%" r="70%"><stop offset="50%" stop-color="black" stop-opacity="0"/><stop offset="100%" stop-color="black" stop-opacity="${strength}"/></radialGradient></defs><rect width="${width}" height="${height}" fill="url(#v)"/></svg>`
  return Buffer.from(svg)
}

function buildGrainSvg(width: number, height: number, opacity: number): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="${width}" height="${height}" filter="url(#n)" opacity="${opacity}"/></svg>`
  return Buffer.from(svg)
}

// FIX 1 + 5: Sepia as warm tint, and overlayColor effects rendered as real layers
// Converts a cssGradient string (e.g. "linear-gradient(135deg, rgba(180,120,20,0.25) 0%, ...)") 
// into an SVG gradient composite layer so these actually render in Sharp.
function buildCssGradientSvg(width: number, height: number, cssGradient: string): Buffer | null {
  try {
    // Parse linear-gradient(angle, stop1, stop2 ...)
    const linearMatch = cssGradient.match(/linear-gradient\(\s*([\d.]+)deg,\s*(.+)\)/)
    const radialMatch = cssGradient.match(/radial-gradient\(([^,]+),\s*(.+)\)/)

    if (linearMatch) {
      const angle = parseFloat(linearMatch[1])
      // Convert CSS angle to SVG x1/y1/x2/y2
      const rad = ((angle - 90) * Math.PI) / 180
      const x2 = ((Math.cos(rad) + 1) / 2).toFixed(3)
      const y2 = ((Math.sin(rad) + 1) / 2).toFixed(3)
      const x1 = (1 - parseFloat(x2)).toFixed(3)
      const y1 = (1 - parseFloat(y2)).toFixed(3)

      const stopsRaw = linearMatch[2]
      const stops = parseCssColorStops(stopsRaw)
      if (!stops.length) return null

      const gradDef = `<linearGradient id="cg" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs>${gradDef}</defs><rect width="${width}" height="${height}" fill="url(#cg)"/></svg>`
      return Buffer.from(svg)
    }

    if (radialMatch) {
      const stopsRaw = radialMatch[2]
      const stops = parseCssColorStops(stopsRaw)
      if (!stops.length) return null

      // Use ellipse at position hint if present
      const posMatch = radialMatch[1].match(/at\s+([\d.]+)%\s+([\d.]+)%/)
      const cx = posMatch ? `${posMatch[1]}%` : '50%'
      const cy = posMatch ? `${posMatch[2]}%` : '50%'

      const gradDef = `<radialGradient id="cg" cx="${cx}" cy="${cy}" r="65%">${stops}</radialGradient>`
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs>${gradDef}</defs><rect width="${width}" height="${height}" fill="url(#cg)"/></svg>`
      return Buffer.from(svg)
    }
  } catch {
    // Fall through — unsupported gradient syntax
  }
  return null
}

function parseCssColorStops(stopsRaw: string): string {
  // Split on ", " that precede rgba/rgb/# patterns or "transparent"
  const parts = stopsRaw.split(/,(?=\s*(?:rgba?|#|transparent|\d))/)
  const svgStops: string[] = []
  for (const part of parts) {
    const trimmed = part.trim()
    // rgba(r,g,b,a) offset%
    const rgbaMatch = trimmed.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)\s*([\d.]+)?%?/)
    if (rgbaMatch) {
      const r = rgbaMatch[1], g = rgbaMatch[2], b = rgbaMatch[3]
      const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
      const offset = rgbaMatch[5] !== undefined ? `${rgbaMatch[5]}%` : (svgStops.length === 0 ? '0%' : '100%')
      svgStops.push(`<stop offset="${offset}" stop-color="rgb(${r},${g},${b})" stop-opacity="${a}"/>`)
      continue
    }
    // transparent offset%
    const transMatch = trimmed.match(/transparent\s*([\d.]+)?%?/)
    if (transMatch) {
      const offset = transMatch[1] !== undefined ? `${transMatch[1]}%` : '100%'
      svgStops.push(`<stop offset="${offset}" stop-color="black" stop-opacity="0"/>`)
    }
  }
  return svgStops.join('')
}

// FIX 1: Build a warm sepia tint overlay (dark amber at ~35% opacity) instead of grayscale
function buildSepiaTintSvg(width: number, height: number, sepia: number): Buffer {
  // sepia = 0..1; map to overlay opacity range 0.20..0.55
  const opacity = Math.min(0.55, 0.20 + sepia * 0.50)
  // Warm amber: rgb(112, 66, 20)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="rgba(112,66,20,${opacity.toFixed(2)})"/></svg>`
  return Buffer.from(svg)
}

// FIX 5: overlay colour layer (goldAccent, redAccent, etc.)
function buildColorOverlaySvg(width: number, height: number, hexColor: string, opacity: number): Buffer {
  const { r, g, b } = hexToRgb(hexColor)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="rgba(${r},${g},${b},${opacity.toFixed(3)})"/></svg>`
  return Buffer.from(svg)
}

// FIX 3: Half-image buffer for variation C editorial-panel layout
// Crops the background image to the right half, fills left half with solid colour.
async function buildSplitPanelBuffers(
  sharp: (input: Buffer, opts?: object) => SharpInstance,
  imgBuffer: Buffer,
  W: number,
  H: number,
  panelColor: string,
  doGrayscale: boolean,
  saturation: number,
  brightness: number
): Promise<{ leftPanel: Buffer; rightImage: Buffer }> {
  const leftW = splitPanelLeftWidth(W)
  const rightW = W - leftW

  // Left solid panel
  const { r, g, b } = hexToRgb(panelColor)
  const leftSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${leftW}" height="${H}"><rect width="${leftW}" height="${H}" fill="rgb(${r},${g},${b})"/></svg>`
  )
  const leftPanel = await (sharp(leftSvg, { density: 96 }) as unknown as SharpInstance)
    .resize(leftW, H)
    .png()
    .toBuffer()

  // Right: keep the original image intact. "contain" avoids cutting off products, faces, or hands
  // inside narrow editorial panels. Any empty space uses the panel colour rather than a filter.
  let imgSharp = sharp(imgBuffer).resize(rightW, H, {
    fit: 'contain',
    position: 'centre',
    background: { r, g, b, alpha: 1 },
  }) as unknown as SharpInstance
  if (doGrayscale) imgSharp = imgSharp.grayscale()
  if (saturation !== 1 || brightness !== 1) imgSharp = imgSharp.modulate({ saturation, brightness })
  const rightImage = await imgSharp.png().toBuffer()

  return { leftPanel, rightImage }
}

function escapeXml(str: string): string {
  return (str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function safeFontFamily(font: string): string {
  return (font ?? '').replace(/"/g, '').replace(/'/g, '')
}

// Keep legacy editorial panel sizing consistent between image compositing and text placement.
// The photo side gets more room so product/people images are not sliced too tightly.
function splitPanelLeftWidth(width: number): number {
  return Math.round(width * 0.42)
}

/**
 * EMERGENCY SANITIZER: A final, aggressive safeguard inside the renderer.
 * If any text field contains prompt instructions, it is stripped here
 * before being drawn to the SVG.
 */
function emergencySanitize(text: string | undefined | null, brandName: string, fallback: string = ''): string {
  const val = (text ?? '').trim()
  if (!val) return fallback
  const lower = val.toLowerCase()
  
  const promptMarkers = [
    'create a', 'generate a', 'design a', 'make a', 'prompt:', 'user prompt:',
    'poster for', 'logo for', 'advertisement for', 'instagram post', 'facebook post',
    'social media post', 'campaign for', 'business brief:', 'company brief:',
    'here is a', 'this is a', 'sure, here', 'i will create', 'the poster should',
    'visual metaphor:', 'scene direction:', 'image queries:', 'headline:', 'subheadline:', 'cta:',
    'graphic for', 'design for', 'brand for', 'selling', 'high quality', 'premium', 'luxury'
  ]

  if (promptMarkers.some(m => lower.includes(m)) || val.length > 150) {
    // If it's the brandName being sanitized, we use 'Brand' as fallback
    return fallback || (lower.includes('brand') ? 'Brand' : '')
  }
  return val
}

// FIX-C: Single canonical set — used identically in buildTextSvg, buildSplitTextSvg,
// renderPosterToPng, and the gradient scrim call. No more divergent lists.
const DARK_TEMPLATES = new Set([
  'dark_power_campaign', 'dark_agency_noir', 'service_grid_premium',
  'bold_offer_card', 'founder_ambition', 'transformation_offer',
  'startup_pitch_visual', 'local_market_story',   // ← local_market_story IS dark (dark photo scrim)
])

// ── Per-template typography + layout profiles ─────────────────────────────
interface TemplateProfile {
  headlineFont: string
  subheadlineFont: string
  brandFont: string
  ctaFont: string
  layout: 'bottom-left' | 'center' | 'top-center' | 'bottom-center'
  headlineWeight: number
  headlineLetterSpacing: number
  headlineTransform: 'none' | 'uppercase' | 'capitalize'
  subheadlineWeight: number
  subheadlineLetterSpacing: number
  brandLetterSpacing: number
  brandWeight: number
  headlineSizeRatio: number
  accentElement: 'none' | 'line-accent' | 'bracket' | 'pill' | 'underline' | 'corner-mark'
  subheadlineOpacity: number
  ctaStyle: 'outline' | 'filled' | 'text-only' | 'pill'
}

const TEMPLATE_PROFILES: Record<string, TemplateProfile> = {
  luxury_editorial: {
    headlineFont: 'Georgia, "Times New Roman", serif',
    subheadlineFont: 'Georgia, serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'bottom-left',
    headlineWeight: 400, headlineLetterSpacing: 1, headlineTransform: 'none',
    subheadlineWeight: 300, subheadlineLetterSpacing: 4, brandLetterSpacing: 6, brandWeight: 400,
    headlineSizeRatio: 0.060, accentElement: 'underline', subheadlineOpacity: 0.80, ctaStyle: 'text-only',
  },
  dark_power_campaign: {
    headlineFont: '"Arial Black", "Impact", sans-serif',
    subheadlineFont: '"Arial", sans-serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'bottom-left',
    headlineWeight: 900, headlineLetterSpacing: -2, headlineTransform: 'uppercase',
    subheadlineWeight: 400, subheadlineLetterSpacing: 1, brandLetterSpacing: 8, brandWeight: 800,
    headlineSizeRatio: 0.068, accentElement: 'line-accent', subheadlineOpacity: 0.75, ctaStyle: 'outline',
  },
  dark_agency_noir: {
    headlineFont: '"Arial Black", sans-serif',
    subheadlineFont: '"Arial", sans-serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'bottom-center',
    headlineWeight: 900, headlineLetterSpacing: 8, headlineTransform: 'uppercase',
    subheadlineWeight: 300, subheadlineLetterSpacing: 6, brandLetterSpacing: 12, brandWeight: 400,
    headlineSizeRatio: 0.044, accentElement: 'corner-mark', subheadlineOpacity: 0.65, ctaStyle: 'text-only',
  },
  legacy_story_poster: {
    headlineFont: 'Georgia, serif',
    subheadlineFont: 'Georgia, serif',
    brandFont: 'Georgia, serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'bottom-left',
    headlineWeight: 700, headlineLetterSpacing: -1, headlineTransform: 'none',
    subheadlineWeight: 400, subheadlineLetterSpacing: 0, brandLetterSpacing: 3, brandWeight: 700,
    headlineSizeRatio: 0.058, accentElement: 'bracket', subheadlineOpacity: 0.85, ctaStyle: 'outline',
  },
  heritage_city_campaign: {
    headlineFont: 'Georgia, serif',
    subheadlineFont: 'Georgia, serif',
    brandFont: 'Georgia, serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'bottom-left',
    headlineWeight: 700, headlineLetterSpacing: 2, headlineTransform: 'none',
    subheadlineWeight: 400, subheadlineLetterSpacing: 2, brandLetterSpacing: 6, brandWeight: 400,
    headlineSizeRatio: 0.055, accentElement: 'underline', subheadlineOpacity: 0.80, ctaStyle: 'outline',
  },
  clean_typography_offer: {
    headlineFont: '"Arial Black", sans-serif',
    subheadlineFont: '"Arial", sans-serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'center',
    headlineWeight: 900, headlineLetterSpacing: -3, headlineTransform: 'none',
    subheadlineWeight: 400, subheadlineLetterSpacing: 0, brandLetterSpacing: 4, brandWeight: 400,
    headlineSizeRatio: 0.072, accentElement: 'line-accent', subheadlineOpacity: 0.90, ctaStyle: 'filled',
  },
  service_grid_premium: {
    headlineFont: '"Arial Black", sans-serif',
    subheadlineFont: '"Arial", sans-serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'top-center',
    headlineWeight: 900, headlineLetterSpacing: -1, headlineTransform: 'uppercase',
    subheadlineWeight: 400, subheadlineLetterSpacing: 2, brandLetterSpacing: 8, brandWeight: 800,
    headlineSizeRatio: 0.050, accentElement: 'none', subheadlineOpacity: 0.70, ctaStyle: 'outline',
  },
  care_wellness: {
    headlineFont: 'Georgia, serif',
    subheadlineFont: 'Georgia, serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'bottom-left',
    headlineWeight: 600, headlineLetterSpacing: -1, headlineTransform: 'none',
    subheadlineWeight: 300, subheadlineLetterSpacing: 1, brandLetterSpacing: 4, brandWeight: 400,
    headlineSizeRatio: 0.052, accentElement: 'pill', subheadlineOpacity: 0.82, ctaStyle: 'pill',
  },
  founder_ambition: {
    headlineFont: '"Arial Black", sans-serif',
    subheadlineFont: '"Arial", sans-serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'bottom-left',
    headlineWeight: 900, headlineLetterSpacing: -2, headlineTransform: 'none',
    subheadlineWeight: 400, subheadlineLetterSpacing: 0, brandLetterSpacing: 6, brandWeight: 700,
    headlineSizeRatio: 0.064, accentElement: 'line-accent', subheadlineOpacity: 0.75, ctaStyle: 'filled',
  },
  bold_offer_card: {
    headlineFont: '"Arial Black", sans-serif',
    subheadlineFont: '"Arial", sans-serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'center',
    headlineWeight: 900, headlineLetterSpacing: -3, headlineTransform: 'none',
    subheadlineWeight: 400, subheadlineLetterSpacing: 0, brandLetterSpacing: 6, brandWeight: 800,
    headlineSizeRatio: 0.070, accentElement: 'line-accent', subheadlineOpacity: 0.88, ctaStyle: 'filled',
  },
  transformation_offer: {
    headlineFont: '"Arial Black", sans-serif',
    subheadlineFont: '"Arial", sans-serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'bottom-center',
    headlineWeight: 900, headlineLetterSpacing: -2, headlineTransform: 'none',
    subheadlineWeight: 400, subheadlineLetterSpacing: 1, brandLetterSpacing: 5, brandWeight: 700,
    headlineSizeRatio: 0.060, accentElement: 'bracket', subheadlineOpacity: 0.80, ctaStyle: 'filled',
  },
  local_market_story: {
    headlineFont: 'Georgia, serif',
    subheadlineFont: '"Arial", sans-serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'bottom-left',
    headlineWeight: 700, headlineLetterSpacing: 0, headlineTransform: 'none',
    subheadlineWeight: 400, subheadlineLetterSpacing: 2, brandLetterSpacing: 4, brandWeight: 400,
    headlineSizeRatio: 0.055, accentElement: 'underline', subheadlineOpacity: 0.85, ctaStyle: 'outline',
  },
  testimonial_proof: {
    headlineFont: 'Georgia, serif',
    subheadlineFont: 'Georgia, serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'center',
    headlineWeight: 400, headlineLetterSpacing: 0, headlineTransform: 'none',
    subheadlineWeight: 400, subheadlineLetterSpacing: 0, brandLetterSpacing: 4, brandWeight: 400,
    headlineSizeRatio: 0.048, accentElement: 'bracket', subheadlineOpacity: 0.90, ctaStyle: 'text-only',
  },
  minimal_proof_card: {
    headlineFont: '"Arial", sans-serif',
    subheadlineFont: '"Arial", sans-serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'center',
    headlineWeight: 300, headlineLetterSpacing: 6, headlineTransform: 'uppercase',
    subheadlineWeight: 300, subheadlineLetterSpacing: 4, brandLetterSpacing: 10, brandWeight: 300,
    headlineSizeRatio: 0.040, accentElement: 'corner-mark', subheadlineOpacity: 0.70, ctaStyle: 'text-only',
  },
  startup_pitch_visual: {
    headlineFont: '"Arial Black", sans-serif',
    subheadlineFont: '"Arial", sans-serif',
    brandFont: '"Arial", sans-serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'bottom-left',
    headlineWeight: 900, headlineLetterSpacing: -3, headlineTransform: 'none',
    subheadlineWeight: 400, subheadlineLetterSpacing: 0, brandLetterSpacing: 3, brandWeight: 700,
    headlineSizeRatio: 0.066, accentElement: 'pill', subheadlineOpacity: 0.80, ctaStyle: 'filled',
  },
  festival_celebration: {
    headlineFont: 'Georgia, serif',
    subheadlineFont: 'Georgia, serif',
    brandFont: 'Georgia, serif',
    ctaFont: '"Arial", sans-serif',
    layout: 'center',
    headlineWeight: 700, headlineLetterSpacing: 2, headlineTransform: 'none',
    subheadlineWeight: 400, subheadlineLetterSpacing: 3, brandLetterSpacing: 5, brandWeight: 400,
    headlineSizeRatio: 0.058, accentElement: 'underline', subheadlineOpacity: 0.90, ctaStyle: 'pill',
  },
}

const DEFAULT_PROFILE: TemplateProfile = {
  headlineFont: '"Arial Black", Arial, sans-serif',
  subheadlineFont: '"Arial", sans-serif',
  brandFont: '"Arial", sans-serif',
  ctaFont: '"Arial", sans-serif',
  layout: 'bottom-left',
  headlineWeight: 900, headlineLetterSpacing: -1, headlineTransform: 'none',
  subheadlineWeight: 400, subheadlineLetterSpacing: 0, brandLetterSpacing: 4, brandWeight: 700,
  headlineSizeRatio: 0.054, accentElement: 'none', subheadlineOpacity: 0.88, ctaStyle: 'outline',
}

function getProfile(templateId: string): TemplateProfile {
  return TEMPLATE_PROFILES[templateId] ?? DEFAULT_PROFILE
}

// FIX 3: Variation C text SVG — text lives entirely in left half
function buildSplitTextSvg(contract: RenderContract): Buffer {
  const { size, templateId, headline, subheadline, cta, brandName, watermark, attribution, colors } = contract
  const W = size.width
  const H = size.height
  const M = size.safeMargin
  const leftW = splitPanelLeftWidth(W)

  const prof = getProfile(templateId)
  const isDarkTemplate = DARK_TEMPLATES.has(templateId)

  // FIX-A: contrast-safe text — editorial panel always has a dark left panel
  const textColor = resolveContrastSafeTextColor(colors.text, colors.background, true)
  const accentColor = colors.accent ?? '#C9A84C'

  // FIX-LAYOUT: use fontScale + aspect-aware capping so editorial-panel text fits in all ratios
  const fontScale = (size as any).fontScale ?? 1.0
  const aspectClass = (size as any).aspectClass ?? 'portrait'
  // For editorial-panel, text lives in halfW × H — cap so it never overflows either axis
  const maxFontH = Math.round(H * 0.055)  // never taller than 5.5% of canvas height
  const rawHeadlineSz = Math.round(leftW * prof.headlineSizeRatio * 0.92 * fontScale)
  const headlineSz = Math.min(rawHeadlineSz, maxFontH, 64)
  const subheadlineSz = Math.min(Math.round(leftW * 0.026 * fontScale), Math.round(H * 0.023), 26)
  const brandSz = Math.min(Math.round(leftW * 0.023 * fontScale), Math.round(H * 0.019), 21)
  const ctaSz = Math.min(Math.round(leftW * 0.019 * fontScale), Math.round(H * 0.017), 18)
  const wmSz = Math.round(W * 0.012)

  const textX = M
  const textMaxWidth = leftW - M * 1.6
  // FIX-LAYOUT: anchor text block so headline+sub+cta stack always fits within H
  // Reserve space: top brand (brandSz + M), bottom watermark (~M*0.6), cta stack (~ctaSz*5)
  const reservedTop = M + brandSz * 2.5
  const reservedBottom = M * 0.7 + (ctaSz + M * 0.6) * 2   // cta block + wm
  const availableTextH = H - reservedTop - reservedBottom
  // Position headline block at ~35% of the available text zone for visual balance
  const textY = reservedTop + Math.round(availableTextH * 0.28)
  const brandY = M + brandSz

  const wrapText = (text: string, maxW: number, fontSize: number, maxLines = 3): string => {
    // FIX-LAYOUT: use 0.60 for bold/black weights (Arial Black is wider than 0.52 assumes)
    // This prevents chars from visually overflowing before the wrapping kicks in.
    // Clip line count so editorial-panel cannot push subheadline/CTA into each other on 1:1/16:9/9:16 re-renders.
    const charWidthFactor = prof.headlineWeight >= 700 ? 0.62 : 0.52
    const charsPerLine = Math.max(3, Math.floor(maxW / (fontSize * charWidthFactor)))
    const words = (text || '').split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      const safeWord = word.length > charsPerLine ? word.slice(0, Math.max(2, charsPerLine - 1)) + '…' : word
      const testLine = (current + ' ' + safeWord).trim()
      if (testLine.length > charsPerLine) {
        if (current) lines.push(current.trim())
        current = safeWord
      } else {
        current = testLine
      }
    }
    if (current) lines.push(current.trim())
    const clipped = lines.slice(0, maxLines)
    if (lines.length > maxLines && clipped.length) clipped[clipped.length - 1] = clipped[clipped.length - 1].replace(/[.,;:!?]*$/, '') + '…'
    return clipped.map((line, i) =>
      `<tspan x="${textX}" dy="${i === 0 ? 0 : fontSize * 1.18}">${escapeXml(line)}</tspan>`
    ).join('')
  }

  const applyTransform = (text: string) =>
    prof.headlineTransform === 'uppercase' ? text.toUpperCase()
    : prof.headlineTransform === 'capitalize' ? text.replace(/\b\w/g, c => c.toUpperCase())
    : text

  const cleanHeadline = emergencySanitize(headline, brandName, `${brandName} — Premium`)
  const cleanSubheadline = emergencySanitize(subheadline, brandName, `Experience the excellence of ${brandName}.`)
  const cleanCta = emergencySanitize(cta, brandName, 'Explore Now').slice(0, 32)

  const headlineMaxLines = aspectClass === 'wide' || aspectClass === 'landscape' ? 2 : 3
  const headlineLines = wrapText(applyTransform(cleanHeadline), textMaxWidth, headlineSz, headlineMaxLines)
  const headlineCharsPerLine = Math.max(1, Math.floor(textMaxWidth / (headlineSz * (prof.headlineWeight >= 700 ? 0.62 : 0.52))))
  const headlineWords = cleanHeadline.split(/\s+/).filter(Boolean)
  let headlineLineCountRaw = 1, headlineLineLen = 0
  for (const word of headlineWords) {
    if (headlineLineLen + word.length + 1 > headlineCharsPerLine) {
      headlineLineCountRaw++
      headlineLineLen = word.length
    } else {
      headlineLineLen += word.length + 1
    }
  }
  const headlineLineCount = Math.min(headlineMaxLines, Math.max(1, headlineLineCountRaw))
  const headlineHeight = headlineSz * 1.18 * headlineLineCount

  const subheadlineMaxLines = aspectClass === 'wide' || aspectClass === 'landscape' ? 2 : 3
  const subheadlineLines = cleanSubheadline
    ? wrapText(cleanSubheadline, textMaxWidth * 0.9, subheadlineSz, subheadlineMaxLines)
    : ''
  const subCharsPerLine = Math.max(1, Math.floor((textMaxWidth * 0.9) / (subheadlineSz * 0.56)))
  const subWords = cleanSubheadline.split(/\s+/).filter(Boolean)
  let subLineCountRaw = 1, subLineLen = 0
  for (const word of subWords) {
    if (subLineLen + word.length + 1 > subCharsPerLine) {
      subLineCountRaw++
      subLineLen = word.length
    } else {
      subLineLen += word.length + 1
    }
  }
  const subheadlineLineCount = cleanSubheadline ? Math.min(subheadlineMaxLines, Math.max(1, subLineCountRaw)) : 0
  const subheadlineHeight = subheadlineLineCount > 0 ? subheadlineSz * 1.36 * subheadlineLineCount : 0

  // Vertical divider line between panels
  const dividerX = leftW

  // CTA
  const ctaPadX = M * 0.65
  const ctaPadY = M * 0.30
  const ctaWidth = Math.min((cleanCta?.length ?? 0) * ctaSz * 0.72 + ctaPadX * 2, textMaxWidth)
  const ctaHeight = ctaSz + ctaPadY * 2
  const ctaLetterSpacing = cleanCta.length > 22 ? 1 : 2
  const ctaGap = cleanSubheadline ? Math.max(M * 0.95, ctaSz * 1.35) : Math.max(M * 0.75, ctaSz * 1.1)
  const ctaY = Math.min(textY + headlineHeight + subheadlineHeight + ctaGap, H - ctaHeight - M * 0.8)

  const ctaEl = cleanCta ? `
    <rect x="${textX}" y="${ctaY}" width="${ctaWidth}" height="${ctaHeight}" fill="${accentColor}" rx="2"/>
    <text x="${textX + ctaWidth / 2}" y="${ctaY + ctaHeight * 0.67}" text-anchor="middle" font-family="${safeFontFamily(prof.ctaFont)}" font-size="${ctaSz}" font-weight="800" fill="#000" letter-spacing="${ctaLetterSpacing}">${escapeXml(cleanCta.toUpperCase())}</text>
  ` : ''

  const wmY = H - Math.round(M * 0.32)
  const wmHTML = watermark.show ? `
    <text x="${W / 2}" y="${wmY}" text-anchor="middle" font-family="${safeFontFamily(prof.brandFont)}" font-size="${wmSz}" font-weight="800" letter-spacing="4" opacity="0.55">
      <tspan fill="${watermark.color1}">MADE BY BRAND </tspan><tspan fill="${watermark.color2}">SYNDICATE</tspan>
    </text>
  ` : ''


  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <!-- Master clip — nothing escapes the canvas boundary -->
      <clipPath id="canvas-clip">
        <rect x="0" y="0" width="${W}" height="${H}"/>
      </clipPath>
    </defs>
    <g clip-path="url(#canvas-clip)">
    <!-- Vertical divider -->
    <line x1="${dividerX}" y1="${M * 0.5}" x2="${dividerX}" y2="${H - M * 0.5}" stroke="${accentColor}" stroke-width="1" stroke-opacity="0.5"/>

    <!-- Accent line -->
    <line x1="${textX}" y1="${textY - headlineSz * 0.7}" x2="${textX + Math.round(leftW * 0.18)}" y2="${textY - headlineSz * 0.7}" stroke="${accentColor}" stroke-width="${Math.round(M * 0.04)}" stroke-linecap="square"/>

    <!-- Headline (left panel only) -->
    <text x="${textX}" y="${textY}" font-family="${safeFontFamily(prof.headlineFont)}" font-size="${headlineSz}" font-weight="${prof.headlineWeight}" fill="${textColor}" letter-spacing="${prof.headlineLetterSpacing}">${headlineLines}</text>

    <!-- Subheadline -->
    ${cleanSubheadline ? `<text x="${textX}" y="${textY + headlineHeight + Math.max(M * 0.70, subheadlineSz * 1.05)}" font-family="${safeFontFamily(prof.subheadlineFont)}" font-size="${subheadlineSz}" font-weight="${prof.subheadlineWeight}" fill="${textColor}" letter-spacing="${prof.subheadlineLetterSpacing}" opacity="${prof.subheadlineOpacity}">${subheadlineLines}</text>` : ''}

    <!-- CTA -->
    ${ctaEl}

    <!-- Watermark -->
    ${wmHTML}
    </g>
  </svg>`

  return Buffer.from(svg)
}

function buildTextSvg(contract: RenderContract): Buffer {
  const { size, templateId, variation, headline, subheadline, cta, serviceTags, brandName, watermark, attribution, colors, backgroundImage } = contract
  const W = size.width
  const H = size.height
  const M = size.safeMargin

  const prof = getProfile(templateId)
  // Support layoutOverride injected by edit-poster for user-requested text placement
  const _layoutOverride = (contract as any)._layoutOverride as string | undefined
  const effectiveProf: TemplateProfile = _layoutOverride && ['bottom-left','center','top-center','bottom-center'].includes(_layoutOverride)
    ? { ...prof, layout: _layoutOverride as TemplateProfile['layout'] }
    : prof
  // Use effectiveProf throughout — shadows prof for layout-sensitive logic below
  Object.assign(prof, effectiveProf)
  const isDarkTemplate = DARK_TEMPLATES.has(templateId)
  const isServiceGrid = templateId === 'service_grid_premium'

  // FIX-A: contrast-safe text colour.
  // When a background photo is present, a dark scrim overlays it — effective bg is dark.
  // When no photo (solid colour only), use the actual palette background for contrast check.
  const hasPhotoBackground = !!(backgroundImage?.url || (backgroundImage as any)?.cleanBackgroundUrl || (backgroundImage as any)?.permanentUrl)
  const textColor = resolveContrastSafeTextColor(
    colors.text,
    colors.background,
    isDarkTemplate || hasPhotoBackground
  )
  const accentColor = colors.accent ?? '#C9A84C'

  // FIX-LAYOUT: font sizes must respect BOTH width AND height.
  // Pure W-scaling makes fonts huge on wide/landscape formats.
  // Use: min(W-based, H-based cap, absolute pixel cap) × fontScale
  const fontScale = (size as any).fontScale ?? 1.0
  const aspectClass = (size as any).aspectClass ?? 'portrait'

  // H-caps prevent runaway sizes on landscape. Values tuned per element.
  const hCapHeadline = aspectClass === 'wide' ? Math.round(H * 0.10)
    : aspectClass === 'landscape' ? Math.round(H * 0.12)
    : Math.round(H * 0.08)
  const hCapSub      = Math.round(H * 0.038)
  const hCapBrand    = Math.round(H * 0.030)
  const hCapCta      = Math.round(H * 0.026)

  // Pre-sanitize for sizing. Long placeholder/user text used to overflow the
  // dark text panel on small previews; scale typography before layout math.
  const earlyCleanHeadline = emergencySanitize(headline, brandName, `${brandName} — Premium`)
  const earlyCleanSubheadline = emergencySanitize(subheadline, brandName, `Experience the excellence of ${brandName}.`)
  const headlineLengthScale = Math.max(0.68, Math.min(1, 48 / Math.max(48, earlyCleanHeadline.length)))
  const subheadlineLengthScale = Math.max(0.76, Math.min(1, 92 / Math.max(92, earlyCleanSubheadline.length)))

  const rawHeadlineSz = Math.round(W * prof.headlineSizeRatio * fontScale)
  const headlineSz    = Math.round(Math.min(rawHeadlineSz, hCapHeadline, 86) * 0.88 * headlineLengthScale)
  const subheadlineSz = Math.round(Math.min(Math.round(W * 0.022 * fontScale), hCapSub, 30) * 0.90 * subheadlineLengthScale)
  const brandSz       = Math.min(Math.round(W * 0.020 * fontScale), hCapBrand, 24)
  const ctaSz         = Math.round(Math.min(Math.round(W * 0.017 * fontScale), hCapCta, 22) * 0.90)
  const tagSz         = Math.min(Math.round(W * 0.016 * fontScale), Math.round(H * 0.024), 20)
  const wmSz          = Math.min(Math.round(W * 0.012), Math.round(H * 0.014), 18)
  const attrSz        = Math.min(Math.round(W * 0.010), 14)
  const headlineStrokeColor = hasPhotoBackground ? 'rgba(0,0,0,0.36)' : 'none'
  const headlineStrokeWidth = hasPhotoBackground ? Math.max(1.2, headlineSz * 0.055) : 0
  const subheadlineStrokeColor = hasPhotoBackground ? 'rgba(0,0,0,0.28)' : 'none'
  const subheadlineStrokeWidth = hasPhotoBackground ? Math.max(0.8, subheadlineSz * 0.05) : 0

  // FIX 3: variation A = original layout, B = full-bleed position shift, C = handled separately
  const isFullBleed = variation === 'B'

  let textX: number, textY: number, textAnchor: string, textMaxWidth: number
  let brandX: number, brandY: number, brandAnchor: string

  // FIX-LAYOUT: compute a safe text block height budget so nothing overflows.
  // We estimate: headline (2 lines) + subheadline (2 lines) + CTA + safe padding.
  // This budget is used to anchor textY so the full stack fits within canvas.
  const estHeadlineH  = headlineSz * 1.18 * 2
  const estSubH       = subheadlineSz * 1.4 * 2
  const estCtaH       = ctaSz * 2.8
  const estTotalBlock = estHeadlineH + estSubH + estCtaH + M * 2.5
  const minTextY      = M + brandSz * 2 + M * 0.5   // below brand name
  const maxTextY      = H - estTotalBlock             // so stack doesn't overflow bottom

  // Helper: clamp textY into the safe zone
  const safeTextY = (raw: number) => Math.max(minTextY, Math.min(raw, Math.max(minTextY, maxTextY)))

  switch (prof.layout) {
    case 'center':
      textX = W / 2
      textY = safeTextY(H * (isFullBleed ? 0.42 : 0.38))
      textAnchor = 'middle'
      textMaxWidth = W * 0.78
      brandX = W / 2
      brandY = M + brandSz
      brandAnchor = 'middle'
      break
    case 'top-center':
      textX = W / 2
      // top-center: start high but never above the brand name
      textY = safeTextY(Math.max(M + brandSz * 2.5, H * 0.16))
      textAnchor = 'middle'
      textMaxWidth = W * 0.80
      brandX = W / 2
      brandY = M + brandSz
      brandAnchor = 'middle'
      break
    case 'bottom-center':
      textX = W / 2
      // bottom-center: anchor from bottom, never too low to overflow
      textY = safeTextY(H - estTotalBlock - M * 0.5)
      textAnchor = 'middle'
      textMaxWidth = W * 0.80
      brandX = W / 2
      brandY = M + brandSz
      brandAnchor = 'middle'
      break
    case 'bottom-left':
      textX = M
      // bottom-left: vertical center of left panel
      textY = safeTextY(H * 0.30)
      textAnchor = 'start'
      textMaxWidth = W * 0.52   // conservative — left half minus margin
      brandX = M
      brandY = M + brandSz
      brandAnchor = 'start'
      break
    case 'bottom-left':
    default: {
      textX = M
      // FIX-LAYOUT: for landscape/wide formats H is small — anchor from bottom
      // For portrait/square — use fractional position as before
      const rawTextY = isFullBleed
        ? H - estTotalBlock - M            // full-bleed always anchors from bottom
        : (aspectClass === 'landscape' || aspectClass === 'wide')
          ? H - estTotalBlock - M * 1.2   // landscape: anchor from bottom
          : H * 0.32                       // portrait/square: standard position
      textY = safeTextY(rawTextY)
      textAnchor = 'start'
      textMaxWidth = W * 0.62
      brandX = M
      brandY = M + brandSz
      brandAnchor = 'start'
      break
    }
  }

  const wrapText = (text: string, maxW: number, fontSize: number, anchor: string, maxLines = 4): string => {
    // FIX-LAYOUT: bold/black fonts (Arial Black) are ~20% wider than 0.52 assumes.
    // Clip line count so text cannot overlap CTA/watermark after size re-render.
    const charWidthFactor = prof.headlineWeight >= 700 ? 0.62 : 0.52
    const charsPerLine = Math.max(3, Math.floor(maxW / (fontSize * charWidthFactor)))
    const words = (text || '').split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      const safeWord = word.length > charsPerLine ? word.slice(0, Math.max(2, charsPerLine - 1)) + '…' : word
      const testLine = (current + ' ' + safeWord).trim()
      if (testLine.length > charsPerLine) {
        if (current) lines.push(current.trim())
        current = safeWord
      } else {
        current = testLine
      }
    }
    if (current) lines.push(current.trim())
    const clipped = lines.slice(0, maxLines)
    if (lines.length > maxLines && clipped.length) clipped[clipped.length - 1] = clipped[clipped.length - 1].replace(/[.,;:!?]*$/, '') + '…'
    return clipped.map((line, i) =>
      `<tspan x="${textX}" dy="${i === 0 ? 0 : fontSize * 1.18}">${escapeXml(line)}</tspan>`
    ).join('')
  }

  // FIX-LAYOUT: for landscape/wide, use a tighter max line width to keep text compact
  const effectiveTextMaxWidth = (aspectClass === 'landscape' || aspectClass === 'wide')
    ? Math.min(textMaxWidth, H * 1.4)   // cap width relative to height for wide formats
    : textMaxWidth

  // EMERGENCY SANITIZATION
  const cleanHeadline = emergencySanitize(headline, brandName, `${brandName} — Premium`)
  const cleanSubheadline = emergencySanitize(subheadline, brandName, `Experience the excellence of ${brandName}.`)
  const cleanCta = emergencySanitize(cta, brandName, 'Explore Now').slice(0, 32)

  const headlineLines = wrapText(cleanHeadline, effectiveTextMaxWidth, headlineSz, textAnchor)
  // More accurate line count: measure actual wrapped lines
  const wrapCharFactor = prof.headlineWeight >= 700 ? 0.62 : 0.52
  const charsPerLineEst = Math.max(1, Math.floor(effectiveTextMaxWidth / (headlineSz * wrapCharFactor)))
  const headlineWords = cleanHeadline.split(' ')
  let lineCount = 1, lineLen = 0
  for (const w of headlineWords) {
    if (lineLen + w.length + 1 > charsPerLineEst) { lineCount++; lineLen = w.length } else { lineLen += w.length + 1 }
  }
  const headlineLineCount = Math.min((aspectClass === 'wide' || aspectClass === 'landscape') ? 2 : 3, lineCount)
  const headlineHeight = headlineSz * 1.18 * headlineLineCount
  const subheadlineLines = wrapText(cleanSubheadline, effectiveTextMaxWidth * 0.92, subheadlineSz, textAnchor, (aspectClass === 'wide' || aspectClass === 'landscape') ? 2 : 3)
  const subheadlineLineCount = Math.min((aspectClass === 'wide' || aspectClass === 'landscape') ? 2 : 3, Math.ceil((subheadline ?? '').split(' ').length / 6))
  const subheadlineHeight = subheadlineSz * 1.4 * Math.max(1, subheadlineLineCount)

  // Final safety: shift the whole text stack upward when headline/subheadline/CTA would collide
  // with the bottom edge. This prevents container and button overlaps on mobile-sized previews.
  const estimatedBottom = textY + headlineHeight + (cleanSubheadline ? Math.max(M * 0.68, subheadlineSz * 1.05) + subheadlineHeight : 0) + Math.max(M * 1.05, ctaSz * 1.5) + ctaSz + M * 0.8
  const overflow = estimatedBottom - (H - M * 0.7)
  if (overflow > 0) textY = Math.max(minTextY, textY - overflow)

  const alignedX = (width: number) => textAnchor === 'middle' ? textX - width / 2 : textX

  // Accent decorative elements
  let accentEl = ''
  const acX = textAnchor === 'middle' ? textX - textMaxWidth * 0.3 : textX
  const acY = textY - headlineSz * 0.6

  switch (prof.accentElement) {
    case 'line-accent':
      accentEl = `<line x1="${acX}" y1="${acY}" x2="${acX + Math.round(W * 0.06)}" y2="${acY}" stroke="${accentColor}" stroke-width="${Math.round(M * 0.04)}" stroke-linecap="square"/>`
      break
    case 'underline':
      accentEl = `<line x1="${textX}" y1="${textY + headlineHeight + Math.round(M * 0.15)}" x2="${textX + Math.round(W * 0.12)}" y2="${textY + headlineHeight + Math.round(M * 0.15)}" stroke="${accentColor}" stroke-width="2" stroke-linecap="butt"/>`
      break
    case 'bracket': {
      const bx = textAnchor === 'middle' ? textX - textMaxWidth * 0.38 : textX - Math.round(M * 0.35)
      const by = textY - headlineSz * 0.9
      const bh = headlineHeight + Math.round(M * 0.3)
      const bw = Math.round(M * 0.3)
      accentEl = `<path d="M${bx + bw},${by} L${bx},${by} L${bx},${by + bh} L${bx + bw},${by + bh}" fill="none" stroke="${accentColor}" stroke-width="2" stroke-linecap="square"/>`
      break
    }
    case 'corner-mark': {
      const cmx = W - M - Math.round(M * 0.5)
      const cmy = M
      accentEl = `<path d="M${cmx},${cmy} L${cmx + Math.round(M * 0.5)},${cmy} L${cmx + Math.round(M * 0.5)},${cmy + Math.round(M * 0.5)}" fill="none" stroke="${accentColor}" stroke-width="1.5" stroke-linecap="square"/>`
      break
    }
    case 'pill': {
      const pill = cleanSubheadline?.slice(0, 20) ?? ''
      const pillW = Math.min(pill.length * ctaSz * 0.54 + M * 0.8, effectiveTextMaxWidth)
      const pillH = ctaSz + M * 0.4
      const pillX = alignedX(pillW)
      // Text y is a baseline; glyphs rise above it. Keep the pill above the full headline
      // cap-height with a real gap, otherwise the label sits on top of the headline.
      const pillY = Math.max(M + brandSz * 2.25, textY - headlineSz * 1.45 - pillH - Math.max(12, M * 0.26))
      accentEl = pill ? `
        <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" fill="${accentColor}" rx="${pillH / 2}"/>
        <text x="${pillX + pillW / 2}" y="${pillY + pillH * 0.68}" text-anchor="middle" font-family="${safeFontFamily(prof.ctaFont)}" font-size="${Math.round(ctaSz * 0.78)}" font-weight="700" fill="${isDarkTemplate ? '#000' : '#fff'}" letter-spacing="1">${escapeXml(pill.toUpperCase())}</text>
      ` : ''
      break
    }
    default:
      accentEl = ''
  }

  // CTA element
  const ctaPadX = M * 0.65
  const ctaPadY = M * 0.30
  const ctaWidth = Math.min((cleanCta?.length ?? 0) * ctaSz * 0.78 + ctaPadX * 2, W - M * 2)
  const ctaHeight = ctaSz + ctaPadY * 2
  const ctaX = alignedX(ctaWidth)
  const ctaLetterSpacing = cleanCta.length > 22 ? 1 : 2
  // FIX-LAYOUT: use actual computed subheadlineHeight (not static *2) for accurate spacing
  // Add a slightly larger, fixed minimum gap so subheadline and CTA never touch on compact/wide crops.
  const ctaGap = cleanSubheadline ? subheadlineHeight + Math.max(M * 0.90, ctaSz * 1.35) : Math.max(M * 0.82, ctaSz * 1.25)
  const ctaY = Math.min(textY + headlineHeight + ctaGap, H - ctaHeight - M * 0.8)

  const panelTop = Math.max(M * 0.55, textY - headlineSz * 1.05)
  const panelBottom = Math.min(H - M * 0.5, ctaY + ctaHeight + M * 0.42)
  const panelWidth = Math.min(effectiveTextMaxWidth + M * 1.1, W - M)
  const panelX = textAnchor === 'middle' ? (W - panelWidth) / 2 : Math.max(M * 0.45, textX - M * 0.36)
  const panelFill = textColor === '#111111' ? 'rgba(255,255,255,0.68)' : 'rgba(0,0,0,0.42)'
  const textPanelEl = hasPhotoBackground ? `<rect x="${panelX}" y="${panelTop}" width="${panelWidth}" height="${Math.max(M * 1.2, panelBottom - panelTop)}" fill="${panelFill}" rx="${Math.max(6, M * 0.10)}"/>` : ''

  let ctaEl = ''
  if (cleanCta) {
    switch (prof.ctaStyle) {
      case 'filled':
        ctaEl = `
          <rect x="${ctaX}" y="${ctaY}" width="${ctaWidth}" height="${ctaHeight}" fill="${accentColor}" rx="3"/>
          <text x="${ctaX + ctaWidth / 2}" y="${ctaY + ctaHeight * 0.67}" text-anchor="middle" font-family="${safeFontFamily(prof.ctaFont)}" font-size="${ctaSz}" font-weight="800" fill="${isDarkTemplate ? '#000' : '#fff'}" letter-spacing="${ctaLetterSpacing}">${escapeXml(cleanCta.toUpperCase())}</text>
        `
        break
      case 'pill':
        ctaEl = `
          <rect x="${ctaX}" y="${ctaY}" width="${ctaWidth}" height="${ctaHeight}" fill="${accentColor}" rx="${ctaHeight / 2}"/>
          <text x="${ctaX + ctaWidth / 2}" y="${ctaY + ctaHeight * 0.67}" text-anchor="middle" font-family="${safeFontFamily(prof.ctaFont)}" font-size="${ctaSz}" font-weight="700" fill="${isDarkTemplate ? '#000' : '#fff'}" letter-spacing="${ctaLetterSpacing}">${escapeXml(cleanCta)}</text>
        `
        break
      case 'text-only':
        ctaEl = `
          <text x="${ctaX}" y="${ctaY + ctaHeight * 0.67}" font-family="${safeFontFamily(prof.ctaFont)}" font-size="${ctaSz}" font-weight="600" fill="${accentColor}" letter-spacing="${ctaLetterSpacing}">${escapeXml(cleanCta.toUpperCase())} &#x2192;</text>
        `
        break
      case 'outline':
      default:
        ctaEl = `
          <rect x="${ctaX}" y="${ctaY}" width="${ctaWidth}" height="${ctaHeight}" fill="none" stroke="${accentColor}" stroke-width="1.5" rx="2"/>
          <text x="${ctaX + ctaPadX}" y="${ctaY + ctaHeight * 0.65}" font-family="${safeFontFamily(prof.ctaFont)}" font-size="${ctaSz}" font-weight="800" fill="${accentColor}" letter-spacing="${ctaLetterSpacing}">${escapeXml(cleanCta.toUpperCase())}</text>
        `
    }
  }

  // Service tags grid
  const tagGridY = H - M * 4.2
  const tagW = (W - M * 2 - M * 0.3 * 2) / 3
  const tagH = Math.round(M * 0.88)
  const serviceTagsElements = isServiceGrid && serviceTags.length > 0
    ? serviceTags.slice(0, 6).map((tag, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const tx = M + col * (tagW + M * 0.3)
        const ty = tagGridY + row * (tagH + M * 0.2)
        return `
          <rect x="${tx}" y="${ty}" width="${tagW}" height="${tagH}" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" stroke-width="1" rx="2"/>
          <text x="${tx + tagW / 2}" y="${ty + tagH * 0.64}" text-anchor="middle" font-family="${safeFontFamily(prof.ctaFont)}" font-size="${tagSz}" font-weight="700" fill="${textColor}" letter-spacing="2">${escapeXml(tag.toUpperCase())}</text>
        `
      }).join('')
    : ''

  const wmY = H - Math.round(M * 0.32)
  const wmHTML = watermark.show ? `
    <text x="${W / 2}" y="${wmY}" text-anchor="middle" font-family="${safeFontFamily(prof.brandFont)}" font-size="${wmSz}" font-weight="800" letter-spacing="4" opacity="0.55">
      <tspan fill="${watermark.color1}">MADE BY BRAND </tspan><tspan fill="${watermark.color2}">SYNDICATE</tspan>
    </text>
  ` : ''

  const attrHTML = !watermark.show && attribution.show && attribution.text ? `
    <text x="${W - M}" y="${H - Math.round(M * 0.3)}" text-anchor="end" font-family="${safeFontFamily(prof.brandFont)}" font-size="${attrSz}" fill="rgba(255,255,255,0.38)">${escapeXml(attribution.text)}</text>
  ` : ''

  const borderEffectId = contract.effects.find(id => EFFECTS[id]?.borderStyle)
  const borderEl = borderEffectId ? `
    <rect x="${Math.round(M * 0.48)}" y="${Math.round(M * 0.48)}" width="${W - M}" height="${H - M}" fill="none" stroke="${accentColor}" stroke-width="1" stroke-opacity="0.5"/>
  ` : ''

  const applyTransform = (text: string) =>
    prof.headlineTransform === 'uppercase' ? (text ?? '').toUpperCase()
    : prof.headlineTransform === 'capitalize' ? (text ?? '').replace(/\b\w/g, c => c.toUpperCase())
    : (text ?? '')

  const headlineLinesTransformed = wrapText(applyTransform(cleanHeadline ?? ''), effectiveTextMaxWidth, headlineSz, textAnchor, (aspectClass === 'wide' || aspectClass === 'landscape') ? 2 : 3)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <!-- Master clip — nothing exits the canvas boundary -->
      <clipPath id="canvas-clip">
        <rect x="0" y="0" width="${W}" height="${H}"/>
      </clipPath>
    </defs>
    <g clip-path="url(#canvas-clip)">
    ${textPanelEl}
    ${accentEl}
    <text x="${textX}" y="${textY}" text-anchor="${textAnchor}" font-family="${safeFontFamily(prof.headlineFont)}" font-size="${headlineSz}" font-weight="${prof.headlineWeight}" fill="${textColor}" letter-spacing="${prof.headlineLetterSpacing}" stroke="${headlineStrokeColor}" stroke-width="${headlineStrokeWidth}" paint-order="stroke fill" stroke-linejoin="round">${headlineLinesTransformed}</text>
    ${cleanSubheadline ? `<text x="${textX}" y="${textY + headlineHeight + Math.max(M * 0.68, subheadlineSz * 1.05)}" text-anchor="${textAnchor}" font-family="${safeFontFamily(prof.subheadlineFont)}" font-size="${subheadlineSz}" font-weight="${prof.subheadlineWeight}" fill="${textColor}" letter-spacing="${prof.subheadlineLetterSpacing}" opacity="${prof.subheadlineOpacity}" stroke="${subheadlineStrokeColor}" stroke-width="${subheadlineStrokeWidth}" paint-order="stroke fill" stroke-linejoin="round">${subheadlineLines}</text>` : ''}
    ${ctaEl}
    ${serviceTagsElements}
    ${borderEl}
    </g>
  </svg>`

  return Buffer.from(svg)
}

export async function renderPosterToPng(
  contract: RenderContract,
  generationId: string
): Promise<RenderedPoster> {
  if (process.env.ENABLE_BACKEND_POSTER_RENDERER === 'false') {
    return {
      success: false,
      finalPosterUrl: null,
      storageType: 'local',
      rendererUsed: 'disabled',
      failureReason: 'ENABLE_BACKEND_POSTER_RENDERER=false',
    }
  }

  try {
    const sharpTest = (await import('sharp')).default
    await (sharpTest(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'), { density: 72 }) as unknown as SharpInstance).png().toBuffer()
  } catch (sharpLoadErr) {
    console.error('[render-poster] sharp native binding unavailable', sharpLoadErr)
    return {
      success: false,
      finalPosterUrl: null,
      storageType: 'local',
      rendererUsed: 'sharp-composite',
      failureReason: `sharp unavailable: ${sharpLoadErr instanceof Error ? sharpLoadErr.message : String(sharpLoadErr)}`,
    }
  }

  try {
    const sharp = (await import('sharp')).default

    const { size, backgroundImage, effects, colors, templateId, variation } = contract
    const W = size.width
    const H = size.height
    const M = size.safeMargin

    const isDarkTemplate = DARK_TEMPLATES.has(templateId)
    const preserveOriginalPhoto = !!(backgroundImage?.url || (backgroundImage as any)?.cleanBackgroundUrl)

    // Support layoutOverride from edit-poster: user requested a specific text placement
    // that differs from the template's default. Store as size.layoutOverride.
    const layoutOverride = (size as any).layoutOverride as string | undefined

    // Variation C is no longer used; any legacy C request is redirected earlier.
    const safeVariation = variation === 'C' ? 'B' : variation
    const isSplitPanel = false
    const isFullBleed = safeVariation === 'B'

    // ── Resolve effect settings ───────────────────────────────────────────────
    // FIX 1: sepia no longer maps to grayscale — it uses a warm tint overlay
    let saturation = 1.0
    let brightness = 1.0
    let doGrayscale = false
    let vignetteStrength = 0
    let grainOpacity = 0
    let sepiaValue = 0      // FIX 1: track max sepia value
    const cssGradientsToRender: string[] = []   // FIX 2: collect gradient effects
    const overlayColors: Array<{ color: string; opacity: number }> = []  // FIX 5

    for (const id of effects) {
      const e = EFFECTS[id]
      if (!e) continue
      if (e.saturationFilter !== undefined) saturation *= e.saturationFilter
      if (e.brightnessFilter !== undefined) brightness *= e.brightnessFilter
      // FIX 1: track sepia separately, do NOT set doGrayscale here
      if (e.sepia !== undefined && e.sepia > sepiaValue) sepiaValue = e.sepia
      if (e.grainOpacity > grainOpacity) grainOpacity = e.grainOpacity
      if (e.vignetteStrength > vignetteStrength) vignetteStrength = e.vignetteStrength
      if (id === 'blackWhite') doGrayscale = true
      // FIX 2: collect CSS gradients that should be rendered as composite layers
      if (e.cssGradient) cssGradientsToRender.push(e.cssGradient)
      // FIX 5: overlay colour effects
      if (e.overlayColor && e.overlayOpacity) {
        overlayColors.push({ color: e.overlayColor, opacity: e.overlayOpacity })
      }
    }

    if (preserveOriginalPhoto) {
      doGrayscale = false
      saturation = 1.0
      brightness = 1.0
      sepiaValue = 0
      cssGradientsToRender.length = 0
      overlayColors.length = 0
      grainOpacity = 0
      vignetteStrength = 0
    }


    // ── Step 1: Base canvas — always use the palette background colour ────────
    const bgHex = colors.background ?? (isDarkTemplate ? '#0a0a0e' : '#FAFAF7')
    const bgSvg = buildSolidColorSvg(W, H, bgHex)
    const bgPngBuffer = await (sharp(bgSvg, { density: 96 }) as unknown as SharpInstance)
      .resize(W, H)
      .png()
      .toBuffer()
    let canvas: SharpInstance = sharp(bgPngBuffer) as unknown as SharpInstance

    const layers: object[] = []

    // ── Step 2: Background image ─────────────────────────────────────────────
    if (backgroundImage?.url || (backgroundImage as any)?.cleanBackgroundUrl) {
      // Use cleanBackgroundUrl if set (permanently-hosted raw stock photo, no text baked in).
      // Falls back to the original stock URL. Never use permanentUrl — that pointed to the
      // fully-rendered text-baked poster in old code, which caused double-text on every resize.
      const fetchUrl = (backgroundImage as any).cleanBackgroundUrl ?? backgroundImage?.url
      const imgBuffer = await fetchImageBuffer(fetchUrl)
      if (imgBuffer) {
        try {
          // FIX 3: variation C — editorial panel compositing
          if (isSplitPanel) {
            const panelColor = colors.background ?? (isDarkTemplate ? '#0a0a0e' : '#F5EED8')
            const { leftPanel, rightImage } = await buildSplitPanelBuffers(
              sharp as unknown as (input: Buffer, opts?: object) => SharpInstance,
              imgBuffer, W, H, panelColor, doGrayscale, saturation, brightness
            )
            // Left solid panel fills entire canvas width at half
            layers.push({ input: leftPanel, top: 0, left: 0 })
            // Right image fills right half
            layers.push({ input: rightImage, top: 0, left: splitPanelLeftWidth(W) })
          } else {
            // Standard full-canvas image
            let imgSharp = sharp(imgBuffer).resize(W, H, { fit: 'cover', position: preserveOriginalPhoto ? 'attention' : 'centre' }) as unknown as SharpInstance
            if (doGrayscale) imgSharp = imgSharp.grayscale()
            if (saturation !== 1 || brightness !== 1) imgSharp = imgSharp.modulate({ saturation, brightness })
            const processedImgBuffer = await imgSharp.png().toBuffer()
            layers.push({ input: processedImgBuffer, top: 0, left: 0 })
          }
        } catch (imgErr) {
          console.warn('[render-poster] Image processing failed:', imgErr)
        }
      }
    }

    // ── Step 3: Gradient overlay (dark scrim over photo) — layout-aware ──────
    if (!preserveOriginalPhoto && (backgroundImage?.url || (backgroundImage as any)?.cleanBackgroundUrl) && !isSplitPanel) {
      const prof = getProfile(templateId)
      const gradSvg = buildGradientOverlaySvg(W, H, isFullBleed, isDarkTemplate, prof.layout)
      const gradBuffer = await (sharp(gradSvg, { density: 96 }) as unknown as SharpInstance).resize(W, H).png().toBuffer()
      layers.push({ input: gradBuffer, top: 0, left: 0 })
    }

    // ── Step 4: FIX 2 — CSS gradient effects as actual composite layers ───────
    for (const cssGradient of cssGradientsToRender) {
      const gradSvgBuffer = buildCssGradientSvg(W, H, cssGradient)
      if (gradSvgBuffer) {
        try {
          const gradBuffer = await (sharp(gradSvgBuffer, { density: 96 }) as unknown as SharpInstance).resize(W, H).png().toBuffer()
          layers.push({ input: gradBuffer, top: 0, left: 0, blend: 'over' as const })
        } catch {
          console.warn('[render-poster] CSS gradient layer failed for:', cssGradient.slice(0, 40))
        }
      }
    }

    // ── Step 5: FIX 1 — Sepia warm tint (instead of grayscale) ──────────────
    if (sepiaValue > 0.3) {
      // First desaturate partially, then apply warm amber overlay
      // The image was already modulated with saturationFilter: 0.75 from sepiaHeritage
      // Now add the warm tint on top
      const sepiaTintSvg = buildSepiaTintSvg(W, H, sepiaValue)
      try {
        const sepiaTintBuffer = await (sharp(sepiaTintSvg, { density: 96 }) as unknown as SharpInstance).resize(W, H).png().toBuffer()
        layers.push({ input: sepiaTintBuffer, top: 0, left: 0, blend: 'multiply' as const })
      } catch {
        console.warn('[render-poster] Sepia tint layer failed')
      }
    }

    // ── Step 6: FIX 5 — Overlay colour effects (goldAccent, redAccent) ───────
    for (const ov of overlayColors) {
      const ovSvg = buildColorOverlaySvg(W, H, ov.color, ov.opacity)
      try {
        const ovBuffer = await (sharp(ovSvg, { density: 96 }) as unknown as SharpInstance).resize(W, H).png().toBuffer()
        layers.push({ input: ovBuffer, top: 0, left: 0, blend: 'over' as const })
      } catch {
        console.warn('[render-poster] Overlay colour layer failed')
      }
    }

    // ── Step 7: Grain ─────────────────────────────────────────────────────────
    if (grainOpacity > 0.05) {
      const grainSvg = buildGrainSvg(W, H, grainOpacity)
      const grainBuffer = await (sharp(grainSvg, { density: 96 }) as unknown as SharpInstance).resize(W, H).png().toBuffer()
      layers.push({ input: grainBuffer, top: 0, left: 0, blend: 'overlay' as const })
    }

    // ── Step 8: Vignette ──────────────────────────────────────────────────────
    if (vignetteStrength > 0.1) {
      const vignSvg = buildVignetteSvg(W, H, vignetteStrength)
      const vignBuffer = await (sharp(vignSvg, { density: 96 }) as unknown as SharpInstance).resize(W, H).png().toBuffer()
      layers.push({ input: vignBuffer, top: 0, left: 0 })
    }

    // ── Step 9: Text overlay ──────────────────────────────────────────────────
    // FIX 3: variation C uses editorial-panel text layout
    // Apply layoutOverride from edit-poster if present — temporarily patches the contract
    let renderContract = contract
    if (layoutOverride) {
      const validLayouts = ['bottom-left','center','top-center','bottom-center']
      if (validLayouts.includes(layoutOverride)) {
        // Patch a copy of the contract's template profile at render time only
        // We do this by injecting a synthetic templateId override key that buildTextSvg reads
        renderContract = {
          ...contract,
          templateId: contract.templateId,
          _layoutOverride: layoutOverride,
        } as any
      }
    }
    const textSvgBuffer = isSplitPanel ? buildSplitTextSvg(renderContract) : buildTextSvg(renderContract)
    const textPngBuffer = await (sharp(textSvgBuffer, { density: 96 }) as unknown as SharpInstance).resize(W, H).png().toBuffer()
    layers.push({ input: textPngBuffer, top: 0, left: 0 })

    // ── Step 10: Composite all layers ─────────────────────────────────────────
    const finalBuffer = await (canvas.composite(layers) as SharpInstance).png().toBuffer()

    return await exportPosterBuffer(finalBuffer, generationId)
  } catch (err) {
    console.error('[render-poster] Renderer failed:', err)
    return {
      success: false,
      finalPosterUrl: null,
      storageType: 'local',
      rendererUsed: 'sharp-composite',
      failureReason: err instanceof Error ? err.message : 'Unknown renderer error',
    }
  }
}
