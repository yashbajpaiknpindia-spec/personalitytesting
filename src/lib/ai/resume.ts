import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Types ────────────────────────────────────────────────────────────────────

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
  keywordMatch: number      // 0–100
  readability: number       // 0–100
  formatting: number        // 0–100
  skillsCoverage: number    // 0–100
}

export interface ATSResult {
  score: number
  breakdown: ATSBreakdown
  suggestions: string[]
}

export interface TailoredResumeResult {
  tailoredResume: ResumeData
  changes: string[]
}

// ─── Helper: call Claude with retry ──────────────────────────────────────────

async function callClaude(
  system: string,
  userPrompt: string,
  maxTokens = 2000,
  attempt = 0,
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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
    if (attempt < 2 && (e?.status === 529 || e?.message?.includes('overloaded'))) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 1500))
      return callClaude(system, userPrompt, maxTokens, attempt + 1)
    }
    throw err
  }
}

function parseJSON<T>(raw: string): T {
  const clean = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  return JSON.parse(clean) as T
}

// ─── Feature 1: Job Description Tailoring ────────────────────────────────────

export async function tailorResumeToJob(
  resumeData: ResumeData,
  jobDescription: string,
): Promise<TailoredResumeResult> {
  const system = `You are an elite ATS optimization expert and resume writer. 
Your task is to rewrite resume content to perfectly match a job description.
Rules:
- Keep the person's real experience — never fabricate anything
- Rewrite bullet points with stronger, quantified language
- Inject keywords from the job description naturally
- Optimize for ATS parsing (clear structure, relevant terms)
- Return ONLY valid JSON, no markdown, no preamble`

  const prompt = `Given this resume data:
${JSON.stringify(resumeData, null, 2)}

And this job description:
${jobDescription}

Rewrite the resume to match this job. Return JSON exactly like:
{
  "tailoredResume": {
    "name": "...",
    "headline": "...",
    "bio": "...",
    "skills": ["..."],
    "resumeBullets": ["..."],
    "experience": [
      {
        "title": "...",
        "company": "...",
        "duration": "...",
        "bullets": ["..."]
      }
    ]
  },
  "changes": ["List of what was changed and why"]
}`

  const raw = await callClaude(system, prompt, 3000)
  return parseJSON<TailoredResumeResult>(raw)
}

// ─── Feature 2: ATS Score (heuristic + AI) ───────────────────────────────────

export function scoreATSHeuristic(
  resumeText: string,
  jobDescription?: string,
): ATSResult {
  const text = resumeText.toLowerCase()
  const suggestions: string[] = []

  // ── Readability ──────────────────────────────────────────────────────────
  const sentences = resumeText.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLen = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length
    : 20
  const hasBullets = /[•\-\*]/.test(resumeText)
  let readability = 80
  if (avgSentenceLen > 25) { readability -= 15; suggestions.push('Shorten sentences for better readability (aim for < 20 words each)') }
  if (!hasBullets) { readability -= 20; suggestions.push('Use bullet points to improve scannability') }

  // ── Formatting ───────────────────────────────────────────────────────────
  const sections = {
    experience: /experience|work history|employment/i.test(resumeText),
    education:  /education|degree|university|college/i.test(resumeText),
    skills:     /skills|technologies|proficiencies/i.test(resumeText),
    summary:    /summary|profile|objective|about/i.test(resumeText),
  }
  const sectionScore = Object.values(sections).filter(Boolean).length
  const formatting = Math.round((sectionScore / 4) * 100)
  if (!sections.experience) suggestions.push('Add a clear "Experience" section')
  if (!sections.education)  suggestions.push('Add an "Education" section')
  if (!sections.skills)     suggestions.push('Add a dedicated "Skills" section')
  if (!sections.summary)    suggestions.push('Add a professional summary at the top')

  // ── Keyword Match ────────────────────────────────────────────────────────
  let keywordMatch = 50
  if (jobDescription) {
    const jdWords = jobDescription
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4)
    const uniqueJdKeywords = Array.from(new Set(jdWords))
    const matched = uniqueJdKeywords.filter(kw => text.includes(kw))
    keywordMatch = Math.min(100, Math.round((matched.length / Math.max(uniqueJdKeywords.length, 1)) * 100 * 2.5))
    if (keywordMatch < 60) {
      suggestions.push('Add more keywords from the job description to improve ATS keyword matching')
    }
  } else {
    suggestions.push('Provide a job description to get accurate keyword match scoring')
  }

  // ── Skills Coverage ──────────────────────────────────────────────────────
  const commonSkillTerms = [
    'management', 'leadership', 'communication', 'analysis', 'strategy',
    'development', 'design', 'marketing', 'sales', 'operations',
    'project', 'team', 'data', 'technical', 'customer',
  ]
  const foundSkills = commonSkillTerms.filter(s => text.includes(s))
  const skillsCoverage = Math.min(100, Math.round((foundSkills.length / commonSkillTerms.length) * 100 * 2))
  if (skillsCoverage < 50) {
    suggestions.push('Expand your skills section with more relevant technical and soft skills')
  }

  // ── Composite score ──────────────────────────────────────────────────────
  const score = Math.round(
    keywordMatch * 0.35 +
    readability  * 0.25 +
    formatting   * 0.25 +
    skillsCoverage * 0.15,
  )

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      keywordMatch: Math.min(100, keywordMatch),
      readability:  Math.min(100, readability),
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
  const system = `You are an ATS (Applicant Tracking System) expert. 
Analyze resumes and provide precise scoring and actionable suggestions.
Return ONLY valid JSON. No markdown. No preamble.`

  const prompt = `Analyze this resume for ATS compatibility${jobDescription ? ' against the job description' : ''}.

RESUME:
${resumeText.substring(0, 3000)}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.substring(0, 1500)}` : ''}

