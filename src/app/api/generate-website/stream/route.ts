// src/app/api/generate-website/stream/route.ts
// Streaming website generation with dual-mode support.
//
// WEBSITE_GENERATION_MODE=template_json (default)
//   → Cheap Claude Haiku selects template + personalises JSON → renders existing HTML
//   → ~₹0.20–₹1.00 per generation
//
// WEBSITE_GENERATION_MODE=full_code
//   → Claude Sonnet writes full HTML/CSS/JS (original behaviour)
//   → ~₹8–₹15 per generation
//
// SSE events: thought | token | done | error | question

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { getUsdToInr } from '@/lib/ai/generate'
import { checkGlobalLimit, incrementUsage } from '@/lib/rateLimit'
import { runBusinessQCPipeline } from '@/lib/qc/pipeline-business'
import { fetchWebsitePexelsImages, injectPexelsImages } from '@/lib/ai/pexels'
import { generateTemplatePlan } from '@/lib/website/generateTemplatePlan'
import { createFallbackTemplatePlan } from '@/lib/website/fallbackTemplatePlan'
import { renderTemplateHtml } from '@/lib/website/renderTemplateHtml'

// ── Mode switch ───────────────────────────────────────────────────────────────
const WEBSITE_GENERATION_MODE = process.env.WEBSITE_GENERATION_MODE ?? 'template_json'

// ── Full-code mode constants (original) ───────────────────────────────────────
let client: Anthropic | null = null
const MODEL = process.env.CLAUDE_WEBSITE_FULL_CODE_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-5'
const MAX_TOKENS = 16_000

function calcCost(input: number, output: number) {
  return input * 0.000003 + output * 0.000015
}

function sse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

