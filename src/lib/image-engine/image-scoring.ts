// src/lib/image-engine/image-scoring.ts
// Scores image candidates for suitability as a campaign poster background.

import type { SourceImageCandidate } from './types'

const MIN_IMAGE_SCORE = parseInt(process.env.MIN_IMAGE_SCORE ?? '68', 10)

export interface ScoredCandidate extends SourceImageCandidate {
  score: number
  scoreBreakdown: Record<string, number>
}

interface ScoringContext {
  templateId: string
  archetypeId: string
  industryId: string
  preferredOrientation: 'portrait' | 'landscape' | 'square'
  size: { width: number; height: number }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return null
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  }
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0.5
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
}

function isDark(hex: string): boolean {
  return getLuminance(hex) < 0.4
}

function isLight(hex: string): boolean {
  return getLuminance(hex) > 0.6
}

export function scoreCandidate(
  candidate: SourceImageCandidate,
  context: ScoringContext
): ScoredCandidate {
  const breakdown: Record<string, number> = {}
  let total = 0

  // 1. Resolution score (max 20 pts)
  const pixels = candidate.width * candidate.height
  const targetPixels = context.size.width * context.size.height
  const resolutionRatio = Math.min(pixels / Math.max(targetPixels, 1), 2)
  const resScore = Math.round(Math.min(resolutionRatio, 1) * 20)
  breakdown.resolution = resScore
  total += resScore

  // 2. Orientation match (max 15 pts)
  const orientMatch = candidate.orientation === context.preferredOrientation ? 15
    : context.preferredOrientation === 'square' ? 10
    : 5
  breakdown.orientation = orientMatch
  total += orientMatch

  // 3. Dark/light suitability (max 15 pts)
  const darkTemplates = ['dark_power_campaign', 'dark_agency_noir', 'founder_ambition', 'transformation_offer', 'bold_offer_card']
  const lightTemplates = ['care_wellness', 'clean_typography_offer', 'minimal_proof_card', 'clean_brand_audit']
  let darkLightScore = 8 // neutral
  if (darkTemplates.includes(context.templateId) && isDark(candidate.avgColor)) darkLightScore = 15
  if (darkTemplates.includes(context.templateId) && isLight(candidate.avgColor)) darkLightScore = 3
  if (lightTemplates.includes(context.templateId) && isLight(candidate.avgColor)) darkLightScore = 15
  if (lightTemplates.includes(context.templateId) && isDark(candidate.avgColor)) darkLightScore = 3
  breakdown.darkLight = darkLightScore
  total += darkLightScore

  // 4. Archetype relevance via query keyword match (max 20 pts)
  const archetypeQueryBoosts: Record<string, string[]> = {
    authority_power: ['dark', 'dramatic', 'cinematic', 'portrait', 'suit', 'silhouette', 'businessman'],
    premium_luxury: ['luxury', 'gold', 'elegant', 'editorial', 'silk', 'jewelry', 'jewellery'],
    care_ritual: ['soft', 'clean', 'white', 'wellness', 'calm', 'light', 'medical', 'clinic'],
    legacy_story: ['vintage', 'heritage', 'old', 'tradition', 'family', 'warm'],
    heritage_india: ['indian', 'heritage', 'ghat', 'historic', 'architecture', 'city india'],
    local_pride: ['street', 'local', 'market', 'city', 'india', 'shopfront'],
    founder_ambition: ['laptop', 'workspace', 'dark office', 'entrepreneur', 'startup'],
    transformation: ['athlete', 'fitness', 'motion', 'before after', 'energy'],
    celebration: ['festival', 'flowers', 'celebration', 'wedding', 'festive', 'joy'],
    craftsmanship: ['hands', 'craft', 'artisan', 'workshop', 'tool', 'detail', 'texture'],
  }

  const boostKeywords = archetypeQueryBoosts[context.archetypeId] ?? []
  const altLower = (candidate.alt ?? '').toLowerCase()
  const queryLower = (candidate.queryUsed ?? '').toLowerCase()
  const archScore = boostKeywords.some(k => altLower.includes(k) || queryLower.includes(k)) ? 20 : 8
  breakdown.archetypeRelevance = archScore
  total += archScore

  // 5. Template suitability (max 15 pts)
  const specialTemplateRules: Record<string, (c: SourceImageCandidate) => number> = {
    dark_power_campaign: (c) => {
      const dark = isDark(c.avgColor)
      const hasPortrait = /portrait|person|man|suit|business/i.test(c.alt ?? '')
      return dark && hasPortrait ? 15 : dark ? 10 : 5
    },
    heritage_city_campaign: (c) => {
      const hasHeritage = /heritage|historic|architecture|ghat|india|old city|building/i.test(c.alt ?? '')
      return hasHeritage ? 15 : 7
    },
    clean_typography_offer: (_c) => 12, // Text-only template — any image is OK, but less critical
    care_wellness: (c) => {
      const soft = isLight(c.avgColor)
      return soft ? 15 : 7
    },
    luxury_editorial: (c) => {
      const warm = /gold|warm|jewelry|jewellery|luxury|elegant/i.test(c.alt ?? '')
      return warm ? 15 : 8
    },
  }

  const templateScore = (specialTemplateRules[context.templateId] ?? (() => 10))(candidate)
  breakdown.templateSuitability = templateScore
  total += templateScore

  // 6. Premium mood suitability — penalize very busy/generic images (max 10 pts)
  const busyPenaltyKeywords = ['crowd', 'random people', 'generic', 'clipart', 'cartoon', 'illustration', 'watermark', 'logo', 'text', 'signage', 'billboard', 'poster', 'banner', 'korean', 'chinese', 'japanese']
  const premiumPenalty = busyPenaltyKeywords.some(k => altLower.includes(k)) ? -5 : 0
  const premiumBoost = /editorial|premium|luxury|minimal|cinematic/i.test(altLower) ? 5 : 0
  breakdown.premiumMood = 5 + premiumBoost + premiumPenalty
  total += breakdown.premiumMood

  // 7. Not-too-busy estimate — prefer images with empty space for text overlay (max 5 pts)
  // Heuristic: single-subject queries tend to have more space
  const singleSubjectTerms = ['portrait', 'close up', 'macro', 'detail', 'single', 'minimal', 'empty space', 'white background']
  const hasSpace = singleSubjectTerms.some(k => altLower.includes(k) || queryLower.includes(k))
  breakdown.emptySpace = hasSpace ? 5 : 2
  total += breakdown.emptySpace

  // Clamp to 0–100
  const finalScore = Math.max(0, Math.min(100, total))

  return { ...candidate, score: finalScore, scoreBreakdown: breakdown }
}

