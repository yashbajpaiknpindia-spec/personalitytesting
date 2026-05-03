// src/lib/qc/pipeline-business.ts
// Business-mode QC pipeline — mirrors pipeline.ts quality guarantees for business brand generation.
//
// Stages (matching personal pipeline structure):
//  1. Validate       — required fields
//  2. Sanitise       — strip HTML, truncate, reject PII / spam
//  3. Classify       — industry sector, brand tone, business stage
//  4. Output flags   — which verticals are requested (logo, banner, flyer, poster, copy, presentation)
//  5. Schema builder — compact JSON schema injected into prompt (low token cost)
//  6. Rules          — per-vertical guardrails
//  7. Profile block  — terse, noise-free company block
//  8. Prompt assembly — single enriched prompt
//  9. Token guard     — reject before hitting the API

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BusinessGenerateInput {
  companyName: string
  industry?: string
  tagline?: string
  description?: string
  audience?: string
  tone?: string
  outputTypes?: string[]           // 'logo' | 'banner' | 'flyer' | 'poster' | 'copy' | 'presentation'
  presentationSlideCount?: number  // 5 | 8 | 12 | 15 | custom
}

export interface BusinessQCResult {
  valid: boolean
  sanitized: Record<string, string>
  sector: string           // e.g. 'Technology', 'Retail', 'Healthcare' …
  brandTone: 'bold' | 'professional' | 'friendly' | 'luxury'
  businessStage: 'startup' | 'growth' | 'enterprise'
  enrichedPrompt: string
  estimatedTokens: number
  flagged: boolean
  flagReason?: string
}

// ── Sanitise ──────────────────────────────────────────────────────────────────

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim()
}

// ── Classifiers ───────────────────────────────────────────────────────────────

/**
 * Infer the broad industry sector from company description and stated industry.
 */
function classifySector(industry: string, description: string): string {
  const text = `${industry} ${description}`.toLowerCase()
  if (/tech|software|saas|app|ai|ml|cloud|cyber|dev/.test(text))          return 'Technology'
  if (/fashion|apparel|cloth|style|wear|luxury|jewel/.test(text))         return 'Fashion & Lifestyle'
  if (/food|restaurant|cafe|beverage|catering|bakery|cuisine/.test(text)) return 'Food & Beverage'
  if (/health|medical|wellness|pharma|biotech|clinic|fit/.test(text))     return 'Health & Wellness'
  if (/finance|bank|invest|fintech|capital|insurance|fund/.test(text))    return 'Finance'
  if (/retail|shop|ecommerce|store|product|consumer/.test(text))          return 'Retail & E-commerce'
  if (/consult|strategy|management|advisory|agency/.test(text))           return 'Consulting & Services'
  if (/real.?estate|property|construction|architect|interior/.test(text)) return 'Real Estate'
  if (/education|edtech|training|learn|school|tutoring/.test(text))       return 'Education'
  if (/media|creative|design|art|film|music|gaming|entertain/.test(text)) return 'Creative & Media'
  if (/legal|law|attorney|compliance|hr|recruit/.test(text))              return 'Legal & Professional'
  if (/travel|hospitality|hotel|tourism|event/.test(text))                return 'Travel & Hospitality'
  if (/logistics|supply|transport|manufactur|engineer/.test(text))        return 'Industrial & Logistics'
  return 'General Business'
}

/**
 * Derive a brand tone from user-stated tone + sector signals.
 */
function classifyBrandTone(
  tone: string,
  sector: string,
): 'bold' | 'professional' | 'friendly' | 'luxury' {
  const t = tone.toLowerCase()
  if (/bold|energetic|disruptive|edgy|rebellious/.test(t))          return 'bold'
  if (/luxury|premium|exclusive|elegant|sophisticated/.test(t))     return 'luxury'
  if (/friendly|warm|approachable|fun|casual|playful/.test(t))      return 'friendly'
  // Sector defaults
  if (['Fashion & Lifestyle', 'Real Estate'].includes(sector))       return 'luxury'
  if (['Technology', 'Finance', 'Legal & Professional'].includes(sector)) return 'professional'
  if (['Food & Beverage', 'Education', 'Health & Wellness'].includes(sector)) return 'friendly'
  if (['Creative & Media'].includes(sector))                         return 'bold'
  return 'professional'
}

/**
 * Guess business stage from description length, keywords, and audience signals.
 */
function classifyBusinessStage(description: string, audience: string): 'startup' | 'growth' | 'enterprise' {
  const text = `${description} ${audience}`.toLowerCase()
  if (/enterprise|fortune|global|multinational|corp|billion|series [c-z]/.test(text)) return 'enterprise'
  if (/scale|series [ab]|growth|expand|market leader|established/.test(text))          return 'growth'
  return 'startup'
}