// ── HTML completeness repair (full-code mode) ─────────────────────────────────
function ensureCompleteHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return trimmed
  let fixed = trimmed
    .replace(/^```html?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  if (!fixed.toLowerCase().startsWith('<!doctype')) {
    fixed = `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Website</title></head>\n<body>\n${fixed}\n</body>\n</html>`
  }
  let bodyOpenMatch  = fixed.match(/<body[^>]*>/i)
  let bodyCloseMatch = fixed.match(/<\/body>/i)
  if (!bodyOpenMatch) {
    fixed = fixed.replace(/<\/html>/i, '<body><p>Content loading…</p></body></html>')
    if (!fixed.match(/<body[^>]*>/i)) fixed += '\n<body><p>Content loading…</p></body>\n</html>'
    bodyOpenMatch = fixed.match(/<body[^>]*>/i)
    bodyCloseMatch = fixed.match(/<\/body>/i)
  }
  if (!bodyOpenMatch) return repairCommonGeneratedHtmlIssues(fixed)
  const bodyStart = fixed.indexOf(bodyOpenMatch[0]) + bodyOpenMatch[0].length
  const bodyEnd   = bodyCloseMatch ? fixed.indexOf('</body>') : fixed.length
  const bodyContent = fixed.slice(bodyStart, bodyEnd).trim()
  if (bodyContent.length < 50) {
    const tag  = bodyOpenMatch[0]
    const rest = fixed.slice(bodyStart + (bodyContent ? bodyContent.length : 0))
    fixed = fixed.slice(0, fixed.indexOf(tag) + tag.length) +
      '\n<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#09090a;color:rgba(255,255,255,0.4);font-size:14px;text-align:center;padding:40px;">' +
      '<div><p style="font-size:28px;margin-bottom:12px;">⟳</p><p>Website content was cut short.<br>Click <strong style="color:#C9A84C">Regenerate</strong> to try again.</p></div></div>' +
      rest
  }
  if (!fixed.toLowerCase().includes('</html>')) {
    if (!fixed.toLowerCase().includes('</body>')) {
      fixed += '\n</body>\n</html>'
    } else {
      fixed += '\n</html>'
    }
  }
  fixed = fixed.replace(
    /\/\/\s*[^\n]*(?:intersection|scroll.?reveal|reveal|in.?view)[^\n]*\n(?:[^\n]*\n)*?.*?IntersectionObserver[\s\S]*?(?=\/\/\s*(?!observe|unobserve)|<\/script>)/gi,
    '// [scroll-reveal removed — content visible by default]\n'
  )
  fixed = fixed.replace(/new\s+IntersectionObserver\s*\([\s\S]*?\)\s*;?\s*(?:observer\.observe[\s\S]*?;)*/gi, '')
  fixed = fixed.replace(/const\s+observer\s*=\s*new\s+IntersectionObserver[\s\S]*?observer\.observe[^;]+;/gi, '')
  fixed = fixed.replace(/\w+Observer\.observe\([^)]+\);?/g, '')
  fixed = fixed.replace(/document\.querySelectorAll\([^)]+\)\.forEach\([^)]*=>\s*\{[^}]*\.observe\([^)]+\)[^}]*\}\)/g, '')
  const visibilityOverride = `\n<style id="bs-safety-net">
/* BrandSyndicate Universal Safety Net */
body { overflow-x: hidden !important; }
* { box-sizing: border-box; }

/* Ensure all content is visible regardless of animation state */
[class*="reveal"]:not(.mob-drawer):not(.modal),
[class*="hidden"]:not(.mob-drawer):not(.modal):not([style*="display:none"]),
[data-reveal],[data-animate],[class*="fade-in"],[class*="slide-in"] {
  opacity: 1 !important;
  transform: none !important;
  visibility: visible !important;
}

/* Nav logo always visible, never black on dark nav */
.nav-logo,.nav-brand,.brand-name,.logo-text,
[class*="nav-logo"],[class*="logo-text"],[class*="nav-brand"] {
  opacity: 1 !important;
  visibility: visible !important;
}

/* Images: never overflow, always aspect-ratio safe */
img { max-width: 100%; display: block; }
img[src=""],img:not([src]) { display: none !important; }

/* Sections: no accidental clipping */
section,.section,[class*="section"] { overflow: visible !important; }
.hero,.hero-section { overflow: hidden; }

/* Mobile layout safety */
@media (max-width: 768px) {
  nav,header { max-width: 100vw; overflow: visible !important; position: relative; }
  .hero h1,.hero-h1,h1 { font-size: clamp(28px,8vw,52px) !important; }
  [style*="grid-template-columns"] { min-width: 0; }
  nav,header nav,[class*="navbar"],[class*="nav-inner"],[class*="navInner"]{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;padding-left:16px!important;padding-right:16px!important;}
  nav [class*="logo"],nav [class*="brand"],header [class*="logo"],header [class*="brand"],nav a:first-child,header a:first-child{white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important;max-width:calc(100vw - 96px)!important;overflow:hidden!important;text-overflow:ellipsis!important;letter-spacing:.04em!important;}
  .nav-links,[class*="nav-links"],[class*="navLinks"],[class*="menu"]:not(.mob-burger):not(.hamburger):not(.menu-toggle){max-width:100%!important;overflow:visible!important;}
  nav > a[class*="cta"],nav > a[class*="btn"],nav > button[class*="cta"],nav > button[class*="btn"],nav [class*="nav-cta"],header [class*="nav-cta"]{display:none!important;}
  .hero h1,.hero-h1,h1 { font-size: clamp(28px,8vw,52px) !important; line-height:1.08!important; word-break:normal!important; overflow-wrap:break-word!important; }
  h2{font-size:clamp(24px,7vw,42px)!important;line-height:1.15!important;}
  p,li,a,button,span{word-break:normal!important;overflow-wrap:break-word!important;}
  [style*="grid-template-columns"],.grid,[class*="grid"]{grid-template-columns:1fr!important;min-width:0!important;}
  [style*="display:flex"],[style*="display: flex"],.row,[class*="row"]{flex-wrap:wrap!important;}
  [class*="hero-content"],[class*="hero-left"],[class*="hero-inner"],[class*="hero-copy"],[class*="hero-text"],[class*="showcase"],[class*="card"],[class*="content"],[class*="copy"]{min-width:0!important;max-width:100%!important;}
  section,.section,[class*="section"]{padding-left:clamp(16px,5vw,28px)!important;padding-right:clamp(16px,5vw,28px)!important;}
  [style*="width: 100vw"],[style*="width:100vw"]{width:100%!important;}
  [style*="min-width"]{min-width:0!important;}
  table{display:block!important;width:100%!important;overflow-x:auto!important;}
  /* Hero background images must stay cover on mobile */
  .hero-bg,.hero-bg img,[class*="hero-bg"],[class*="hero-bg"] img,
  [class*="hero-image"],[class*="hero-image"] img,
  [class*="hero-visual"],[class*="hero-visual"] img,
  [class*="hero-media"],[class*="hero-media"] img {
    position:absolute!important;inset:0!important;
    width:100%!important;height:100%!important;
    max-width:none!important;max-height:none!important;
    object-fit:cover!important;object-position:center center!important;
  }
  :not(body)[class*="hero"],.hero { position:relative!important;overflow:hidden!important;min-height:clamp(400px,90vw,700px)!important; }
}
/* Final mobile correction: broad hero selectors used to catch body/header/hero-grid on phones. */
@media(max-width:980px){
  body[class*="bs-hero-v"]{display:block!important;position:static!important;padding:0!important;margin:0!important;min-height:100%!important;height:auto!important;overflow-x:hidden!important;}
  body[class*="bs-hero-v"]>nav,body[class*="bs-hero-v"]>.nav,body[class*="bs-hero-v"]>header{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:10000!important;transform:none!important;}
  body[class*="bs-hero-v"] .hero,body[class*="bs-layout-"] .hero,body[class*="bs-seed-"] .hero,main.hero,section.hero{position:relative!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;justify-content:center!important;min-height:0!important;height:auto!important;}
  body[class*="bs-hero-v"] .hero-grid,body[class*="bs-layout-"] .hero-grid,body[class*="bs-seed-"] .hero-grid,body[class*="bs-hero-v"] .wrap.hero-grid,body[class*="bs-layout-"] .wrap.hero-grid,body[class*="bs-seed-"] .wrap.hero-grid,[class*="hero-grid"]{min-height:0!important;height:auto!important;padding-top:0!important;padding-bottom:0!important;display:grid!important;grid-template-columns:1fr!important;gap:24px!important;align-items:start!important;justify-content:initial!important;overflow:visible!important;width:min(100% - 28px,1180px)!important;margin-inline:auto!important;}
  .hero-bg,[class*="hero-bg"],.bs-hero-image-bg,[class*="hero-image"],[class*="hero-visual"],[class*="hero-media"]{padding:0!important;margin:0!important;min-height:0!important;}
  body[class*="bs-hero-v"] .hero-bg,body[class*="bs-layout-"] .hero-bg,body[class*="bs-seed-"] .hero-bg,body[class*="bs-hero-v"] .bs-hero-image-bg,body[class*="bs-layout-"] .bs-hero-image-bg,body[class*="bs-seed-"] .bs-hero-image-bg,.hero>.hero-bg,.hero>.bs-hero-image-bg,main.hero>.bs-hero-image-bg{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:0!important;pointer-events:none!important;overflow:hidden!important;}
  body[class*="bs-hero-v"] .hero-bg img,body[class*="bs-layout-"] .hero-bg img,body[class*="bs-seed-"] .hero-bg img,body[class*="bs-hero-v"] .bs-hero-image-bg img,body[class*="bs-layout-"] .bs-hero-image-bg img,body[class*="bs-seed-"] .bs-hero-image-bg img,.hero>.hero-bg img,.hero>.bs-hero-image-bg img,main.hero>.bs-hero-image-bg img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;display:block!important;}
  body[class*="bs-hero-v"][class*="bs-layout-"][class*="bs-seed-"] .hero.hero .hero-bg.hero-bg,body[class*="bs-hero-v"][class*="bs-layout-"][class*="bs-seed-"] .hero.hero .bs-hero-image-bg.bs-hero-image-bg{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;padding:0!important;margin:0!important;z-index:0!important;overflow:hidden!important;}
  body[class*="bs-hero-v"][class*="bs-layout-"][class*="bs-seed-"] .hero.hero .hero-bg.hero-bg img,body[class*="bs-hero-v"][class*="bs-layout-"][class*="bs-seed-"] .hero.hero .bs-hero-image-bg.bs-hero-image-bg img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;display:block!important;}
  .hero>div:not(.hero-bg):not(.bs-hero-image-bg),main.hero>div:not(.hero-bg):not(.bs-hero-image-bg),section.hero>div:not(.hero-bg):not(.bs-hero-image-bg),.hero>.wrap,main.hero>.wrap,section.hero>.wrap{position:relative!important;z-index:2!important;}
  .hero-actions,[class*="hero-actions"],.actions{min-height:0!important;padding-top:0!important;padding-bottom:0!important;display:flex!important;flex-wrap:wrap!important;gap:12px!important;}
  body[class*="bs-hero-v"] .showcase,body[class*="bs-layout-"] .showcase,body[class*="bs-seed-"] .showcase,.hero-card,[class*="hero-card"]{width:100%!important;max-width:100%!important;padding:0!important;display:block!important;overflow:hidden!important;}
}
@media(max-width:560px){
  .hero,.hero-section,main.hero,section.hero{padding-top:clamp(86px,20vw,112px)!important;padding-bottom:clamp(38px,10vw,64px)!important;min-height:0!important;height:auto!important;}
  body[class*="bs-hero-v"] .showcase{min-height:260px!important;}
  .hero-card,[class*="hero-card"]{min-height:220px!important;max-height:320px!important;}
  .hero-card>img,[class*="hero-card"]>img{min-height:220px!important;max-height:320px!important;}
}
</style>`
  fixed = fixed.replace('</head>', visibilityOverride + '\n</head>')
  return repairCommonGeneratedHtmlIssues(fixed)
}


function repairCommonGeneratedHtmlIssues(html: string): string {
  return html
    .replace(/<img([^>]*?)\/\s+(loading|decoding|style|class|alt|src)=/gi, '<img$1 $2=')
    .replace(/<img([^>]*?)\/\s*>/gi, '<img$1>')
    .replace(/width:\s*100vw/gi, 'width:100%')
    .replace(/min-width:\s*100vw/gi, 'min-width:100%')
}

// ── Free brief validation ─────────────────────────────────────────────────────
function validateBreif(body: {
  companyName: string
  industry?: string
  description?: string
}): string | null {
  const hasIndustry    = (body.industry?.trim().length ?? 0) > 2
  const hasDescription = (body.description?.trim().length ?? 0) > 10
  if (!hasIndustry && !hasDescription) {
    return `What does ${body.companyName} do? A one-line description helps us build the right website.`
  }
  return null
}

// ── Full-code website prompt builder ─────────────────────────────────────────
function buildWebsitePrompt(params: {
  companyName: string; industry: string; tagline: string; description: string
  audience: string; sector: string; brandTone: string; businessStage: string
  primaryColor: string; secondaryColor: string
}): string {
  const { companyName, industry, tagline, description, audience, sector, brandTone, businessStage, primaryColor, secondaryColor } = params
  const FONT_GUIDE: Record<string, string> = {
    luxury:       'Cormorant Garamond or Playfair Display (display) + Jost or Lato (body) + DM Mono (labels)',
    bold:         'Bebas Neue or Anton (display) + Barlow or Inter (body) + DM Mono (labels)',
    friendly:     'Nunito or Poppins (display) + DM Sans or Outfit (body) + DM Mono (labels)',
    professional: 'Raleway or Space Grotesk (display) + DM Sans or Lato (body) + DM Mono (labels)',
  }
  const BG_GUIDE: Record<string, string> = {
    luxury:       'near-black warm (#09080A, #100D08) or deep navy (#060810)',
    bold:         'pure black (#080808) or near-black (#0A0A0A)',
    friendly:     'warm cream (#F9F6F0) or soft off-white (#F4F1EC) — light mode',
    professional: 'deep dark (#06060A, #0F0F16) or very dark slate',
  }
  const SECTION_GUIDE: Record<string, string[]> = {
    'Technology':            ['hero with product demo mockup or dashboard UI', 'feature grid (3–4 cards)', 'how-it-works (numbered steps)', 'social proof / logos', 'pricing tiers', 'CTA banner', 'footer'],
    'Food & Beverage':       ['full-bleed hero with atmospheric food photography', 'menu or product showcase', 'story / origin section', 'chef or founder spotlight', 'reservation or order CTA', 'Instagram-style photo grid', 'footer'],
    'Health & Wellness':     ['calming hero split layout', 'services or programs', 'transformation / results section', 'credentials and trust signals', 'testimonials', 'booking CTA', 'footer'],
    'Fashion & Lifestyle':   ['editorial full-screen hero', 'collection grid', 'brand story / ethos', 'lookbook strip', 'press mentions', 'newsletter signup', 'footer'],
    'Finance':               ['authoritative split hero (text left, visual right)', 'services overview', 'stats / AUM / track record', 'team credentials', 'client testimonials', 'contact / consultation CTA', 'footer'],
    'Real Estate':           ['split hero with property photography', 'featured listings grid', 'stats (properties sold, years, value)', 'our process (numbered)', 'agent team', 'contact CTA', 'footer'],
    'Legal & Professional':  ['formal split hero with seal or emblem', 'practice areas grid', 'firm credentials and bar associations', 'attorney profiles', 'case results or track record', 'consultation CTA', 'footer'],
    'Creative & Media':      ['experimental full-bleed hero with bold typography', 'portfolio / work grid', 'capabilities list', 'client logos', 'awards or press', 'contact CTA', 'footer'],
    'Education':             ['bright hero with students or campus', 'programs or courses', 'outcomes and statistics', 'faculty highlights', 'testimonials', 'enrollment CTA', 'footer'],
    'Travel & Hospitality':  ['immersive full-bleed hero with destination photography', 'featured experiences or rooms', 'amenities grid', 'location / map section', 'guest reviews', 'booking CTA', 'footer'],
    'Consulting & Services': ['clean hero with headline + supporting stats', 'service offerings', 'methodology / process', 'case studies or results', 'team', 'contact CTA', 'footer'],
    'Retail & E-commerce':   ['product-led hero', 'featured products grid', 'category highlights', 'brand story', 'social proof / reviews', 'email capture', 'footer'],
    'Industrial & Logistics':['hero with industrial imagery', 'capabilities overview', 'fleet or facility highlights', 'certifications and compliance', 'industries served', 'RFQ / contact CTA', 'footer'],
    'General Business':      ['split or full-bleed hero', 'services overview', 'differentiators', 'stats', 'testimonials', 'contact CTA', 'footer'],
  }
  const sections  = SECTION_GUIDE[sector] ?? SECTION_GUIDE['General Business']
  const fonts     = FONT_GUIDE[brandTone]  ?? FONT_GUIDE['professional']
  const bgGuide   = BG_GUIDE[brandTone]    ?? BG_GUIDE['professional']
  const stageContext =
    businessStage === 'startup' ? 'early-stage brand — lead with vision, differentiation, and bold positioning; avoid corporate language'
    : businessStage === 'growth' ? 'scaling company — lead with traction, market position, and momentum; show social proof prominently'
    : 'established enterprise — lead with authority, scale, and reliability; credentials and track record are key'
  const toneDesc =
    brandTone === 'luxury'       ? 'refined, timeless, premium. Long elegant lines, generous whitespace, understated opulence.' :
    brandTone === 'bold'         ? 'high-energy, commanding, disruptive. Heavy typography, strong contrast, kinetic feel.' :
    brandTone === 'friendly'     ? 'warm, approachable, human. Soft backgrounds, rounded forms, conversational copy.' :
    'credible, precise, authoritative. Clean structure, confident hierarchy, restrained palette.'
  const imageFallbackInstruction = `PHOTOGRAPHY SYSTEM — use placeholder tokens exactly as shown:
