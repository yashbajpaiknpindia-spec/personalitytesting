// src/lib/qc/pipeline.ts

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
const PII_PATTERNS = [/\b\d{9,}\b/, /\b\d{3}-\d{2}-\d{4}\b/]

export async function runQCPipeline(input: GenerateInput): Promise<QCResult> {
  if (!input.name || !input.name.trim()) {
    return { valid: false, sanitized: {}, tone: 'formal', industry: '', enrichedPrompt: '', estimatedTokens: 0, flagged: true, flagReason: 'Name is required' }
  }

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

  const allText = Object.values(sanitized).join(' ')
  for (const p of SPAM_PATTERNS) {
    if (p.test(allText)) return { valid: false, sanitized, tone: 'formal', industry: '', enrichedPrompt: '', estimatedTokens: 0, flagged: true, flagReason: 'Content policy violation' }
  }
  for (const p of PII_PATTERNS) {
    if (p.test(allText)) return { valid: false, sanitized, tone: 'formal', industry: '', enrichedPrompt: '', estimatedTokens: 0, flagged: true, flagReason: 'PII detected' }
  }

  const tone = classifyTone(sanitized.bio, sanitized.jobTitle)
  const industry = inferIndustry(sanitized.jobTitle, sanitized.company)

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
  "heroImageQuery": "specific Pexels search query for a cinematic hero background — scene-specific to this professional's industry, NOT generic like 'business'. Focus on environments, materials, spaces. No people.",
  "workImageQueries": ["specific Pexels query for work section 1", "specific Pexels query for work section 2", "specific Pexels query for work section 3"],
  "portfolioSections": [
    { "title": "section title", "body": "2-3 sentence description", "highlight": "key achievement or metric" }
  ],
  "resumeBullets": ["• Action verb + specific impact metric", "• Action verb + specific impact metric", "• Action verb + specific impact metric"],
  "cardName": "name as it appears on card",
  "cardTitle": "title/role for business card",
  "presentationHook": "compelling opening hook for presentation first slide (max 100 chars)",
  "presentationSlides": [
    {
      "layoutType": "hero",
      "heading": "slide heading",
      "subheading": "optional supporting line",
      "imageQuery": "specific descriptive Pexels search query for a real photograph"
    },
    {
      "layoutType": "stats",
      "heading": "slide heading",
      "stats": [
        { "value": "12+", "label": "Years Experience" },
        { "value": "50+", "label": "Projects Delivered" },
        { "value": "98%", "label": "Client Satisfaction" }
      ]
    },
    {
      "layoutType": "split-left",
      "heading": "slide heading",
      "body": "2-3 sentence paragraph about this topic",
      "imageQuery": "specific descriptive Pexels search query"
    },
    {
      "layoutType": "bullets",
      "heading": "slide heading",
      "bullets": ["Point one with specific detail", "Point two with specific detail", "Point three", "Point four"],
      "imageQuery": "optional Pexels search query"
    },
    {
      "layoutType": "quote",
      "heading": "slide heading",
      "quote": "A compelling quote or value statement relevant to the professional",
      "attribution": "Source or context for the quote"
    },
    {
      "layoutType": "split-right",
      "heading": "slide heading",
      "body": "2-3 sentence paragraph",
      "imageQuery": "specific descriptive Pexels search query"
    },
    {
      "layoutType": "grid",
      "heading": "slide heading",
      "cards": [
        { "title": "Card 1 Title", "body": "1-2 sentence description" },
        { "title": "Card 2 Title", "body": "1-2 sentence description" },
        { "title": "Card 3 Title", "body": "1-2 sentence description" }
      ]
    },
    {
      "layoutType": "title-only",
      "heading": "Powerful closing statement or CTA",
      "subheading": "Contact line or next step"
    }
  ]
}

IMAGE RULES:
- heroImageQuery: scene that IS the professional world — textile expert gets fabric mill, finance exec gets trading floor or city skyline, designer gets modern studio. Avoid people, focus on environments.
- workImageQueries: 3 queries, one per portfolioSection, each visually representing that section topic.

SLIDE RULES:
- Generate exactly 8 presentationSlides in this sequence: hero → stats → split-left → bullets → quote → split-right → grid → title-only
- imageQuery fields: specific photographic queries like "confident businesswoman speaking at conference" NOT "business" or "professional"
- stats values must be specific to the professional's context — infer from their job title, company and bio
- bullets must be concise punchy phrases, not full sentences
- quote should feel like something the professional would genuinely say or aspire to
- All content must reflect the ${industry} industry with a ${tone} tone
- Include exactly 3 portfolioSections, exactly 5 resumeBullets
`.trim()

  const estimatedTokens = estimateTokens(enrichedPrompt)

  if (estimatedTokens > 1500) {
    return { valid: false, sanitized, tone, industry, enrichedPrompt: '', estimatedTokens, flagged: true, flagReason: 'Input too long' }
  }

  return { valid: true, sanitized, tone, industry, enrichedPrompt, estimatedTokens, flagged: false }
}
