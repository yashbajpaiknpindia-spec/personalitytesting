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

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim()
}

function classifyTone(bio: string, jobTitle: string): 'formal' | 'creative' | 'executive' {
  const text = `${bio} ${jobTitle}`.toLowerCase()
  if (/ceo|cto|cfo|vp|president|director|partner|chief/.test(text)) return 'executive'
  if (/design|creative|artist|writer|filmmaker|photographer|musician/.test(text)) return 'creative'
  return 'formal'
}

function inferIndustry(jobTitle: string, company: string): string {
  const text = `${jobTitle} ${company}`.toLowerCase()
  if (/engineer|developer|software|tech|ml|ai|data/.test(text)) return 'Technology'
  if (/finance|bank|invest|fund|capital|trading/.test(text)) return 'Finance'
  if (/design|creative|art|ux|ui/.test(text)) return 'Design & Creative'
  if (/market|brand|growth|seo|content/.test(text)) return 'Marketing'
  if (/health|medical|doctor|pharma|biotech/.test(text)) return 'Healthcare'
  if (/consult|strategy|management|mckinsey|bain/.test(text)) return 'Consulting'
  if (/law|legal|attorney|counsel/.test(text)) return 'Legal'
  if (/education|professor|teacher|academic/.test(text)) return 'Education'
  return 'Professional Services'
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

const SPAM_PATTERNS = [/\b(buy now|click here|free money|make money fast)\b/i]
const PII_PATTERNS = [/\b\d{9,}\b/, /\b\d{3}-\d{2}-\d{4}\b/] // SSN patterns etc

export async function runQCPipeline(input: GenerateInput): Promise<QCResult> {
  // 1. Validate required fields
  if (!input.name || !input.name.trim()) {
    return { valid: false, sanitized: {}, tone: 'formal', industry: '', enrichedPrompt: '', estimatedTokens: 0, flagged: true, flagReason: 'Name is required' }
  }

  // 2. Sanitize
  const sanitized: Record<string, string> = {
    name: stripHtml(input.name).substring(0, 100),
    headline: stripHtml(input.headline || '').substring(0, 120),
    tagline: stripHtml(input.tagline || '').substring(0, 150),
    jobTitle: stripHtml(input.jobTitle || '').substring(0, 100),
    company: stripHtml(input.company || '').substring(0, 100),
    location: stripHtml(input.location || '').substring(0, 100),
    bio: stripHtml(input.bio || '').substring(0, 500),
    skills: (input.skills || []).map(s => stripHtml(s).substring(0, 50)).join(', '),
    tone: input.tone || 'professional',
  }

  // 3. Policy check
  const allText = Object.values(sanitized).join(' ')
  for (const p of SPAM_PATTERNS) {
    if (p.test(allText)) return { valid: false, sanitized, tone: 'formal', industry: '', enrichedPrompt: '', estimatedTokens: 0, flagged: true, flagReason: 'Content policy violation' }
  }
  for (const p of PII_PATTERNS) {
    if (p.test(allText)) return { valid: false, sanitized, tone: 'formal', industry: '', enrichedPrompt: '', estimatedTokens: 0, flagged: true, flagReason: 'PII detected' }
  }

  // 4. Classify
  const tone = classifyTone(sanitized.bio, sanitized.jobTitle)
  const industry = inferIndustry(sanitized.jobTitle, sanitized.company)

  // 5. Build enriched prompt
  const enrichedPrompt = `
You are generating a comprehensive personal brand package for the following professional.

PROFESSIONAL PROFILE:
- Name: ${sanitized.name}
- Job Title: ${sanitized.jobTitle || 'Not specified'}
- Company: ${sanitized.company || 'Not specified'}
- Location: ${sanitized.location || 'Not specified'}
- Current Headline: ${sanitized.headline || 'Not specified'}
- Tagline: ${sanitized.tagline || 'Not specified'}
- Bio: ${sanitized.bio || 'Not provided'}
- Key Skills: ${sanitized.skills || 'Not specified'}

CONTEXT:
- Industry: ${industry}
- Tone: ${tone} (${tone === 'executive' ? 'authoritative, results-driven, commanding' : tone === 'creative' ? 'expressive, innovative, bold' : 'professional, credible, clear'})
- Requested Outputs: ${(input.outputTypes || ['portfolio', 'card', 'resume']).join(', ')}

INSTRUCTIONS:
Generate a complete personal brand package. Return ONLY valid JSON matching this exact schema, no markdown, no explanation:

{
  "headline": "compelling professional headline (max 80 chars)",
  "tagline": "memorable tagline/value proposition (max 120 chars)",
  "bio": "professional bio 150-400 chars, ${tone} tone, first person",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "cta": "call-to-action text (max 60 chars)",
  "portfolioSections": [
    { "title": "section title", "body": "2-3 sentence description", "highlight": "key achievement or metric" }
  ],
  "resumeBullets": ["• Action verb + specific impact metric", "• Action verb + specific impact metric", "• Action verb + specific impact metric"],
  "cardName": "name as it appears on card",
  "cardTitle": "title/role for business card",
  "presentationHook": "compelling opening hook for presentation first slide (max 100 chars)",
  "presentationSlides": [
    { "title": "slide title", "body": "slide content (2-3 sentences)", "imageQuery": "descriptive search query for background image" }
  ]
}

Ensure all content is polished, specific, and reflects the ${industry} industry with a ${tone} tone. Include 3 portfolioSections, 5 resumeBullets, and 4 presentationSlides.
`.trim()

  const estimatedTokens = estimateTokens(enrichedPrompt)

  if (estimatedTokens > 800) {
    return { valid: false, sanitized, tone, industry, enrichedPrompt: '', estimatedTokens, flagged: true, flagReason: 'Input too long' }
  }

  return { valid: true, sanitized, tone, industry, enrichedPrompt, estimatedTokens, flagged: false }
}