- Hero section: use src="PEXELS_HERO" or background-image: url('PEXELS_HERO') for the main hero image
- Section 1 (story/about/team): use src="PEXELS_SECTION_1" or url('PEXELS_SECTION_1')
- Section 2 (secondary feature): use src="PEXELS_SECTION_2" or url('PEXELS_SECTION_2')
- Gallery images (if your layout has a photo grid): use src="PEXELS_GALLERY_1", "PEXELS_GALLERY_2", "PEXELS_GALLERY_3"
- These tokens will be replaced with real high-res Pexels photography automatically — use them freely
- For sections WITHOUT a placeholder token, use rich CSS gradients, mesh gradients, or inline SVG instead
- <img> tags using placeholder tokens MUST have: style="object-fit:cover;width:100%;height:100%"
- You may use the same placeholder more than once if needed
- Never invent image URLs — only use the PEXELS_* tokens above or CSS/SVG`
  const FORBIDDEN = [
    '3-column icon+title+body card grid',
    'standard hero: centered headline + subtext + single CTA button on dark bg',
    'alternating image-text rows as the primary layout pattern',
    'generic testimonial card row with avatar + quote + name',
    'cookie-cutter pricing table with 3 tiers side by side',
    'IntersectionObserver or scroll-event-based reveal animations (elements hidden until scroll)',
    'opacity: 0 or visibility: hidden as a permanent base style on any content element',
    'data-reveal, data-animate, .reveal, .hidden, .in-view class patterns for showing content',
  ]
  return `You are a world-class creative director and senior frontend engineer with no design constraints. Build a production-ready single-page website for this business.

