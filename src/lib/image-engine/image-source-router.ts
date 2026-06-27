// src/lib/image-engine/image-source-router.ts
// Orchestrates Pexels → Unsplash fallback image search with scoring.
// No Pinterest. No SVG fallback. No OpenAI fallback.

import { searchPexelsForPoster } from './pexels-poster'
import { searchUnsplashForPoster } from './unsplash-poster'
import { pickTopCandidates, MIN_IMAGE_SCORE } from './image-scoring'
import type { SourceImageCandidate, ImageSourceInput, ImageSourceId } from './types'
import { getSizeById } from './sizes'

export interface ImageSourceResult {
  success: boolean
  selected: ImageSourceId
  candidate: SourceImageCandidate | null
  // Up to 4 ranked, non-duplicate candidates for multi-variation rendering.
  // candidate is kept as candidates[0] for full backwards compatibility.
  candidates: SourceImageCandidate[]
  attempts: Array<{
    source: ImageSourceId
    tried: boolean
    candidateCount: number
    bestScore: number
    failureReason?: string
  }>
  failureReasons: string[]
}

function getPreferredOrientation(sizeId: string): 'portrait' | 'landscape' | 'square' {
  const size = getSizeById(sizeId)
  if (!size) return 'portrait'
  const ratio = size.width / size.height
  if (ratio > 1.15) return 'landscape'
  if (ratio < 0.87) return 'portrait'
  return 'square'
}

function dedupeCandidates(candidates: SourceImageCandidate[], limit = 4): SourceImageCandidate[] {
  const seen = new Set<string>()
  const out: SourceImageCandidate[] = []
  for (const candidate of candidates) {
    const key = `${candidate.source}:${candidate.id || candidate.url}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(candidate)
    if (out.length >= limit) break
  }
  return out
}

export async function findBestCampaignImage(
  input: ImageSourceInput & {
    templateId?: string
    archetypeId?: string
    sizeId?: string
    limit?: number
  }
): Promise<ImageSourceResult> {
  const order = (process.env.DEFAULT_IMAGE_SOURCE_ORDER ?? 'pexels,unsplash')
    .split(',').map(s => s.trim()) as ImageSourceId[]

  const preferredOrientation = getPreferredOrientation(input.sizeId ?? 'instagram_post_4x5')
  const size = getSizeById(input.sizeId ?? 'instagram_post_4x5')
  const limit = Math.max(1, Math.min(input.limit ?? 4, 4))

  const scoringContext = {
    templateId: input.templateId ?? 'luxury_editorial',
    archetypeId: input.archetypeId ?? 'premium_luxury',
    industryId: input.industry ?? 'local_retail_store',
    preferredOrientation,
    size: { width: size.width, height: size.height },
  }

  const attempts: ImageSourceResult['attempts'] = []
  const failureReasons: string[] = []
  const selectedCandidates: SourceImageCandidate[] = []

  for (const source of order) {
    if (selectedCandidates.length >= limit) break

    if (source === 'pexels') {
      try {
        const result = await searchPexelsForPoster({ ...input, preferredOrientation })
        if (!result.success || result.candidates.length === 0) {
          attempts.push({ source: 'pexels', tried: true, candidateCount: 0, bestScore: 0, failureReason: result.failureReason })
          failureReasons.push(`Pexels: ${result.failureReason ?? 'no results'}`)
          continue
        }

        const ranked = pickTopCandidates(result.candidates, scoringContext, limit, MIN_IMAGE_SCORE)
        const bestScore = ranked[0]?.score ?? 0
        attempts.push({ source: 'pexels', tried: true, candidateCount: result.candidates.length, bestScore })

        if (ranked.length > 0) {
          selectedCandidates.push(...ranked)
        }

        if (selectedCandidates.length < limit) {
          failureReasons.push(`Pexels: selected ${ranked.length}/${limit} strong candidates, trying Unsplash for more variation`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        attempts.push({ source: 'pexels', tried: true, candidateCount: 0, bestScore: 0, failureReason: msg })
        failureReasons.push(`Pexels threw: ${msg}`)
      }
    }

    if (source === 'unsplash') {
      try {
        const result = await searchUnsplashForPoster({ ...input, preferredOrientation })
        if (!result.success || result.candidates.length === 0) {
          attempts.push({ source: 'unsplash', tried: true, candidateCount: 0, bestScore: 0, failureReason: result.failureReason })
          failureReasons.push(`Unsplash: ${result.failureReason ?? 'no results'}`)
          continue
        }

        // Unsplash is fallback, but still enforce a quality gate so weak/random images do not slip in.
        const minScore = selectedCandidates.length === 0 ? Math.max(58, MIN_IMAGE_SCORE - 8) : Math.max(55, MIN_IMAGE_SCORE - 10)
        const ranked = pickTopCandidates(result.candidates, scoringContext, limit - selectedCandidates.length, minScore)
        const bestScore = ranked[0]?.score ?? 0
        attempts.push({ source: 'unsplash', tried: true, candidateCount: result.candidates.length, bestScore })

        if (ranked.length > 0) {
          selectedCandidates.push(...ranked)
        } else {
          failureReasons.push(`Unsplash: no usable candidate`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        attempts.push({ source: 'unsplash', tried: true, candidateCount: 0, bestScore: 0, failureReason: msg })
        failureReasons.push(`Unsplash threw: ${msg}`)
      }
    }
  }

  const candidates = dedupeCandidates(selectedCandidates, limit)
  const candidate = candidates[0] ?? null

  if (candidate) {
    return {
      success: true,
      selected: candidate.source,
      candidate,
      candidates,
      attempts,
      failureReasons,
    }
  }

  return {
    success: false,
    selected: 'none',
    candidate: null,
    candidates: [],
    attempts,
    failureReasons,
  }
}
