// src/lib/ai/resume.ts
// Optimised — model routing per feature.
//
// Routing:
//   parseLinkedIn   → Haiku  (pure extraction, structured JSON)
//   scoreATS (AI)   → Haiku  (scoring + suggestions, structured JSON)
//   tailorResume    → Haiku  (rewriting bullets, structured JSON)
//   coverLetter     → Sonnet (free-form prose, quality matters most here)
//
// Everything else (types, heuristic scorer, serializer) is identical to before.

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const HAIKU  = 'claude-haiku-4-5-20251001'
const SONNET = 'claude-sonnet-4-5'

// ── Types (unchanged) ─────────────────────────────────────────────────────────

export interface ResumeData {
  name?: string
  headline?: string
  bio?: string
  skills?: string[]
  resumeBullets?: string[]
  experience?: Array<{ title: string; company: string; duration: string; bullets: string[] }>
  education?: Array<{ degree: string; institution: string; year: string }>
  [key: string]: unknown
}

export interface ATSBreakdown {
  keywordMatch:   number   // 0–100
  readability:    number   // 0–100
  formatting:     number   // 0–100
  skillsCoverage: number   // 0–100
}

export interface ATSResult {
  score:       number
  breakdown:   ATSBreakdown
  suggestions: string[]
}

export interface TailoredResumeResult {
  tailoredResume: ResumeData
  changes: string[]
}

// ── Core caller with model param ──────────────────────────────────────────────

async function callClaude(
  model: string,
  system: string,
  userPrompt: string,
  maxTokens: number,
  attempt = 0,
): Promise<string> {
  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    })
    return response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    const overloaded = e?.status === 529 || e?.message?.includes('overloaded')
    if (attempt < 3 && overloaded) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 1500))
      return callClaude(model, system, userPrompt, maxTokens, attempt + 1)
    }
    throw err
  }
}

function parseJSON<T>(raw: string): T {
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(clean) as T
}

// ── Feature 1: Job Description Tailoring → HAIKU ─────────────────────────────
// Haiku handles structured JSON rewriting tasks identically to Sonnet.
// Saving: ~75 % cost reduction per tailoring call.

export async function tailorResumeToJob(
  resumeData: ResumeData,
  jobDescription: string,
): Promise<TailoredResumeResult> {
  const system = `You are an ATS optimisation expert and resume writer.
Rewrite resume content to match a job description.
Rules:
- Keep the person's real experience — never fabricate
- Rewrite bullets with stronger, quantified language
- Inject keywords from the job description naturally
- Return ONLY valid JSON, no markdown, no preamble`

  const prompt = `Resume:
${JSON.stringify(resumeData, null, 2)}

Job description:
${jobDescription.substring(0, 1500)}

Return JSON:
{
  "tailoredResume": {
    "name": "...",
    "headline": "...",
    "bio": "...",
    "skills": ["..."],
    "resumeBullets": ["..."],
    "experience": [{ "title": "...", "company": "...", "duration": "...", "bullets": ["..."] }]
  },
  "changes": ["What changed and why"]
}`

  const raw = await callClaude(HAIKU, system, prompt, 2000)
  return parseJSON<TailoredResumeResult>(raw)
}

// ── Feature 2: ATS Scoring ────────────────────────────────────────────────────
// Heuristic scorer is pure TypeScript — zero API cost (unchanged).
// AI enhancement now uses Haiku — scoring is a structured JSON task.
// Saving: ~75 % cost reduction per ATS call.