COMPANY BRIEF:
Company: ${companyName}
Industry: ${industry || sector}
Sector: ${sector}
Tagline: ${tagline || '(none — invent a compelling one)'}
Description: ${description || '(none — infer from name and industry)'}
Target Audience: ${audience || 'general market'}
Brand Tone: ${brandTone} — ${toneDesc}
Business Stage: ${stageContext}
Primary Color: ${primaryColor}
Secondary Color: ${secondaryColor}

VISUAL DESIGN MANDATE:
${imageFallbackInstruction}

SECTION ORDER (what to cover — how to build each is entirely your decision):
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

CREATIVE FREEDOM:
You decide every layout, composition, and visual treatment from scratch.
The section list above tells you what content to cover — not how to present it.
Each section must feel architecturally different from the one before it.
Think like a creative agency billing $50,000 for this site — not a template engine.

FORBIDDEN PATTERNS (never use these anywhere):
${FORBIDDEN.map(p => `- ${p}`).join('\n')}

INTERACTIVE FEATURES (pick 3–5 that suit ${sector} naturally, implement fully):
- Tab switcher for services or pricing (pure JS classList toggle — no scroll needed)
- Accordion FAQ with animated chevron (CSS max-height transition, no scroll)
- Auto-cycling testimonial carousel with dot navigation (setInterval, always visible)
- Mobile hamburger menu with smooth overlay animation (classList toggle)
- Horizontal scroll section for portfolio or product showcase (CSS overflow-x: auto)
- Animated stat counters that fire on page load (setTimeout stagger — NOT scroll-triggered)
- Sticky floating CTA that appears after 2s on page load (setTimeout — NOT scroll-triggered)
- Smooth-scroll anchor navigation between sections

