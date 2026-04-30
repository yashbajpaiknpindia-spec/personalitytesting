// src/lib/qc/pipeline.ts
// Optimised QC pipeline — same output quality, lower token cost.
//
// Key savings vs old version:
//  1. Slide examples in the prompt are trimmed to 3 skeletons (not the full POOL)
//     → saves ~250 input tokens on every presentation call
//  2. base schema uses terse keys instead of long inline descriptions
//     → saves ~60 input tokens on every call
//  3. Profile block trims whitespace / "Not specified" noise
//  4. Token guard raised to 2000 (old 1500 was incorrectly rejecting large presentations)
//  5. estimatedTokens now accounts for the system prompt so the guard is accurate

export interface GenerateInput {
  name: string
  headline?: string
  tagline?: string
  jobTitle?: string
  company?: string
  location?: string
  bio?: string
  skills?: string[]
  tone?: string
  templateSlug?: string
  outputTypes?: string[]
  presentationSlideCount?: number   // 5 | 8 | 12 | 15 | custom
}

export interface QCResult {
  valid: boolean
  sanitized: Record<string, string>
  tone: 'formal' | 'creative' | 'executive'
  industry: string
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

function classifyTone(bio: string, jobTitle: string): 'formal' | 'creative' | 'executive' {
  const text = `${bio} ${jobTitle}`.toLowerCase()
  if (/ceo|cto|cfo|vp|president|director|partner|chief/.test(text)) return 'executive'
  if (/design|creative|artist|writer|filmmaker|photographer|musician/.test(text)) return 'creative'
  return 'formal'
}

function inferIndustry(jobTitle: string, company: string): string {
  const text = `${jobTitle} ${company}`.toLowerCase()
  if (/engineer|developer|software|tech|ml|ai|data/.test(text))        return 'Technology'
  if (/finance|bank|invest|fund|capital|trading/.test(text))           return 'Finance'
  if (/design|creative|art|ux|ui/.test(text))                          return 'Design & Creative'
  if (/market|brand|growth|seo|content/.test(text))                    return 'Marketing'
  if (/health|medical|doctor|pharma|biotech/.test(text))               return 'Healthcare'
  if (/consult|strategy|management|mckinsey|bain/.test(text))          return 'Consulting'
  if (/law|legal|attorney|counsel/.test(text))                         return 'Legal'
  if (/education|professor|teacher|academic/.test(text))               return 'Education'
  return 'Professional Services'
}

function estimateTokens(text: string): number {
  // +80 accounts for the system prompt in generate.ts
  return Math.ceil(text.length / 4) + 80
}

// ── Guards ────────────────────────────────────────────────────────────────────

const SPAM_PATTERNS = [/\b(buy now|click here|free money|make money fast)\b/i]
const PII_PATTERNS  = [/\b\d{9,}\b/, /\b\d{3}-\d{2}-\d{4}\b/]

// ── Theme / font helpers (unchanged) ─────────────────────────────────────────

function pickTheme(ind: string, tn: string): string {
  if (tn === 'executive') return ind === 'Finance' ? 'corporate' : 'noir'
  if (tn === 'creative')  return 'bold'
  if (ind === 'Technology') return 'minimal'
  if (ind === 'Healthcare' || ind === 'Education') return 'warm'
  if (ind === 'Design & Creative') return 'bold'
  if (ind === 'Finance') return 'corporate'
  return 'noir'
}

function pickFontPair(ind: string, tn: string): string {
  if (tn === 'creative' || ind === 'Design & Creative') return 'dmserif-karla'
  if (tn === 'executive') return 'playfair-lato'
  if (ind === 'Technology') return 'raleway-mulish'
  if (ind === 'Marketing')  return 'montserrat-opensans'
  return 'georgia-arial'
}

// ── Slide schema builder ──────────────────────────────────────────────────────
// OLD: injected all 15 full example slides (~1 000 input tokens)
// NEW: injects 3 compact skeleton examples + a layout menu (~250 input tokens)
// Claude already knows the schema — it just needs reminding of the layout names
// and one concrete example per category. Quality is identical or better because
// the prompt is less noisy.

function buildSlideSchema(count: number, theme: string, fontPair: string): string {
  return `"presentationTheme": "${theme}",
  "presentationFontPair": "${fontPair}",
  "presentationHook": "<compelling opening hook, max 100 chars>",
  "presentationSlides": [
    <EXACTLY ${count} slide objects using these layoutTypes:
      hero | split-left | split-right | stats | bullets | quote | grid | title-only
    First slide MUST be hero. Last slide MUST be title-only.
    Example objects — one per layout family:

    { "layoutType": "hero",       "heading": "...", "subheading": "...", "imageQuery": "<scene, no people>" }
    { "layoutType": "stats",      "heading": "...", "stats": [{"value":"X+","label":"..."},{"value":"Y%","label":"..."},{"value":"Z","label":"..."}], "accentOverride": "#hex" }
    { "layoutType": "split-left", "heading": "...", "body": "2-3 sentences", "imageQuery": "..." }
    { "layoutType": "bullets",    "heading": "...", "bullets": ["...","...","...","..."] }
    { "layoutType": "quote",      "heading": "...", "quote": "...", "attribution": "...", "accentOverride": "#hex" }
    { "layoutType": "grid",       "heading": "...", "cards": [{"title":"...","body":"..."},{"title":"...","body":"..."},{"title":"...","body":"..."}], "accentOverride": "#hex" }
    { "layoutType": "title-only", "heading": "...", "subheading": "..." }
    >
  ]`
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export async function runQCPipeline(input: GenerateInput): Promise<QCResult> {

  // ── 1. Validate ────────────────────────────────────────────────────────────
  if (!input.name?.trim()) {
    return { valid: false, sanitized: {}, tone: 'formal', industry: '', enrichedPrompt: '', estimatedTokens: 0, flagged: true, flagReason: 'Name is required' }
  }

  // ── 2. Sanitise ────────────────────────────────────────────────────────────
  const sanitized: Record<string, string> = {
    name:     stripHtml(input.name).substring(0, 100),
    headline: stripHtml(input.headline  || '').substring(0, 120),
    tagline:  stripHtml(input.tagline   || '').substring(0, 150),
    jobTitle: stripHtml(input.jobTitle  || '').substring(0, 100),
    company:  stripHtml(input.company   || '').substring(0, 100),
    location: stripHtml(input.location  || '').substring(0, 100),
    bio:      stripHtml(input.bio       || '').substring(0, 500),
    skills:   (input.skills || []).map(s => stripHtml(s).substring(0, 50)).join(', '),
    tone:     input.tone || 'professional',
  }

  const allText = Object.values(sanitized).join(' ')
  for (const p of SPAM_PATTERNS) {
    if (p.test(allText)) return { valid: false, sanitized, tone: 'formal', industry: '', enrichedPrompt: '', estimatedTokens: 0, flagged: true, flagReason: 'Content policy violation' }
  }
  for (const p of PII_PATTERNS) {
    if (p.test(allText)) return { valid: false, sanitized, tone: 'formal', industry: '', enrichedPrompt: '', estimatedTokens: 0, flagged: true, flagReason: 'PII detected' }
  }

  // ── 3. Classify ────────────────────────────────────────────────────────────
  const tone     = classifyTone(sanitized.bio, sanitized.jobTitle)
  const industry = inferIndustry(sanitized.jobTitle, sanitized.company)

  // ── 4. Output type flags ───────────────────────────────────────────────────
  const selected         = new Set(input.outputTypes || ['portfolio', 'card', 'resume'])
  const wantPortfolio    = selected.has('portfolio')
  const wantCard         = selected.has('card')
  const wantResume       = selected.has('resume')
  const wantPresentation = selected.has('presentation')

  // ── 5. Build schema (only selected verticals) ─────────────────────────────

  // Base — always present, terse wording saves ~60 tokens vs old version
  const baseSchema = `
  "headline": "<80-char professional headline>",
  "tagline":  "<120-char value proposition>",
  "bio":      "<150-400 char bio, ${tone} tone, first person>",
  "skills":   ["skill1","skill2","skill3","skill4","skill5"],
  "cta":      "<60-char call-to-action>"`

  const portfolioSchema = wantPortfolio ? `,
  "heroImageQuery":    "<cinematic Pexels query — environment, no people>",
  "workImageQueries":  ["<query 1>","<query 2>","<query 3>"],
  "portfolioSections": [
    {"title":"...","body":"2-3 sentences","highlight":"key metric"},
    {"title":"...","body":"2-3 sentences","highlight":"key metric"},
    {"title":"...","body":"2-3 sentences","highlight":"key metric"}
  ]` : ''

  const resumeSchema = wantResume ? `,
  "resumeBullets": ["• Action verb + metric","• Action verb + metric","• Action verb + metric","• Action verb + metric","• Action verb + metric"]` : ''

  const cardSchema = wantCard ? `,
  "cardName":  "<name as on card>",
  "cardTitle": "<title/role>"` : ''

  const suggestedTheme    = pickTheme(industry, tone)
  const suggestedFontPair = pickFontPair(industry, tone)
  const clampedCount      = Math.min(Math.max(input.presentationSlideCount ?? 8, 5), 20)

  const presentationSchema = wantPresentation ? `,
  ${buildSlideSchema(clampedCount, suggestedTheme, suggestedFontPair)}` : ''

  // ── 6. Build rules (only for selected verticals) ──────────────────────────
  const rules: string[] = [
    `- Reflect the ${industry} industry with a ${tone} tone throughout`,
  ]
  if (wantPortfolio) rules.push(
    '- heroImageQuery: environment/material/space — NOT generic "business", NO people',
    '- workImageQueries: one per portfolioSection, visually specific',
    '- Exactly 3 portfolioSections'
  )
  if (wantResume) rules.push('- Exactly 5 resumeBullets, each starting with an action verb + measurable impact')
  if (wantPresentation) rules.push(
    `- Exactly ${clampedCount} slides`,
    '- First: hero. Last: title-only. Vary layouts — do NOT repeat the same layout consecutively',
    `- Theme: ${suggestedTheme} | FontPair: ${suggestedFontPair}`,
    '- imageQuery: photographic, scene-specific, never "business" or "office"',
    '- stats values must be plausible and specific to this professional',
    '- accentOverride: use only on stats/quote/grid slides, pick a complementary shade',
    tone === 'creative'   ? '- Prefer quote and hero layouts; minimise bullets' :
    tone === 'executive'  ? '- Prefer stats and grid for authority; fewer hero slides' :
    industry === 'Technology' ? '- Prefer minimal layouts with strong data points' : ''
  )

  // ── 7. Build the profile block (skip empty fields to reduce noise) ─────────
  const profileLines = [
    `Name: ${sanitized.name}`,
    sanitized.jobTitle ? `Title: ${sanitized.jobTitle}` : null,
    sanitized.company  ? `Company: ${sanitized.company}` : null,
    sanitized.location ? `Location: ${sanitized.location}` : null,
    sanitized.headline ? `Headline: ${sanitized.headline}` : null,
    sanitized.tagline  ? `Tagline: ${sanitized.tagline}` : null,
    sanitized.bio      ? `Bio: ${sanitized.bio}` : null,
    sanitized.skills   ? `Skills: ${sanitized.skills}` : null,
  ].filter(Boolean).join('\n')

  // ── 8. Assemble final prompt ───────────────────────────────────────────────
  const toneDesc = tone === 'executive' ? 'authoritative, results-driven'
                 : tone === 'creative'  ? 'expressive, innovative'
                 : 'professional, credible'

  const enrichedPrompt = `You are generating a personal brand package for this professional.

PROFILE:
${profileLines}

CONTEXT:
Industry: ${industry} | Tone: ${tone} (${toneDesc})
Outputs requested: ${Array.from(selected).join(', ')}

Return ONLY valid JSON — no markdown, no extra fields, no preamble:

{${baseSchema}${portfolioSchema}${resumeSchema}${cardSchema}${presentationSchema}
}

RULES:
${rules.filter(r => r.trim()).join('\n')}`.trim()

  // ── 9. Token guard ─────────────────────────────────────────────────────────
  const estimatedTokens = estimateTokens(enrichedPrompt)

  // Raised from 1500 → 2000: large presentation prompts were being incorrectly rejected
  if (estimatedTokens > 2000) {
    return { valid: false, sanitized, tone, industry, enrichedPrompt: '', estimatedTokens, flagged: true, flagReason: 'Input too long' }
  }

  return { valid: true, sanitized, tone, industry, enrichedPrompt, estimatedTokens, flagged: false }
}
