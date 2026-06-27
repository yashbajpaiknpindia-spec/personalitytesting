// src/lib/website/templates.ts
// Shared template metadata — safe to import in client and server components.
// NO fs/path imports here. Server-only file helpers live in templateFiles.ts.

import { TEMPLATES_CHUNK_01 } from './templates-data/chunk-01'
import { TEMPLATES_CHUNK_02 } from './templates-data/chunk-02'
import { TEMPLATES_CHUNK_03 } from './templates-data/chunk-03'
import { TEMPLATES_CHUNK_04 } from './templates-data/chunk-04'
import { TEMPLATES_CHUNK_05 } from './templates-data/chunk-05'
import { TEMPLATES_CHUNK_06 } from './templates-data/chunk-06'
import { TEMPLATES_CHUNK_07 } from './templates-data/chunk-07'
import { TEMPLATES_CHUNK_08 } from './templates-data/chunk-08'
import { TEMPLATES_CHUNK_09 } from './templates-data/chunk-09'
import { TEMPLATES_CHUNK_10 } from './templates-data/chunk-10'

export type { WebsiteTemplate } from './template-types'
import type { WebsiteTemplate } from './template-types'

export const FALLBACK_TEMPLATE_ID = 'marketing-agency'

export const WEBSITE_TEMPLATE_LIBRARY: WebsiteTemplate[] = [
  ...TEMPLATES_CHUNK_01,
  ...TEMPLATES_CHUNK_02,
  ...TEMPLATES_CHUNK_03,
  ...TEMPLATES_CHUNK_04,
  ...TEMPLATES_CHUNK_05,
  ...TEMPLATES_CHUNK_06,
  ...TEMPLATES_CHUNK_07,
  ...TEMPLATES_CHUNK_08,
  ...TEMPLATES_CHUNK_09,
  ...TEMPLATES_CHUNK_10,
]

// ── Utility functions (client-safe) ─────────────────────────────────────────

export function getWebsiteTemplateById(id: string): WebsiteTemplate | undefined {
  return WEBSITE_TEMPLATE_LIBRARY.find(t => t.id === id)
}

export function getFallbackTemplate(): WebsiteTemplate {
  return WEBSITE_TEMPLATE_LIBRARY.find(t => t.id === FALLBACK_TEMPLATE_ID)!
}

// Score a template against a text blob
function scoreTemplate(t: WebsiteTemplate, text: string): number {
  let score = 0
  // Exact id match
  if (text.includes(t.id)) score += 10
  // Label word matches
  for (const word of t.label.toLowerCase().split(/\s+/)) {
    if (word.length > 3 && text.includes(word)) score += 4
  }
  // Category match
  if (text.includes(t.category.toLowerCase())) score += 3
  // Industry matches
  for (const industry of t.industries) {
    if (text.includes(industry.toLowerCase())) score += 6
  }
  // Keyword matches
  for (const kw of t.keywords) {
    if (text.includes(kw.toLowerCase())) score += 2
  }
  return score
}

export function findTemplateLocally(input: {
  prompt?: string
  companyName?: string
  industry?: string
  sector?: string
}): WebsiteTemplate {
  const text = [
    input.prompt,
    input.companyName,
    input.industry,
    input.sector,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!text.trim()) return getFallbackTemplate()

  let best: WebsiteTemplate = getFallbackTemplate()
  let bestScore = 0

  for (const t of WEBSITE_TEMPLATE_LIBRARY) {
    const score = scoreTemplate(t, text)
    if (score > bestScore) {
      bestScore = score
      best = t
    }
  }

  return best
}

/**
 * Returns top-N candidate templates scored against input.
 * Always includes the fallback.
 * Use this to keep Claude's input small when library is large.
 */
export function getCandidateTemplatesForPrompt(
  input: {
    prompt?: string
    companyName?: string
    industry?: string
    sector?: string
  },
  limit = 20
): WebsiteTemplate[] {
  const text = [
    input.prompt,
    input.companyName,
    input.industry,
    input.sector,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const DEFAULT_SET = [
    'marketing-agency', 'saas-startup', 'jewellery', 'luxury-restaurant',
    'fitness-coach', 'real-estate', 'education-academy', 'salon',
    'dental-clinic', 'fashion-brand',
  ]

  if (!text.trim()) {
    const defaults = WEBSITE_TEMPLATE_LIBRARY.filter(t => DEFAULT_SET.includes(t.id))
    const others   = WEBSITE_TEMPLATE_LIBRARY.filter(t => !DEFAULT_SET.includes(t.id))
    return [...defaults, ...others].slice(0, limit)
  }

  const scored = WEBSITE_TEMPLATE_LIBRARY.map(t => ({
    template: t,
    score: scoreTemplate(t, text),
  }))

  scored.sort((a, b) => b.score - a.score)

  const top = scored.slice(0, limit).map(s => s.template)

  // Always include fallback
  if (!top.find(t => t.id === FALLBACK_TEMPLATE_ID)) {
    top.pop()
    top.push(getFallbackTemplate())
  }

  return top
}