export function scoreATSHeuristic(
  resumeText: string,
  jobDescription?: string,
): ATSResult {
  const text        = resumeText.toLowerCase()
  const suggestions: string[] = []

  // ── Readability ─────────────────────────────────────────────────────────
  const sentences       = resumeText.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLen  = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length
    : 20
  const hasBullets = /[•\-\*]/.test(resumeText)
  let readability  = 80
  if (avgSentenceLen > 25) { readability -= 15; suggestions.push('Shorten sentences — aim for < 20 words each') }
  if (!hasBullets)         { readability -= 20; suggestions.push('Use bullet points to improve scannability') }

  // ── Formatting ──────────────────────────────────────────────────────────
  const sections = {
    experience: /experience|work history|employment/i.test(resumeText),
    education:  /education|degree|university|college/i.test(resumeText),
    skills:     /skills|technologies|proficiencies/i.test(resumeText),
    summary:    /summary|profile|objective|about/i.test(resumeText),
  }
  const sectionScore = Object.values(sections).filter(Boolean).length
  const formatting   = Math.round((sectionScore / 4) * 100)
  if (!sections.experience) suggestions.push('Add a clear "Experience" section')
  if (!sections.education)  suggestions.push('Add an "Education" section')
  if (!sections.skills)     suggestions.push('Add a dedicated "Skills" section')
  if (!sections.summary)    suggestions.push('Add a professional summary at the top')

  // ── Keyword Match ────────────────────────────────────────────────────────
  let keywordMatch = 50
  if (jobDescription) {
    const jdWords         = jobDescription.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 4)
    const uniqueJdWords   = Array.from(new Set(jdWords))
    const matched         = uniqueJdWords.filter(kw => text.includes(kw))
    keywordMatch          = Math.min(100, Math.round((matched.length / Math.max(uniqueJdWords.length, 1)) * 100 * 2.5))
    if (keywordMatch < 60) suggestions.push('Add more keywords from the job description')
  } else {
    suggestions.push('Provide a job description for accurate keyword match scoring')
  }

  // ── Skills Coverage ──────────────────────────────────────────────────────
  const commonSkillTerms = [
    'management','leadership','communication','analysis','strategy',
    'development','design','marketing','sales','operations',
    'project','team','data','technical','customer',
  ]
  const foundSkills    = commonSkillTerms.filter(s => text.includes(s))
  const skillsCoverage = Math.min(100, Math.round((foundSkills.length / commonSkillTerms.length) * 100 * 2))
  if (skillsCoverage < 50) suggestions.push('Expand your skills section with more relevant terms')

  const score = Math.round(
    keywordMatch   * 0.35 +
    readability    * 0.25 +
    formatting     * 0.25 +
    skillsCoverage * 0.15,
  )

  return {
    score:     Math.min(100, Math.max(0, score)),
    breakdown: {
      keywordMatch:   Math.min(100, keywordMatch),
      readability:    Math.min(100, readability),
      formatting,
      skillsCoverage: Math.min(100, skillsCoverage),
    },
    suggestions: suggestions.slice(0, 6),
  }
}

export async function enhanceATSWithAI(
  resumeText: string,
  heuristic: ATSResult,
  jobDescription?: string,
): Promise<ATSResult> {
  const system = `You are an ATS expert. Analyse resumes and provide precise scoring.
Return ONLY valid JSON. No markdown. No preamble.`

  const prompt = `Analyse this resume for ATS compatibility${jobDescription ? ' against the job description' : ''}.

RESUME:
${resumeText.substring(0, 2500)}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.substring(0, 1200)}` : ''}

Preliminary heuristic score: ${heuristic.score}/100.

Return:
{
  "score": <0-100>,
  "breakdown": {
    "keywordMatch": <0-100>,
    "readability": <0-100>,
    "formatting": <0-100>,
    "skillsCoverage": <0-100>
  },
  "suggestions": ["<specific actionable suggestion>"]
}`

  try {
    const raw = await callClaude(HAIKU, system, prompt, 1000)
    const ai  = parseJSON<ATSResult>(raw)
    // Blend heuristic + AI for reliability
    return {
      score: Math.round((ai.score + heuristic.score) / 2),
      breakdown: {
        keywordMatch:   Math.round((ai.breakdown.keywordMatch   + heuristic.breakdown.keywordMatch)   / 2),
        readability:    Math.round((ai.breakdown.readability    + heuristic.breakdown.readability)    / 2),
        formatting:     Math.round((ai.breakdown.formatting     + heuristic.breakdown.formatting)     / 2),
        skillsCoverage: Math.round((ai.breakdown.skillsCoverage + heuristic.breakdown.skillsCoverage) / 2),
      },
      suggestions: Array.from(new Set([...ai.suggestions, ...heuristic.suggestions])).slice(0, 6),
    }
  } catch {
    return heuristic   // Graceful fallback — heuristic is always available
  }
}

// ── Feature 3: Cover Letter → SONNET ─────────────────────────────────────────
// Kept on Sonnet intentionally — this is free-form prose that users READ.
// Quality is the product here. Haiku would produce noticeably flatter writing.

export async function generateCoverLetter(
  resumeData: ResumeData,
  jobDescription: string,
  tone: 'professional' | 'casual' | 'executive' | 'creative' = 'professional',
): Promise<string> {
  const toneGuide = {
    professional: 'Clear, structured, credible. Formal but warm.',
    casual:       'Conversational and personable. Authentic, not stiff.',
    executive:    'Authoritative, strategic, results-focused. Confident.',
    creative:     'Distinctive voice, engaging narrative, bold opening.',
  }[tone]

  const system = `You are a world-class career coach who writes compelling, personalised cover letters.
