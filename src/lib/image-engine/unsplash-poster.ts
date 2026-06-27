// src/lib/image-engine/unsplash-poster.ts
// Searches Unsplash for campaign poster background images.
// Used as fallback when Pexels fails or returns low-scoring candidates.

import type { SourceImageCandidate, ImageSourceInput } from './types'

const UNSPLASH_API = 'https://api.unsplash.com/search/photos'

interface UnsplashSearchResult {
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

function buildAttributionText(name: string): string {
  return `Photo by ${name} on Unsplash`
}

function buildAttributionUrl(username: string): string {
  return `https://unsplash.com/@${username}?utm_source=brand_syndicate&utm_medium=referral`
}

export async function searchUnsplashForPoster(
  input: ImageSourceInput
): Promise<UnsplashSearchResult> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    return { success: false, candidates: [], failureReason: 'UNSPLASH_ACCESS_KEY not configured' }
  }

  const { imageQueries, preferredOrientation, negativeKeywords = [] } = input
  const allCandidates: SourceImageCandidate[] = []
  const seen = new Set<string>()

  const unsplashOrientation =
    preferredOrientation === 'portrait' ? 'portrait'
    : preferredOrientation === 'landscape' ? 'landscape'
    : 'portrait' // default for instagram_post_4x5

  const queries = imageQueries.slice(0, 6)

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        query,
        per_page: '8',
        orientation: unsplashOrientation,
        order_by: 'relevant',
        content_filter: 'high',
      })

      const res = await fetch(`${UNSPLASH_API}?${params}`, {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        console.warn(`[unsplash-poster] Query "${query}" failed: ${res.status}`)
        continue
      }

      const data = await res.json() as {
        results: Array<{
          id: string
          width: number
          height: number
          color: string
          description: string | null
          alt_description: string | null
          user: {
            name: string
            username: string
            links: { html: string }
          }
          urls: {
            raw: string
            full: string
            regular: string
            small: string
            thumb: string
          }
          links: { html: string; download: string }
        }>
      }

      for (const photo of data.results ?? []) {
        // Prefer 'full' for large sizes, 'regular' for smaller
        const url = photo.urls?.full ?? photo.urls?.raw ?? photo.urls?.regular
        if (!url || seen.has(photo.id)) continue
        seen.add(photo.id)

        const altText = photo.alt_description ?? photo.description ?? ''
        const altLower = altText.toLowerCase()
        if (negativeKeywords.some(kw => altLower.includes(kw.toLowerCase()))) continue

        const username = photo.user?.username ?? 'unknown'
        const candidate: SourceImageCandidate = {
          id: photo.id,
          source: 'unsplash',
          url,
          previewUrl: photo.urls?.regular ?? photo.urls?.small ?? url,
          downloadUrl: url,
          width: photo.width,
          height: photo.height,
          avgColor: photo.color ?? '#888888',
          alt: altText,
          description: altText,
          photographer: photo.user?.name ?? 'Unknown',
          photographerUrl: `${photo.user?.links?.html ?? `https://unsplash.com/@${username}`}?utm_source=brand_syndicate&utm_medium=referral`,
          attributionText: buildAttributionText(photo.user?.name ?? 'Unknown'),
          attributionUrl: buildAttributionUrl(username),
          queryUsed: query,
          orientation: normalizeOrientation(photo.width, photo.height),
          raw: photo,
        }
        allCandidates.push(candidate)
      }
    } catch (err) {
      console.warn(`[unsplash-poster] Query "${query}" threw:`, err)
      // Never throw route-breaking errors
    }
  }

  if (allCandidates.length === 0) {
    return {
      success: false,
      candidates: [],
      failureReason: 'No Unsplash candidates found for any query',
    }
  }

  return { success: true, candidates: allCandidates }
}
