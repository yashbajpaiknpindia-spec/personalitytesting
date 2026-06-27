// src/lib/image-engine/pexels-poster.ts
// Searches Pexels for campaign poster background images.
// Completely isolated from the existing src/lib/ai/pexels.ts (which serves website generation).

import type { SourceImageCandidate, ImageSourceInput } from './types'

const PEXELS_API = 'https://api.pexels.com/v1/search'

interface PexelsSearchResult {
  success: boolean
  candidates: SourceImageCandidate[]
  failureReason?: string
}

function normalizeOrientation(w: number, h: number): 'portrait' | 'landscape' | 'square' {
  const ratio = w / h
  if (ratio > 1.15) return 'landscape'
  if (ratio < 0.87) return 'portrait'
  return 'square'
}

function buildAttributionText(photographer: string): string {
  return `Photo by ${photographer} on Pexels`
}

export async function searchPexelsForPoster(
  input: ImageSourceInput
): Promise<PexelsSearchResult> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) {
    return { success: false, candidates: [], failureReason: 'PEXELS_API_KEY not configured' }
  }

  const { imageQueries, preferredOrientation, negativeKeywords = [] } = input
  const allCandidates: SourceImageCandidate[] = []
  const seen = new Set<string>()

  const pexelsOrientation =
    preferredOrientation === 'portrait' ? 'portrait'
    : preferredOrientation === 'landscape' ? 'landscape'
    : 'portrait' // default for instagram_post_4x5

  // Search up to 6 queries
  const queries = imageQueries.slice(0, 6)

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        query,
        per_page: '8',
        orientation: pexelsOrientation,
        size: 'large',
      })

      const res = await fetch(`${PEXELS_API}?${params}`, {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        console.warn(`[pexels-poster] Query "${query}" failed: ${res.status}`)
        continue
      }

      const data = await res.json() as {
        photos: Array<{
          id: number
          width: number
          height: number
          avg_color: string
          alt: string
          photographer: string
          photographer_url: string
          src: Record<string, string>
        }>
      }

      for (const photo of data.photos ?? []) {
        const url = photo.src?.large2x ?? photo.src?.large ?? photo.src?.original
        if (!url || seen.has(url)) continue
        seen.add(url)

        // Basic negative keyword filter on alt text
        const altLower = (photo.alt ?? '').toLowerCase()
        if (negativeKeywords.some(kw => altLower.includes(kw.toLowerCase()))) continue

        const candidate: SourceImageCandidate = {
          id: String(photo.id),
          source: 'pexels',
          url,
          previewUrl: photo.src?.medium ?? photo.src?.small ?? url,
          downloadUrl: url,
          width: photo.width,
          height: photo.height,
          avgColor: photo.avg_color ?? '#888888',
          alt: photo.alt ?? '',
          description: photo.alt ?? '',
          photographer: photo.photographer ?? '',
          photographerUrl: photo.photographer_url ?? 'https://www.pexels.com',
          attributionText: buildAttributionText(photo.photographer ?? 'Unknown'),
          attributionUrl: photo.photographer_url ?? 'https://www.pexels.com',
          queryUsed: query,
          orientation: normalizeOrientation(photo.width, photo.height),
          raw: photo,
        }
        allCandidates.push(candidate)
      }
    } catch (err) {
      console.warn(`[pexels-poster] Query "${query}" threw:`, err)
      // Continue to next query — never throw route-breaking errors
    }
  }

  if (allCandidates.length === 0) {
    return {
      success: false,
      candidates: [],
      failureReason: 'No Pexels candidates found for any query',
    }
  }

  return { success: true, candidates: allCandidates }
}