Tone guide: ${toneGuide}
Write naturally. Never sound like AI. Always be specific to the job and candidate.`

  const prompt = `Write a cover letter for this candidate.

CANDIDATE:
Name: ${resumeData.name || 'The Applicant'}
Headline: ${resumeData.headline || ''}
Summary: ${resumeData.bio || ''}
Skills: ${(resumeData.skills || []).join(', ')}
Achievements: ${(resumeData.resumeBullets || []).slice(0, 5).join(' | ')}

JOB DESCRIPTION:
${jobDescription.substring(0, 2000)}

Write a complete cover letter (3–4 paragraphs):
1. Hook opening — genuine interest + immediate value
2. Specific experience matching the role
3. Key achievement(s) with impact/numbers
4. Strong close with clear call to action

Return ONLY the cover letter text. No JSON. No labels.`

  return await callClaude(SONNET, system, prompt, 1500)
}

// ── Feature 4: LinkedIn PDF Parser → HAIKU ───────────────────────────────────
// Pure extraction — structured JSON from text. Haiku handles this perfectly.
// Saving: ~75 % cost reduction per LinkedIn import.

export async function parseLinkedInText(rawText: string): Promise<ResumeData> {
  const system = `You are an expert at parsing LinkedIn profile exports into structured resume data.
Extract all information precisely. Return ONLY valid JSON. No markdown. No preamble.`

  const prompt = `Parse this LinkedIn profile text into structured resume data.

TEXT:
${rawText.substring(0, 5000)}

Return JSON:
{
  "name": "...",
  "headline": "...",
  "bio": "...",
  "location": "...",
  "email": "...",
  "linkedin": "...",
  "skills": ["..."],
  "resumeBullets": ["Key achievement 1", "Key achievement 2"],
  "experience": [{ "title": "...", "company": "...", "duration": "...", "bullets": ["..."] }],
  "education": [{ "degree": "...", "institution": "...", "year": "..." }],
  "certifications": ["..."]
}`

  const raw = await callClaude(HAIKU, system, prompt, 2500)
  return parseJSON<ResumeData>(raw)
}

// ── Util: ResumeData → plain text for ATS scoring (unchanged) ─────────────────

export function resumeDataToText(data: ResumeData): string {
  const parts: string[] = []
  if (data.name)                  parts.push(`Name: ${data.name}`)
  if (data.headline)              parts.push(`Headline: ${data.headline}`)
  if (data.bio)                   parts.push(`Summary\n${data.bio}`)
  if (data.skills?.length)        parts.push(`Skills\n• ${data.skills.join('\n• ')}`)
  if (data.resumeBullets?.length) parts.push(`Experience\n• ${data.resumeBullets.join('\n• ')}`)
  if (Array.isArray(data.experience)) {
    for (const exp of data.experience as Array<{ title: string; company: string; duration: string; bullets: string[] }>) {
      parts.push(`${exp.title} at ${exp.company} (${exp.duration})\n• ${(exp.bullets || []).join('\n• ')}`)
    }
  }
  if (Array.isArray(data.education)) {
    parts.push('Education')
    for (const edu of data.education as Array<{ degree: string; institution: string; year: string }>) {
      parts.push(`${edu.degree} — ${edu.institution} (${edu.year})`)
    }
  }
  return parts.join('\n\n')
}