export function scoreAndRankCandidates(
  candidates: SourceImageCandidate[],
  context: ScoringContext
): ScoredCandidate[] {
  return candidates
    .map(c => scoreCandidate(c, context))
    .sort((a, b) => b.score - a.score)
}

function candidateSignature(candidate: SourceImageCandidate): string {
  const altKey = (candidate.alt || candidate.description || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 8)
    .join(' ')
  const ratioKey = candidate.height > 0 ? (candidate.width / candidate.height).toFixed(1) : '0'
  return `${candidate.source}:${candidate.id || altKey}:${ratioKey}`
}

export function pickTopCandidates(
  candidates: SourceImageCandidate[],
  context: ScoringContext,
  limit = 4,
  minScore = MIN_IMAGE_SCORE
): ScoredCandidate[] {
  const ranked = scoreAndRankCandidates(candidates, context)
  const seen = new Set<string>()
  const picked: ScoredCandidate[] = []

  for (const candidate of ranked) {
    if (candidate.score < minScore) continue
    const signature = candidateSignature(candidate)
    if (seen.has(signature)) continue
    seen.add(signature)
    picked.push(candidate)
    if (picked.length >= limit) break
  }

  return picked
}

export function pickBestCandidate(
  candidates: SourceImageCandidate[],
  context: ScoringContext
): { candidate: ScoredCandidate | null; meetsThreshold: boolean } {
  if (candidates.length === 0) return { candidate: null, meetsThreshold: false }
  const ranked = scoreAndRankCandidates(candidates, context)
  const best = ranked[0]
  return { candidate: best, meetsThreshold: best.score >= MIN_IMAGE_SCORE }
}

export { MIN_IMAGE_SCORE }