// ── Guards ────────────────────────────────────────────────────────────────────

const SPAM_PATTERNS = [/\b(buy now|click here|free money|make money fast|guaranteed income)\b/i]
const PII_PATTERNS  = [/\b\d{9,}\b/, /\b\d{3}-\d{2}-\d{4}\b/]

// ── Theme / style helpers ─────────────────────────────────────────────────────

function pickColorPalette(sector: string, brandTone: string): string {
  if (brandTone === 'luxury')       return 'Deep navy, champagne gold, ivory — timeless prestige'
  if (brandTone === 'bold')         return 'High-contrast primary accent, near-black, pure white — commanding'
  if (brandTone === 'friendly')     return 'Warm terracotta or sage green with cream — inviting and human'
  // professional defaults per sector
  if (sector === 'Technology')      return 'Electric blue, slate grey, crisp white — precise and trustworthy'
  if (sector === 'Finance')         return 'Deep forest green, charcoal, gold accent — stability and growth'
  if (sector === 'Health & Wellness') return 'Soft teal, warm white, sage — calm and credible'
  if (sector === 'Food & Beverage') return 'Rich amber, cream, warm brown — appetite and warmth'
  if (sector === 'Real Estate')     return 'Charcoal, bronze, white — premium and grounded'
  if (sector === 'Creative & Media') return 'Bold violet, electric orange, black — creative and energetic'
  return 'Navy, silver, white — clean and professional'
}

function pickTypographyStyle(brandTone: string, sector: string): string {
  if (brandTone === 'luxury')   return 'High-contrast serif display + thin sans body (e.g. Didot / Neue Haas)'
  if (brandTone === 'bold')     return 'Condensed grotesque headline + geometric sans body (e.g. Bebas / Inter)'
  if (brandTone === 'friendly') return 'Rounded sans headline + humanist body (e.g. Nunito / Source Sans)'
  if (sector === 'Technology')  return 'Geometric sans headline + monospace accent (e.g. Raleway / JetBrains)'
  if (sector === 'Finance')     return 'Traditional serif headline + clean sans body (e.g. Playfair / Lato)'
  return 'Modern sans headline + neutral sans body (e.g. Montserrat / Open Sans)'
}

// ── Slide schema builder (matches personal pipeline) ──────────────────────────

function buildBusinessSlideSchema(count: number, sector: string, brandTone: string): string {
  return `"presentationTheme": "${brandTone === 'luxury' ? 'noir' : brandTone === 'bold' ? 'bold' : brandTone === 'friendly' ? 'warm' : 'minimal'}",
  "presentationSlides": [
    <EXACTLY ${count} slide objects using these layoutTypes:
      hero | split-left | split-right | stats | bullets | quote | grid | title-only
    First slide MUST be hero. Last slide MUST be title-only.
    Focus on ${sector} business narrative: problem → solution → differentiators → social proof → CTA.

    { "layoutType": "hero",       "heading": "...", "subheading": "...", "imageQuery": "<environment/product/scene, no people>" }
    { "layoutType": "stats",      "heading": "...", "stats": [{"value":"X+","label":"..."},{"value":"Y%","label":"..."},{"value":"Z","label":"..."}], "accentOverride": "#hex" }
    { "layoutType": "split-left", "heading": "...", "body": "2-3 sentences", "imageQuery": "..." }
    { "layoutType": "bullets",    "heading": "...", "bullets": ["...","...","...","..."] }
    { "layoutType": "quote",      "heading": "...", "quote": "...", "attribution": "...", "accentOverride": "#hex" }
    { "layoutType": "grid",       "heading": "...", "cards": [{"title":"...","body":"..."},{"title":"...","body":"..."},{"title":"...","body":"..."}], "accentOverride": "#hex" }
    { "layoutType": "title-only", "heading": "...", "subheading": "..." }
    >`
}