TYPOGRAPHY: Import from Google Fonts: ${fonts}
- Display font: clamp(52px, 7vw, 96px) hero / clamp(32px, 4vw, 56px) sections
- Body: 14–16px, line-height 1.7+
- Mono: labels, eyebrows, nav, button text only
- Mix weights aggressively — ultra-light body next to heavy display is encouraged

COLOR SYSTEM:
--bg: ${bgGuide}
--surface: slightly lighter than bg
--accent: ${primaryColor}
--accent-dim: ${primaryColor} at 12% opacity
--accent2: ${secondaryColor}
--text: primary text
--muted: 55% opacity
--border: rgba at 8%

SEO META TAGS (required in <head>):
- <title>${companyName} — [punchy tagline, max 60 chars total]</title>
- <meta name="description" content="[2-sentence business description, 120–155 chars]">
- <meta property="og:title" content="${companyName} — [tagline]">
- <meta property="og:description" content="[same as meta description]">
- <meta property="og:type" content="website">
- <meta name="robots" content="index, follow">
- <meta charset="utf-8">
- <meta name="viewport" content="width=device-width, initial-scale=1">

TECHNICAL REQUIREMENTS:
- Fixed frosted-glass navbar, backdrop-filter: blur(20px), border appears on scroll
- Eyebrow labels above every section heading (mono, 0.2em letter-spacing, accent color) — use middle-dot (·) as separator, NEVER em-dash (—)
- NAV LOGO RULE: The nav logo text color MUST always be a light/cream color (e.g. rgba(255,255,255,0.92) or var(--cream)) on dark navbars, never hardcoded #000 or black. If the navbar background is transparent at the top over a hero image, the logo must still be legible — use a light text color with a subtle text-shadow if needed.
- IMAGE LOADING RULE: All <img> tags MUST have loading="lazy" decoding="async" and a background color matching the section while loading. Images must have object-fit:cover and explicit width/height so layout doesn't jump. Add onerror handlers: onerror="this.style.opacity='0'"
- OVERFLOW RULE: Set overflow-x:hidden on body. No section should clip content — use overflow:visible on content sections, only use overflow:hidden on image wrappers.
- VISIBILITY RULE: ALL elements MUST be fully visible by default (opacity: 1, no transform hiding). Do NOT use IntersectionObserver or scroll-triggered reveals — the site renders inside an iframe where scroll events are unreliable. Instead use CSS @keyframes with animation-delay for staggered entrance effects that fire immediately on load.
- MOBILE NAV RULE: nav must use overflow:visible so the mobile drawer is never clipped. Nav must have position:relative so the mobile drawer can position itself. The hamburger button must be flex-shrink:0. On mobile hide nav links and direct nav CTA buttons into the drawer so brand text never wraps or stacks vertically.
- HERO IMAGE RULE: Hero background images (.hero-bg img, or absolutely-positioned img inside .hero) MUST use position:absolute; inset:0; width:100%; height:100%; object-fit:cover. NEVER set max-height on these. On mobile the hero section must be position:relative; overflow:hidden so the background image fills it correctly.
- Mobile responsive: 768px and 480px breakpoints. At 400px width there must be no horizontal scroll, no text clipping, no vertical-stacked logo, no overlapping buttons, and no hero image covering readable copy.
- Hover states on every interactive element
- All copy is real and specific to ${companyName} — zero lorem ipsum

