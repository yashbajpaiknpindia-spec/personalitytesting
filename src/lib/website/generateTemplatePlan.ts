// src/lib/website/generateTemplatePlan.ts
// Uses cheap Claude Haiku to select a template + generate JSON personalisation plan.
// Returns structured JSON only — no HTML, no full website code.
// SERVER-ONLY (uses Anthropic SDK + db).

import Anthropic from '@anthropic-ai/sdk'
import {
  WEBSITE_TEMPLATE_LIBRARY,
  getCandidateTemplatesForPrompt,
  getWebsiteTemplateById,
  findTemplateLocally,
  getFallbackTemplate,
  type WebsiteTemplate,
} from './templates'
import { getUsdToInr } from '@/lib/ai/generate'
import { createAnthropicMessage } from '@/lib/ai/anthropic-fallback'
import { extractAIText, parseAIJson } from '@/lib/ai/safe-json'

const TEMPLATE_MODEL =
  process.env.CLAUDE_TEMPLATE_MODEL ?? 'claude-haiku-4-5-20251001'
const TEMPLATE_MAX_TOKENS = Number(
  process.env.CLAUDE_TEMPLATE_MAX_TOKENS ?? 1000
)

// Haiku pricing (per million tokens, configurable)
const HAIKU_INPUT_PER_M = Number(
  process.env.CLAUDE_HAIKU_INPUT_PER_MTOKENS_USD ?? 0.8
)
const HAIKU_OUTPUT_PER_M = Number(
  process.env.CLAUDE_HAIKU_OUTPUT_PER_MTOKENS_USD ?? 4
)

// ── Types ─────────────────────────────────────────────────────────────────────

export type SectionItem = {
  title: string
  description: string
}

export type PlanSection =
  | { type: 'services'; title: string; items: SectionItem[] }
  | { type: 'why_us';   title: string; items: SectionItem[] }
  | { type: 'contact';  title: string; description: string }

export type WebsiteTemplatePlan = {
  template_id: string
  template_label: string
  business_name: string
  industry: string
  industry_confidence: 'high' | 'medium' | 'low'
  tone: string
  colors: {
    primary: string
    background: string
    secondary: string
  }
  hero: {
    headline: string
    subheadline: string
    cta_primary: string
    cta_secondary: string
  }
  sections: PlanSection[]
  seo: {
    title: string
    description: string
  }
}

export type PlanUsage = {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  model: string
  costUsd: number
  costInr: number
}

export type TemplatePlanResult = {
  plan: WebsiteTemplatePlan
  usage: PlanUsage
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(candidates: WebsiteTemplate[]): string {
  const templateList = candidates
    .map(
      t =>
        `{ "id": "${t.id}", "label": "${t.label}", "category": "${t.category}", "industries": ${JSON.stringify(t.industries)}, "keywords": ${JSON.stringify(t.keywords)} }`
    )
    .join('\n')

  return `You are Brand Syndicate's website template planner.
Your job is to select the best internal design layout and write complete business-specific website content for rendering.
You must never write HTML, CSS, JavaScript, React, Next.js, or website code.
Return valid JSON only. No markdown. No explanation. No code fences.
Use only one template_id from the provided internal layout library below. This id is internal and must never appear in user-visible copy.
If industry is missing, infer it from company name, prompt, description, services, products, and keywords.
If still unclear, choose the fallback template "marketing-agency" and set industry to "General Business".
Never fail because industry is missing.
Write premium, conversion-focused copy suitable for Indian businesses.
Make the result feel like a real ready-to-use business website, not a demo, mockup, or template.
Never use the words template, placeholder, sample, backend, replace, predictable structure, demo content, lorem ipsum, Service One, Service Two, or Feature One in any user-visible copy.
Include specific services/products, proof points, customer benefits, process, and contact intent.
Keep copy concise but complete enough to feel finished.
Mobile layout guardrails: business_name under 28 characters when possible, hero headline under 9 words, CTA labels under 18 characters, nav-friendly wording, no overly long unbroken words, and section titles under 42 characters.
No markdown. No explanation.

AVAILABLE TEMPLATES:
${templateList}

FALLBACK: If no template matches well, use "marketing-agency".`
}

// ── User message builder ──────────────────────────────────────────────────────

function buildUserMessage(input: {
  companyName?: string
  description?: string
  industry?: string
  sector?: string
  brandTone?: string
  businessStage?: string
  primaryColor?: string
  backgroundColor?: string
}): string {
  const lines: string[] = []
  if (input.companyName)   lines.push(`Company Name: ${input.companyName}`)
  if (input.description)   lines.push(`Description / Prompt: ${input.description}`)
  if (input.industry)      lines.push(`Industry: ${input.industry}`)
  if (input.sector)        lines.push(`Sector: ${input.sector}`)
  if (input.brandTone)     lines.push(`Brand Tone: ${input.brandTone}`)
  if (input.businessStage) lines.push(`Business Stage: ${input.businessStage}`)
  if (input.primaryColor)  lines.push(`Preferred Primary Color: ${input.primaryColor}`)

  return `${lines.join('\n')}

Return ONLY a JSON object matching this exact shape (no markdown, no fences):
{
  "template_id": "<id from library>",
  "template_label": "<label>",
  "business_name": "<name>",
  "industry": "<industry>",
  "industry_confidence": "high" | "medium" | "low",
  "tone": "<tone description>",
  "colors": { "primary": "<hex>", "background": "<hex>", "secondary": "<hex>" },
  "hero": {
    "headline": "<compelling headline, max 9 words>",
    "subheadline": "<2-sentence subheadline, concise and mobile safe>",
    "cta_primary": "<primary CTA text, max 18 chars>",
    "cta_secondary": "<secondary CTA text, max 18 chars>"
  },
  "sections": [
    { "type": "services", "title": "<title>", "items": [{ "title": "<specific service/product>", "description": "<real benefit-driven description>" }, ... minimum 6 items] },
    { "type": "why_us",   "title": "<title>", "items": [{ "title": "<proof/benefit>", "description": "<real trust-building description>" }, ... minimum 4 items] },
    { "type": "contact",  "title": "<title>", "description": "<desc>" }
  ],
  "seo": { "title": "<page title>", "description": "<meta description 120-155 chars>" }
}`
}

function clampText(value: string | undefined, fallback: string, max = 120): string {
  const clean = (value || fallback).replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, Math.max(0, max - 1)).trimEnd() + '…'
}

