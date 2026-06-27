// src/lib/qc/pipeline.ts
// Personal brand QC pipeline — no presentation/slide output.
// Outputs: portfolio, card, resume only.

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

// ── Theme / font helpers ──────────────────────────────────────────────────────

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
  // 'presentation' is no longer a supported output type — strip it if passed
  const selected      = new Set((input.outputTypes || ['portfolio', 'card', 'resume']).filter(t => t !== 'presentation'))
  const wantPortfolio = selected.has('portfolio')
  const wantCard      = selected.has('card')
  const wantResume    = selected.has('resume')

  // ── 5. Build schema (only selected verticals) ─────────────────────────────

  const baseSchema = `
  "headline": "<80-char professional headline>",
  "tagline":  "<120-char value proposition>",
  "bio":      "<150-400 char bio, ${tone} tone, first person>",
  "skills":   ["skill1","skill2","skill3","skill4","skill5"],
  "cta":      "<60-char call-to-action>"`

  const portfolioSchema = wantPortfolio ? `,
  "heroImageQuery":    "<cinematic image search query, environment/atmosphere, no people>",
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

  // ── 6. Build rules ─────────────────────────────────────────────────────────
  const rules: string[] = [
    `- Reflect the ${industry} industry with a ${tone} tone throughout`,
  ]
  if (wantPortfolio) rules.push(
    '- heroImageQuery: environment/material/space, NOT generic "business", NO people',
    '- workImageQueries: one per portfolioSection, visually specific',
    '- Exactly 3 portfolioSections'
  )
  if (wantResume) rules.push('- Exactly 5 resumeBullets, each starting with an action verb + measurable impact')

  // ── 7. Build the profile block ─────────────────────────────────────────────
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

Return ONLY valid JSON, no markdown, no extra fields, no preamble:

{${baseSchema}${portfolioSchema}${resumeSchema}${cardSchema}
}

RULES:
${rules.filter(r => r.trim()).join('\n')}`.trim()

  // ── 9. Token guard ─────────────────────────────────────────────────────────
  const estimatedTokens = estimateTokens(enrichedPrompt)
  if (estimatedTokens > 1500) {
    return { valid: false, sanitized, tone, industry, enrichedPrompt: '', estimatedTokens, flagged: true, flagReason: 'Input too long' }
  }

  return { valid: true, sanitized, tone, industry, enrichedPrompt, estimatedTokens, flagged: false }
}