ANIMATION APPROACH — MANDATORY:
✓ Use @keyframes fadeInUp, @keyframes slideIn, @keyframes scaleIn — triggered on page load via animation-delay stagger
✓ Elements default to their FINAL visible state — CSS animations only ADD the entrance effect, they never hide content
✓ Pattern: .section { animation: fadeInUp 0.6s ease both; animation-delay: 0.1s; } — "both" fill-mode is fine but initial state must still be visible
✗ NEVER set opacity: 0 or visibility: hidden as a base style outside of a keyframe
✗ NEVER use IntersectionObserver, scroll event listeners, or data-reveal / data-animate attributes
✗ NEVER use classList.add('visible') / classList.add('in-view') patterns

CRITICAL OUTPUT RULE — READ CAREFULLY:
You MUST return a COMPLETE, self-contained HTML document.
✓ Start with <!DOCTYPE html>
✓ Include ALL CSS inside a <style> tag in <head>
✓ Include ALL content in the <body> — every section listed above must have real HTML markup and content
✓ Include ALL JavaScript in a <script> tag before </body>
✓ End with </body></html>
✗ Do NOT stop generating before the body content is complete
✗ Do NOT return only CSS without HTML body content
✗ Do NOT return markdown, code fences, or explanation

If the response would be very long, prioritise completing all body sections over adding extra JS polish.`
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        controller.enqueue(encoder.encode(sse(data)))
      }

      try {
        if (!process.env.ANTHROPIC_API_KEY) {
          send({ type: 'error', text: 'Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your environment variables.' })
          controller.close()
          return
        }

        const body = await req.json()
        const { companyName, industry, tagline, description, audience, tone, primaryColors } = body

        if (!companyName?.trim()) {
          send({ type: 'error', text: 'Company name is required' })
          controller.close()
          return
        }

        // ── Auth guard ─────────────────────────────────────────────────────────
        const session = await auth()
        const userId  = session?.user?.id ?? null
        if (!userId) {
          send({ type: 'error', text: 'You must be logged in to generate a website. Please sign in and try again.' })
          controller.close()
          return
        }

        // ── Global generation limit check ──────────────────────────────────────
        const limitResult = await checkGlobalLimit(userId)
        if (!limitResult.allowed) {
          send({ type: 'error', text: `⚡ ${limitResult.reason || 'Generation limit reached.'} Resets ${new Date(limitResult.resetAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`, limitReached: true, used: limitResult.used, limit: limitResult.limit, period: limitResult.period, resetAt: limitResult.resetAt })
          controller.close()
          return
        }

        // ── Brief validation ───────────────────────────────────────────────────
        const question = validateBreif({ companyName, industry, description })
        if (question) {
          send({ type: 'question', text: question })
          controller.close()
          return
        }

        const usdToInr = await getUsdToInr()
        const c1 = primaryColors?.[0] ?? '#C9A84C'
        const c2 = primaryColors?.[1] ?? '#1a1a2e'

        // ── QC pipeline ────────────────────────────────────────────────────────
        send({ type: 'thought', text: 'Validating and classifying your brief…' })
        const qc = await runBusinessQCPipeline({ companyName, industry, tagline, description, audience, tone })

        if (!qc.valid || qc.flagged) {
          send({ type: 'error', text: qc.flagReason ?? 'Validation failed' })
          controller.close()
          return
        }

        const { sanitized, sector, brandTone, businessStage } = qc

        // ════════════════════════════════════════════════════════════════════════
        // TEMPLATE JSON MODE (default, cheap)
        // ════════════════════════════════════════════════════════════════════════
        if (WEBSITE_GENERATION_MODE !== 'full_code') {

          // Dev-mode: warn about orphan/missing templates
          if (process.env.NODE_ENV !== 'production') {
            try {
              const { validateTemplateLibrary } = await import('@/lib/website/templateFiles')
              const validation = await validateTemplateLibrary()
              if (!validation.valid) {
                console.warn('[template_json] Missing HTML files for:', validation.missingHtmlFiles)
              }
              if (validation.orphanHtmlFiles.length > 0) {
                console.warn('[template_json] Orphan HTML files (not in library):', validation.orphanHtmlFiles)
              }
            } catch { /* ignore */ }
          }

          send({ type: 'thought', text: 'Selecting the best Brand Syndicate template…' })

          let plan: Awaited<ReturnType<typeof generateTemplatePlan>>['plan']
          let usage: Awaited<ReturnType<typeof generateTemplatePlan>>['usage']
          let usedFallback = false

          try {
            send({ type: 'thought', text: 'Personalising website copy…' })
            const result = await generateTemplatePlan({
              companyName:   sanitized.companyName,
              description:   sanitized.description || description,
              industry:      sanitized.industry    || industry,
              sector,
              brandTone,
              businessStage,
              primaryColor:  c1,
              backgroundColor: c2,
            })
            plan  = result.plan
            usage = result.usage
          } catch (planErr) {
            console.error('[generate-website/template_json] generateTemplatePlan failed, using local fallback:', planErr)
            const fallback = createFallbackTemplatePlan({
              companyName: sanitized.companyName,
              description: sanitized.description || description,
              industry:    sanitized.industry    || industry,
              sector,
            })
            plan      = fallback.plan
            usage     = fallback.usage
            usedFallback = true

            // Log failure
            db.apiCallLog.create({
              data: {
                service: 'claude', endpoint: 'generate-website-template-json',
                userId, model: process.env.CLAUDE_TEMPLATE_MODEL ?? 'claude-haiku-4-5-20251001',
                inputTokens: 0, outputTokens: 0, totalTokens: 0,
                costUsd: 0, costInr: 0, success: false,
              },
            }).catch(() => {})
          }

          send({ type: 'thought', text: 'Rendering your preview…' })

          let finalHtml: string
          try {
            finalHtml = await renderTemplateHtml(plan)
          } catch (renderErr) {
            console.error('[generate-website/template_json] renderTemplateHtml failed:', renderErr)
            // Last resort: send error to user
            send({ type: 'error', text: 'Website rendering failed. Please try again.' })
            controller.close()
            return
          }

          // Log to db (only if AI was actually called, i.e. not full fallback)
          if (!usedFallback) {
            db.apiCallLog.create({
              data: {
                service:      'claude',
                endpoint:     'generate-website-template-json',
                userId,
                model:        usage.model,
                inputTokens:  usage.inputTokens,
                outputTokens: usage.outputTokens,
                totalTokens:  usage.totalTokens,
                costUsd:      usage.costUsd,
                costInr:      usage.costInr,
                success:      true,
              },
            }).catch(() => {})
          }

          send({
            type: 'done',
            html: finalHtml,
            meta: {
              generationMode:         'template_json',
              selectedTemplateId:     plan.template_id,
              selectedTemplateLabel:  plan.template_label,
              industry:               plan.industry,
              industryConfidence:     plan.industry_confidence,
              sector,
              brandTone,
              businessStage,
              fallback:               usedFallback || undefined,
            },
            usage: {
              inputTokens:  usage.inputTokens,
              outputTokens: usage.outputTokens,
              totalTokens:  usage.totalTokens,
              model:        usage.model,
              costUsd:      usage.costUsd,
              costInr:      usage.costInr,
            },
          })

          await incrementUsage(userId)

          controller.close()
          return
        }

        // ════════════════════════════════════════════════════════════════════════
        // FULL CODE MODE (original Sonnet flow, preserved unchanged)
        // ════════════════════════════════════════════════════════════════════════

        client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        send({ type: 'thought', text: `Classified: ${sector} · ${brandTone} tone · ${businessStage} stage` })
        send({ type: 'thought', text: 'Building creative brief…' })

        const prompt = buildWebsitePrompt({
          companyName:    sanitized.companyName,
          industry:       sanitized.industry,
          tagline:        sanitized.tagline,
          description:    sanitized.description,
          audience:       sanitized.audience,
          sector, brandTone, businessStage,
          primaryColor:   c1,
          secondaryColor: c2,
        })

        send({ type: 'thought', text: 'Claude is writing your website…' })

        const claudeStream = client!.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: [{ role: 'user', content: prompt }],
        })

        let fullHtml = ''
        for await (const chunk of claudeStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const token = chunk.delta.text
            fullHtml += token
            send({ type: 'token', text: token })
          }
        }

        const final        = await claudeStream.finalMessage()
        const inputTokens  = final.usage.input_tokens
        const outputTokens = final.usage.output_tokens
        const costUsd      = calcCost(inputTokens, outputTokens)

        send({ type: 'thought', text: 'Validating HTML completeness…' })
        const repairedHtml = ensureCompleteHtml(fullHtml)

        if (final.stop_reason === 'max_tokens') {
          console.warn(`[generate-website/stream] Output hit max_tokens (${MAX_TOKENS}). HTML may have been truncated. output_tokens=${outputTokens}. Applied ensureCompleteHtml repair.`)
        }

        db.apiCallLog.create({
          data: {
            service: 'claude', endpoint: 'generate-website-stream', userId,
            model: MODEL, inputTokens, outputTokens,
            totalTokens: inputTokens + outputTokens,
            costUsd, costInr: costUsd * usdToInr, success: true,
          },
        }).catch(() => {})

        send({ type: 'thought', text: 'Fetching real photography from Pexels…' })
        let finalHtml = repairedHtml
        let pexelsCount = 0
        try {
          const pexelsImages = await fetchWebsitePexelsImages(sector)
          pexelsCount = pexelsImages.length
          if (pexelsCount > 0) {
            finalHtml = injectPexelsImages(repairedHtml, pexelsImages)
            db.apiCallLog.create({
              data: {
                service: 'pexels-website', endpoint: 'generate-website-stream', userId,
                model: null, inputTokens: 0, outputTokens: 0, totalTokens: 0,
                costUsd: 0, costInr: 0, success: true, cached: false,
                query: `sector:${sector} images:${pexelsCount}`,
              },
            }).catch(() => {})
          }
        } catch (pexelsErr) {
          console.warn('[generate-website/stream] Pexels fetch failed, serving without photos:', pexelsErr)
        }

        send({
          type: 'done',
          html: finalHtml,
          meta: { generationMode: 'full_code', sector, brandTone, businessStage, pexelsImages: pexelsCount },
          usage: { inputTokens, outputTokens, costUsd },
        })

        await incrementUsage(userId)

      } catch (error) {
        console.error('[generate-website/stream]', error)
        const isAuthError = error instanceof Error && (error.message.includes('401') || error.message.includes('authentication') || error.message.includes('API key'))
        const isRateLimit = error instanceof Error && error.message.includes('429')
        const msg = isAuthError
          ? 'Invalid or missing Anthropic API key. Check your ANTHROPIC_API_KEY environment variable.'
          : isRateLimit
          ? 'Anthropic rate limit reached. Please wait a moment and try again.'
          : error instanceof Error ? error.message : 'Website generation failed'
        try {
          const _session = await auth()
          const _uid = _session?.user?.id ?? null
          const ep = WEBSITE_GENERATION_MODE !== 'full_code' ? 'generate-website-template-json' : 'generate-website-stream'
          db.apiCallLog.create({ data: { service: 'claude', endpoint: ep, userId: _uid, success: false } }).catch(() => {})
        } catch {}
        send({ type: 'error', text: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