// ── Token estimator ───────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4) + 80  // +80 for system prompt overhead
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export async function runBusinessQCPipeline(
  input: BusinessGenerateInput,
): Promise<BusinessQCResult> {

  // ── 1. Validate ────────────────────────────────────────────────────────────
  if (!input.companyName?.trim()) {
    return {
      valid: false, sanitized: {}, sector: '', brandTone: 'professional',
      businessStage: 'startup', enrichedPrompt: '', estimatedTokens: 0,
      flagged: true, flagReason: 'Company name is required',
    }
  }

  // ── 2. Sanitise ────────────────────────────────────────────────────────────
  const sanitized: Record<string, string> = {
    companyName:  stripHtml(input.companyName).substring(0, 100),
    industry:     stripHtml(input.industry    || '').substring(0, 100),
    tagline:      stripHtml(input.tagline     || '').substring(0, 150),
    description:  stripHtml(input.description || '').substring(0, 500),
    audience:     stripHtml(input.audience    || '').substring(0, 200),
    tone:         stripHtml(input.tone        || 'professional').substring(0, 50),
  }

  const allText = Object.values(sanitized).join(' ')
  for (const p of SPAM_PATTERNS) {
    if (p.test(allText)) {
      return {
        valid: false, sanitized, sector: '', brandTone: 'professional',
        businessStage: 'startup', enrichedPrompt: '', estimatedTokens: 0,
        flagged: true, flagReason: 'Content policy violation',
      }
    }
  }
  for (const p of PII_PATTERNS) {
    if (p.test(allText)) {
      return {
        valid: false, sanitized, sector: '', brandTone: 'professional',
        businessStage: 'startup', enrichedPrompt: '', estimatedTokens: 0,
        flagged: true, flagReason: 'PII detected',
      }
    }
  }

  // ── 3. Classify ────────────────────────────────────────────────────────────
  const sector        = classifySector(sanitized.industry, sanitized.description)
  const brandTone     = classifyBrandTone(sanitized.tone, sector)
  const businessStage = classifyBusinessStage(sanitized.description, sanitized.audience)
  const colorPalette  = pickColorPalette(sector, brandTone)
  const typography    = pickTypographyStyle(brandTone, sector)

  // ── 4. Output type flags ───────────────────────────────────────────────────
  const selected         = new Set(input.outputTypes || ['logo', 'banner', 'flyer', 'poster', 'copy'])
  const wantLogo         = selected.has('logo')
  const wantBanner       = selected.has('banner')
  const wantFlyer        = selected.has('flyer')
  const wantPoster       = selected.has('poster')
  const wantCopy         = selected.has('copy')
  const wantPresentation = selected.has('presentation')

  // ── 5. Build schema (only selected verticals, terse to save tokens) ─────────

  // Base — always present
  const baseSchema = `
  "companyName": "${sanitized.companyName}",
  "industry": "<refined industry label>",
  "tagline": "<refined or new compelling tagline, max 120 chars>",
  "brandStory": "<2-3 sentence origin/mission narrative, ${brandTone} tone>",
  "brandVoice": "<brief brand voice and personality description>"`

  const logoSchema = wantLogo ? `,
  "logoConceptName": "<evocative name for the logo concept>",
  "logoConceptDescription": "<2-3 sentences: what it looks like, what it communicates>",
  "logoSymbolIdea": "<one abstract symbol or geometric concept>",
  "primaryColors": ["#hex1", "#hex2", "#hex3"],
  "logoKeywords": ["word1", "word2", "word3", "word4"]` : ''

  const bannerSchema = wantBanner ? `,
  "bannerHeadline": "<bold headline, max 8 words>",
  "bannerSubheadline": "<supporting subheadline, max 15 words>",
  "bannerCta": "<CTA button text, 2-4 words>",
  "bannerTheme": "<brief visual direction: colors, mood, layout>"` : ''

  const flyerSchema = wantFlyer ? `,
  "flyerTitle": "<main title, max 6 words>",
  "flyerSubtitle": "<subtitle, max 10 words>",
  "flyerBody": "<body copy, 2-3 compelling sentences>",
  "flyerCta": "<call to action, 3-5 words>",
  "flyerHighlights": ["highlight 1", "highlight 2", "highlight 3"]` : ''

  const posterSchema = wantPoster ? `,
  "posterHeadline": "<bold headline, max 5 words, high impact>",
  "posterTagline": "<supporting tagline, max 8 words>",
  "posterVisualDirection": "<art direction: style, mood, composition>",
  "posterCallout": "<callout box text, max 6 words>"` : ''

  const copySchema = wantCopy ? `,
  "copyHeadlines": ["ad headline 1", "ad headline 2", "ad headline 3"],
  "copySocialCaptions": ["instagram caption with emoji", "linkedin professional caption", "twitter/x punchy caption"],
  "copyEmailSubject": "<email subject, max 50 chars>",
  "copyEmailBody": "<3-paragraph email body, brief and compelling>",
  "copyCtas": ["cta 1", "cta 2", "cta 3"],
  "copyAdCopy": "<30-word Google/Meta ad copy>"` : ''

  const clampedCount = Math.min(Math.max(input.presentationSlideCount ?? 8, 5), 20)
  const presentationSchema = wantPresentation ? `,
  ${buildBusinessSlideSchema(clampedCount, sector, brandTone)}` : ''

  // ── 6. Build rules (per-vertical guardrails) ──────────────────────────────
  const brandToneDesc =
    brandTone === 'luxury'       ? 'premium, exclusive, understated confidence' :
    brandTone === 'bold'         ? 'energetic, commanding, disruptive' :
    brandTone === 'friendly'     ? 'warm, approachable, conversational' :
    'credible, precise, trustworthy'

  const stageDesc =
    businessStage === 'startup'    ? 'early-stage; emphasise vision, differentiation, and momentum' :
    businessStage === 'growth'     ? 'scaling; emphasise traction, market position, and expansion' :
    'established; emphasise authority, reliability, and scale'

  const rules: string[] = [
    `- Sector context: ${sector} | Tone: ${brandTone} (${brandToneDesc})`,
    `- Business stage: ${businessStage} — ${stageDesc}`,
    `- Color palette guidance: ${colorPalette}`,
    `- Typography guidance: ${typography}`,
    `- Target audience: ${sanitized.audience || 'general market'}`,
  ]

  if (wantLogo) rules.push(
    '- logoSymbolIdea: abstract or geometric — never literal clipart',
    '- primaryColors: ensure sufficient contrast; hex values must be valid',
    '- logoConceptDescription: describe visual form AND strategic meaning',
  )
  if (wantBanner) rules.push(
    '- bannerHeadline: action-oriented or curiosity-driving — not a tagline repeat',
    '- bannerTheme: specific palette/mood reference, not generic "modern" or "clean"',
  )
  if (wantFlyer) rules.push(
    '- flyerHighlights: concrete benefits or stats, not vague adjectives',
    '- flyerBody: focus on ONE clear value proposition',
  )
  if (wantPoster) rules.push(
    '- posterHeadline: maximum 5 words — typographic impact is key',
    '- posterVisualDirection: include composition (full-bleed, split, centered) and mood',
  )
  if (wantCopy) rules.push(
    '- copySocialCaptions: each must suit its platform voice and length norms',
    '- copyEmailBody: each paragraph has ONE job: hook → value → CTA',
    '- copyAdCopy: must be under 30 words, scannable, with implicit CTA',
  )
  if (wantPresentation) rules.push(
    `- Exactly ${clampedCount} slides`,
    '- First: hero. Last: title-only. Vary layouts — do NOT repeat the same layout back-to-back',
    '- Narrative arc: problem → solution → differentiators → social proof → CTA',
    '- imageQuery: photographic scene or product shot — no generic "business" or "office"',
    '- stats values must be plausible for the described business stage and sector',
    brandTone === 'luxury'   ? '- Prefer split and quote layouts; minimal stats clutter' :
    brandTone === 'bold'     ? '- Prefer hero and stats layouts; fewer text-heavy slides' :
    brandTone === 'friendly' ? '- Prefer grid and bullets layouts; conversational headings' :
    '- Prefer stats and grid for credibility; balanced layout variety',
  )

  // ── 7. Build profile block (skip empty fields to reduce noise) ────────────
  const profileLines = [
    `Company: ${sanitized.companyName}`,
    sanitized.industry    ? `Industry: ${sanitized.industry}`        : null,
    `Sector (inferred): ${sector}`,
    sanitized.tagline     ? `Tagline: ${sanitized.tagline}`          : null,
    sanitized.description ? `Description: ${sanitized.description}`  : null,
    sanitized.audience    ? `Target Audience: ${sanitized.audience}` : null,
    `Brand Tone: ${sanitized.tone} → classified as: ${brandTone} (${brandToneDesc})`,
    `Business Stage: ${businessStage}`,
    `Outputs requested: ${Array.from(selected).join(', ')}`,
  ].filter(Boolean).join('\n')

  // ── 8. Assemble final prompt ──────────────────────────────────────────────
  const enrichedPrompt = `You are a world-class brand strategist and creative director generating comprehensive business brand content.

COMPANY PROFILE:
${profileLines}

Return ONLY valid JSON — no markdown, no extra fields, no preamble:

{${baseSchema}${logoSchema}${bannerSchema}${flyerSchema}${posterSchema}${copySchema}${presentationSchema}
}

RULES:
${rules.filter(r => r.trim()).join('\n')}`.trim()

  // ── 9. Token guard ─────────────────────────────────────────────────────────
  const estimatedTokens = estimateTokens(enrichedPrompt)

  if (estimatedTokens > 2000) {
    return {
      valid: false, sanitized, sector, brandTone, businessStage,
      enrichedPrompt: '', estimatedTokens,
      flagged: true, flagReason: 'Input too long — reduce description or select fewer output types',
    }
  }

  return {
    valid: true,
    sanitized,
    sector,
    brandTone,
    businessStage,
    enrichedPrompt,
    estimatedTokens,
    flagged: false,
  }
}
