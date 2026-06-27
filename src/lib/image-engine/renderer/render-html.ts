// src/lib/image-engine/renderer/render-html.ts
// Generates the HTML string that will be screenshotted or composited into a PNG.
// All text is rendered here in code — never inside the image source.

import type { RenderContract } from '../types'
import { EFFECTS } from '../effects'

function escapeHtml(str: string): string {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildEffectStyles(effectIds: string[]): string {
  const parts: string[] = []
  for (const id of effectIds) {
    const e = EFFECTS[id]
    if (!e) continue
    if (e.cssGradient) parts.push(`background-image: ${e.cssGradient};`)
    if (e.overlayColor && e.overlayOpacity) {
      parts.push(`background-color: ${e.overlayColor}${Math.round((e.overlayOpacity ?? 0) * 255).toString(16).padStart(2, '0')};`)
    }
  }
  return parts.join(' ')
}

function buildFilterStyle(effectIds: string[]): string {
  const filters: string[] = []
  for (const id of effectIds) {
    const e = EFFECTS[id]
    if (!e) continue
    if (e.saturationFilter !== undefined) filters.push(`saturate(${e.saturationFilter})`)
    if (e.contrastFilter !== undefined) filters.push(`contrast(${e.contrastFilter})`)
    if (e.brightnessFilter !== undefined) filters.push(`brightness(${e.brightnessFilter})`)
    if (e.sepia !== undefined) filters.push(`sepia(${e.sepia})`)
  }
  return filters.length ? filters.join(' ') : ''
}

function getGrainOpacity(effectIds: string[]): number {
  let max = 0
  for (const id of effectIds) {
    const e = EFFECTS[id]
    if (e && e.grainOpacity > max) max = e.grainOpacity
  }
  return max
}

function getVignetteStrength(effectIds: string[]): number {
  let max = 0
  for (const id of effectIds) {
    const e = EFFECTS[id]
    if (e && e.vignetteStrength > max) max = e.vignetteStrength
  }
  return max
}

function hasBorder(effectIds: string[]): { has: boolean; style: string } {
  for (const id of effectIds) {
    const e = EFFECTS[id]
    if (e?.borderStyle) return { has: true, style: e.borderStyle }
  }
  return { has: false, style: '' }
}

function buildFontStack(templateId: string): string {
  const serifTemplates = ['luxury_editorial', 'legacy_story_poster', 'heritage_city_campaign', 'care_wellness', 'testimonial_proof', 'minimal_proof_card', 'craftsmanship_detail', 'clean_typography_offer', 'product_hero']
  const boldTemplates = ['dark_power_campaign', 'dark_agency_noir', 'bold_offer_card', 'transformation_offer', 'service_grid_premium', 'local_market_story']
  if (serifTemplates.includes(templateId)) return "'Georgia', 'Times New Roman', serif"
  if (boldTemplates.includes(templateId)) return "'Impact', 'Arial Black', 'Haettenschweiler', sans-serif"
  return "'Arial', 'Helvetica Neue', sans-serif"
}

function scaledFontSize(base: number, scale: number): number {
  return Math.round(base * scale)
}

/**
 * EMERGENCY SANITIZER: A final, aggressive safeguard inside the HTML renderer.
 * If any text field contains prompt instructions, it is stripped here
 * before being rendered to the HTML preview.
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

export function renderPosterHtml(contract: RenderContract): string {
  const { size, templateId, variation, backgroundImage, effects, colors, brandName, logoUrl, headline, subheadline, bodyCopy, cta, serviceTags, watermark, attribution } = contract

  const W = size.width
  const H = size.height
  const M = size.safeMargin
  const fontStack = buildFontStack(templateId)

  // EMERGENCY SANITIZATION
  const cleanBrandName = emergencySanitize(brandName, 'Brand', 'Brand')
  const cleanHeadline = emergencySanitize(headline, cleanBrandName, `${cleanBrandName} — Premium`)
  const cleanSubheadline = emergencySanitize(subheadline, cleanBrandName, `Experience the excellence of ${cleanBrandName}.`)
  const cleanCta = emergencySanitize(cta, cleanBrandName, 'Explore Now')

  // Effect styles
  const filterStyle = buildFilterStyle(effects)
  const grainOpacity = getGrainOpacity(effects)
  const vignetteStrength = getVignetteStrength(effects)
  const border = hasBorder(effects)

  // Font sizes — scale with canvas width
  const headlineFontSize = scaledFontSize(W * 0.055, 1)
  const subheadlineFontSize = scaledFontSize(W * 0.022, 1)
  const bodyFontSize = scaledFontSize(W * 0.018, 1)
  const brandFontSize = scaledFontSize(W * 0.025, 1)
  const ctaFontSize = scaledFontSize(W * 0.020, 1)
  const tagFontSize = scaledFontSize(W * 0.016, 1)
  const watermarkFontSize = scaledFontSize(W * 0.014, 1)
  const attributionFontSize = scaledFontSize(W * 0.012, 1)

  // Determine layout from variation
  const isFullBleed = variation === 'B'
  const isSplit = variation === 'C'
  const isImageRight = variation === 'A'

  // Dark templates
  const isDarkTemplate = ['dark_power_campaign', 'dark_agency_noir', 'service_grid_premium', 'bold_offer_card', 'founder_ambition', 'transformation_offer', 'local_market_story'].includes(templateId)

  // Service grid template
  const isServiceGrid = templateId === 'service_grid_premium'

  // Text-only (no image)
  const isTextOnly = !backgroundImage || templateId === 'clean_typography_offer'

  // Build gradient overlay for text legibility
  const overlayGradient = isFullBleed
    ? `linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.08) 100%)`
    : isImageRight
      ? `linear-gradient(to right, ${isDarkTemplate ? 'rgba(0,0,0,0.80)' : 'rgba(245,240,228,0.90)'} 0%, ${isDarkTemplate ? 'rgba(0,0,0,0.55)' : 'rgba(245,240,228,0.55)'} 50%, transparent 100%)`
      : `linear-gradient(135deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.25) 100%)`

  // Text color based on context
  const textColor = colors.text ?? (isDarkTemplate ? '#ffffff' : '#111111')
  const accentColor = colors.accent ?? '#C9A84C'
  const bgColor = colors.background ?? (isDarkTemplate ? '#0a0a0e' : '#FAFAF7')

  // Text panel position
  const textLeft = isSplit ? M : M
  const textMaxWidth = isFullBleed ? (W * 0.72) : (W * 0.55)
  const textBottom = isFullBleed ? M * 2.5 : undefined
  const textTop = isFullBleed ? undefined : (H * 0.25)

  const serviceGridHTML = isServiceGrid && serviceTags.length > 0 ? `
    <div style="
      position: absolute;
      left: ${M}px;
      right: ${M}px;
      bottom: ${M * 3.5}px;
      display: grid;
      grid-template-columns: repeat(${Math.min(serviceTags.length, 3)}, 1fr);
      gap: ${M * 0.4}px;
    ">
      ${serviceTags.slice(0, 6).map(tag => `
        <div style="
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          padding: ${M * 0.4}px ${M * 0.5}px;
          text-align: center;
          font-family: ${fontStack};
          font-size: ${tagFontSize}px;
          font-weight: 700;
          color: ${textColor};
          letter-spacing: 0.04em;
          text-transform: uppercase;
        ">${escapeHtml(emergencySanitize(tag, cleanBrandName, 'Service'))}</div>
      `).join('')}
    </div>
  ` : ''

  const serviceTagsInlineHTML = !isServiceGrid && serviceTags.length > 0 ? `
    <div style="
      display: flex;
      flex-wrap: wrap;
      gap: ${M * 0.25}px;
      margin-top: ${M * 0.6}px;
    ">
      ${serviceTags.slice(0, 5).map(tag => `
        <span style="
          font-family: ${fontStack};
          font-size: ${tagFontSize}px;
          font-weight: 700;
          color: ${accentColor};
          border: 1px solid ${accentColor};
          padding: ${M * 0.2}px ${M * 0.35}px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        ">${escapeHtml(emergencySanitize(tag, cleanBrandName, 'Service'))}</span>
      `).join('')}
    </div>
  ` : ''

  const ctaButtonHTML = cleanCta ? `
    <div style="
      display: inline-block;
      margin-top: ${M * 0.8}px;
      padding: ${M * 0.35}px ${M * 0.7}px;
      background: ${templateId === 'dark_power_campaign' || templateId === 'dark_agency_noir' ? accentColor : 'transparent'};
      border: 2px solid ${accentColor};
      color: ${templateId === 'dark_power_campaign' || templateId === 'dark_agency_noir' ? '#ffffff' : accentColor};
      font-family: ${fontStack};
      font-size: ${ctaFontSize}px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    ">${escapeHtml(cleanCta)}</div>
  ` : ''

  const watermarkHTML = watermark.show ? `
    <div style="
      position: absolute;
      bottom: ${Math.round(M * 0.35)}px;
      left: 0;
      right: 0;
      text-align: center;
      font-family: ${fontStack};
      font-size: ${watermarkFontSize}px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.9;
    ">
      <span style="color: ${watermark.color1};">MADE BY BRAND </span><span style="color: ${watermark.color2};">SYNDICATE</span>
    </div>
  ` : ''

  const attributionHTML = attribution.show && attribution.text ? `
    <div style="
      position: absolute;
      bottom: ${Math.round(M * 0.35)}px;
      right: ${M}px;
      font-family: ${fontStack};
      font-size: ${attributionFontSize}px;
      color: rgba(255,255,255,0.45);
      letter-spacing: 0.02em;
    ">${escapeHtml(attribution.text)}</div>
  ` : ''

  const borderHTML = border.has ? `
    <div style="
      position: absolute;
      inset: ${Math.round(M * 0.5)}px;
      border: ${border.style};
      pointer-events: none;
    "></div>
  ` : ''

  // Grain overlay (SVG noise pattern)
  const grainHTML = grainOpacity > 0 ? `
    <div style="
      position: absolute;
      inset: 0;
      opacity: ${grainOpacity};
      background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/><feColorMatrix type=%22saturate%22 values=%220%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%221%22/></svg>');
      background-size: 200px 200px;
      pointer-events: none;
      mix-blend-mode: overlay;
    "></div>
  ` : ''

  // Vignette overlay
  const vignetteHTML = vignetteStrength > 0 ? `
    <div style="
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,${vignetteStrength}) 100%);
      pointer-events: none;
    "></div>
  ` : ''

  // Background image element
  const bgImageHTML = backgroundImage?.url ? `
    <img
      src="${backgroundImage.url}"
      alt=""
      crossorigin="anonymous"
      style="
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        ${filterStyle ? `filter: ${filterStyle};` : ''}
      "
    />
  ` : ''

  // Gradient overlay on image
  const gradientOverlayHTML = backgroundImage?.url ? `
    <div style="
      position: absolute;
      inset: 0;
      background: ${overlayGradient};
      pointer-events: none;
    "></div>
  ` : ''

  // Brand name / logo
  const brandHTML = `
    <div style="
      position: absolute;
      top: ${M}px;
      left: ${M}px;
      font-family: ${fontStack};
      font-size: ${brandFontSize}px;
      font-weight: 800;
      color: ${textColor};
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.95;
      max-width: ${W * 0.4}px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    ">${escapeHtml(cleanBrandName)}</div>
  `

  // Main text block
  const textBlockHTML = `
    <div style="
      position: absolute;
      left: ${textLeft}px;
      ${textBottom !== undefined ? `bottom: ${textBottom}px;` : `top: ${textTop}px;`}
      max-width: ${textMaxWidth}px;
    ">
      ${cleanHeadline ? `
        <div style="
          font-family: ${fontStack};
          font-size: ${headlineFontSize}px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: ${templateId === 'dark_power_campaign' || templateId === 'dark_agency_noir' ? '-0.03em' : '-0.02em'};
          color: ${textColor};
          margin-bottom: ${M * 0.4}px;
          text-transform: ${isDarkTemplate ? 'uppercase' : 'none'};
        ">${escapeHtml(cleanHeadline)}</div>
      ` : ''}
      ${cleanSubheadline ? `
        <div style="
          font-family: ${fontStack};
          font-size: ${subheadlineFontSize}px;
          line-height: 1.4;
          font-weight: 400;
          color: ${textColor};
          opacity: 0.88;
          margin-bottom: ${M * 0.3}px;
          max-width: ${textMaxWidth * 0.9}px;
        ">${escapeHtml(cleanSubheadline)}</div>
      ` : ''}
      ${bodyCopy ? `
        <div style="
          font-family: ${fontStack};
          font-size: ${bodyFontSize}px;
          line-height: 1.5;
          color: ${textColor};
          opacity: 0.75;
          margin-bottom: ${M * 0.3}px;
          max-width: ${textMaxWidth * 0.85}px;
        ">${escapeHtml(emergencySanitize(bodyCopy, cleanBrandName, ''))}</div>
      ` : ''}
      ${serviceTagsInlineHTML}
      ${ctaButtonHTML}
    </div>
  `

  // Assemble full HTML
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px;
    height: ${H}px;
    overflow: hidden;
    background: ${bgColor};
    font-family: ${fontStack};
    position: relative;
  }
</style>
</head>
<body>
  <!-- Background -->
  ${isTextOnly ? '' : bgImageHTML}
  <!-- Gradient overlay -->
  ${isTextOnly ? '' : gradientOverlayHTML}
  <!-- Grain -->
  ${grainHTML}
  <!-- Vignette -->
  ${vignetteHTML}
  <!-- Border -->
  ${borderHTML}
  <!-- Brand name -->
  ${brandHTML}
  <!-- Text block -->
  ${textBlockHTML}
  <!-- Service grid -->
  ${serviceGridHTML}
  <!-- Watermark -->
  ${watermarkHTML}
  <!-- Attribution -->
  ${!watermark.show ? attributionHTML : ''}
</body>
</html>`
}