I have a preliminary heuristic score: ${heuristic.score}/100.

Return refined scoring as JSON:
{
  "score": <number 0-100>,
  "breakdown": {
    "keywordMatch": <0-100>,
    "readability": <0-100>,
    "formatting": <0-100>,
    "skillsCoverage": <0-100>
  },
  "suggestions": ["<specific actionable suggestion>", ...]
}

Be precise. Suggestions must be specific and actionable.`

  try {
    const raw = await callClaude(system, prompt, 1500)
    const ai = parseJSON<ATSResult>(raw)
    // Blend heuristic + AI for reliability
    return {
      score: Math.round((ai.score + heuristic.score) / 2),
      breakdown: {
        keywordMatch:   Math.round((ai.breakdown.keywordMatch  + heuristic.breakdown.keywordMatch)  / 2),
        readability:    Math.round((ai.breakdown.readability   + heuristic.breakdown.readability)   / 2),
        formatting:     Math.round((ai.breakdown.formatting    + heuristic.breakdown.formatting)    / 2),
        skillsCoverage: Math.round((ai.breakdown.skillsCoverage + heuristic.breakdown.skillsCoverage) / 2),
      },
      suggestions: Array.from(new Set([...ai.suggestions, ...heuristic.suggestions])).slice(0, 6),
    }
  } catch {
    // Fallback to pure heuristic if AI fails
    return heuristic
  }
}

// ─── Feature 3: Cover Letter Generator ───────────────────────────────────────

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

  const system = `You are a world-class career coach who writes compelling, personalized cover letters.
Tone guide: ${toneGuide}
Write naturally. Never sound like AI. Always be specific to the job and candidate.`

  const prompt = `Write a cover letter for this candidate applying to this role.

CANDIDATE BACKGROUND:
Name: ${resumeData.name || 'The Applicant'}
Headline: ${resumeData.headline || ''}
Summary: ${resumeData.bio || ''}
Key Skills: ${(resumeData.skills || []).join(', ')}
Key Achievements: ${(resumeData.resumeBullets || []).slice(0, 5).join(' | ')}

JOB DESCRIPTION:
${jobDescription.substring(0, 2000)}

Write a complete cover letter (3–4 paragraphs):
1. Hook opening that shows genuine interest + immediate value
2. Specific experience that matches the role requirements
3. Key achievement(s) with impact/numbers if possible
4. Strong close with clear call to action

Return ONLY the cover letter text. No JSON. No labels. Just the letter.`

  return await callClaude(system, prompt, 2000)
}

// ─── Feature 4: LinkedIn PDF Parser ──────────────────────────────────────────

export async function parseLinkedInText(rawText: string): Promise<ResumeData> {
  const system = `You are an expert at parsing LinkedIn profile exports into structured resume data.
Extract all information precisely from the raw text.
Return ONLY valid JSON. No markdown. No preamble.`

  const prompt = `Parse this LinkedIn profile/PDF text into structured resume data.

RAW TEXT:
${rawText.substring(0, 6000)}

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
  "experience": [
    {
      "title": "...",
      "company": "...",
      "duration": "...",
      "bullets": ["..."]
    }
  ],
  "education": [
    {
      "degree": "...",
      "institution": "...",
      "year": "..."
    }
  ],
  "certifications": ["..."]
}`

  const raw = await callClaude(system, prompt, 3000)
  return parseJSON<ResumeData>(raw)
}

// ─── Util: Serialize ResumeData → plain text for ATS scoring ─────────────────

export function resumeDataToText(data: ResumeData): string {
  const parts: string[] = []
  if (data.name)     parts.push(`Name: ${data.name}`)
  if (data.headline) parts.push(`Headline: ${data.headline}`)
  if (data.bio)      parts.push(`Summary\n${data.bio}`)
  if (data.skills?.length) parts.push(`Skills\n• ${data.skills.join('\n• ')}`)
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