function clampItems(items: SectionItem[] | undefined, fallback: SectionItem[], maxTitle = 44, maxDesc = 170, maxItems = 8): SectionItem[] {
  const source = (items && items.length ? items : fallback).slice(0, maxItems)
  return source.map(item => ({
    title: clampText(item.title, 'Business Ready', maxTitle),
    description: clampText(item.description, 'Clear, customer-focused information designed to support enquiry and trust.', maxDesc),
  }))
}

// ── Validate and normalise raw Claude JSON ────────────────────────────────────

function normalisePlan(
  raw: Partial<WebsiteTemplatePlan>,
  input: {
    companyName?: string
    primaryColor?: string
    backgroundColor?: string
  },
  selectedTemplate: WebsiteTemplate
): WebsiteTemplatePlan {
  // Validate template_id
  const validId = getWebsiteTemplateById(raw.template_id ?? '') !== undefined
  const template = validId
    ? getWebsiteTemplateById(raw.template_id!)!
    : selectedTemplate

  const fallbackServices: SectionItem[] = [
    { title: 'Premium Quality', description: 'Dependable work, clear communication and a polished customer experience from first enquiry to delivery.' },
    { title: 'Fast Enquiry Flow', description: 'Every section guides visitors toward calls, WhatsApp enquiries, bookings or quotes without confusion.' },
    { title: 'Customer Support', description: 'Helpful support before and after purchase so serious buyers always know the next step.' },
    { title: 'Local Trust', description: 'Messaging built around Indian buyer behaviour, social proof and practical reasons to choose the business.' },
    { title: 'Clear Packages', description: 'Service, product or package details are written in a way that makes choices easy on mobile screens.' },
    { title: 'Proof-Led Copy', description: 'Benefits, process and credibility cues are included so the website feels finished instead of generic.' },
  ]
  const fallbackWhy: SectionItem[] = [
    { title: 'Trusted Team', description: 'A credibility-first presentation that helps visitors understand the offer and feel safe enquiring.' },
    { title: 'Mobile Ready', description: 'Designed for phone-first visitors with clear hierarchy, readable sections and quick contact actions.' },
    { title: 'Business Focused', description: 'Copy and structure are built around services, proof, process and conversion, not generic filler.' },
    { title: 'India Ready', description: 'The page is shaped for Indian buyers with direct enquiry paths, social proof and practical trust signals.' },
  ]

  const rawSections = Array.isArray(raw.sections) ? raw.sections : []
  const rawServices = rawSections.find((s): s is Extract<PlanSection, { type: 'services' }> => s.type === 'services')
  const rawWhy = rawSections.find((s): s is Extract<PlanSection, { type: 'why_us' }> => s.type === 'why_us')
  const rawContact = rawSections.find((s): s is Extract<PlanSection, { type: 'contact' }> => s.type === 'contact')

  const sections: PlanSection[] = [
    {
      type: 'services',
      title: clampText(rawServices?.title, 'Services Built for Customers', 42),
      items: clampItems(rawServices?.items, fallbackServices, 42, 170, 8),
    },
    {
      type: 'why_us',
      title: clampText(rawWhy?.title, 'Why Customers Choose Us', 42),
      items: clampItems(rawWhy?.items, fallbackWhy, 42, 170, 6),
    },
    {
      type: 'contact',
      title: clampText(rawContact?.title, 'Start Your Enquiry', 42),
      description: clampText(rawContact?.description, 'Share your requirement and our team will contact you shortly with the next step.', 170),
    },
  ]

  return {
    template_id: template.id,
    template_label: raw.template_label?.trim() || template.label,
    business_name: clampText(raw.business_name, input.companyName || 'Your Brand', 34),
    industry: clampText(raw.industry, 'General Business', 60),
    industry_confidence: raw.industry_confidence ?? 'medium',
    tone: clampText(raw.tone, 'professional, premium', 80),
    colors: {
      primary:    raw.colors?.primary    || template.color,
      background: raw.colors?.background || template.bg,
      secondary:  raw.colors?.secondary  || '#FFFFFF',
    },
    hero: {
      headline:      clampText(raw.hero?.headline, `Welcome to ${input.companyName || 'Our Brand'}`, 72),
      subheadline:   clampText(raw.hero?.subheadline, 'Premium services tailored for your success.', 170),
      cta_primary:   clampText(raw.hero?.cta_primary, 'Enquire Now', 18),
      cta_secondary: clampText(raw.hero?.cta_secondary, 'View Services', 18),
    },
    sections,
    seo: {
      title:       clampText(raw.seo?.title, `${input.companyName || 'Your Brand'} — Premium Services`, 70),
      description: clampText(raw.seo?.description, `Premium website for ${input.companyName || 'your business'}, crafted by Brand Syndicate.`, 155),
    },
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateTemplatePlan(input: {
  companyName?: string
  description?: string
  industry?: string
  sector?: string
  brandTone?: string
  businessStage?: string
  primaryColor?: string
  backgroundColor?: string
}): Promise<TemplatePlanResult> {
  const usdToInr = await getUsdToInr()
  const client   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Candidate templates (locally filtered to keep input tokens low)
  const candidates = getCandidateTemplatesForPrompt(
    {
      prompt:      input.description,
      companyName: input.companyName,
      industry:    input.industry,
      sector:      input.sector,
    },
    Math.min(100, WEBSITE_TEMPLATE_LIBRARY.length)
  )

  // Also find locally for fallback validation
  const localBest = findTemplateLocally({
    prompt:      input.description,
    companyName: input.companyName,
    industry:    input.industry,
    sector:      input.sector,
  })

  const systemPrompt = buildSystemPrompt(candidates)
  const userMessage  = buildUserMessage(input)

  const { message: response, model: resolvedModel } = await createAnthropicMessage(client, {
    model:      TEMPLATE_MODEL,
    max_tokens: TEMPLATE_MAX_TOKENS,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userMessage }],
  }, [TEMPLATE_MODEL, 'claude-haiku-4-5-20251001', 'claude-3-5-haiku-latest'])

  const inputTokens  = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const totalTokens  = inputTokens + outputTokens
  const costUsd      = (inputTokens / 1_000_000) * HAIKU_INPUT_PER_M +
                       (outputTokens / 1_000_000) * HAIKU_OUTPUT_PER_M

  const usage: PlanUsage = {
    inputTokens,
    outputTokens,
    totalTokens,
    model:   resolvedModel,
    costUsd,
    costInr: costUsd * usdToInr,
  }

  // Extract and parse text. If the model returns markdown or a partial JSON object,
  // parseAIJson recovers the first balanced JSON object instead of hard-failing.
  const rawText = extractAIText(response.content).trim()
  const rawPlan = parseAIJson<Partial<WebsiteTemplatePlan>>(rawText, {})
  if (!rawPlan || Object.keys(rawPlan).length === 0) {
    console.warn('[generateTemplatePlan] JSON parse failed, using local fallback. Raw:', rawText.slice(0, 200))
    const plan = normalisePlan({}, input, localBest)
    plan.industry_confidence = 'low'
    return { plan, usage }
  }

  const plan = normalisePlan(rawPlan, input, localBest)
  return { plan, usage }
}
