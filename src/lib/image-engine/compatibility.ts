// src/lib/image-engine/compatibility.ts
// Maps the internal CampaignPosterResult to the exact response shape
// that the existing frontend expects: { graphics: [...] }
// The frontend currently reads:
//   graphics[0].imageDataUri  (was data URI — now set to finalPosterUrl or raw image URL)
//   graphics[0].svgDataUri    (was SVG data URI — set to null)
//   graphics[0].source        (was 'gpt-image-1' or 'claude-svg' — now 'pexels'/'unsplash')
//   graphics[0].type          (was 'social' — now 'campaign-poster')
//   graphics[0].title
//   graphics[0].description

import type { CampaignPosterResult } from './types'

export interface FrontendGraphicItem {
  type: string
  title: string
  description: string
  imageDataUri: string | null
  svgDataUri: null
  source: string
  imageUrl: string | null
  previewImageUrl: string | null
  finalPosterUrl: string | null
  rendered: boolean
  renderContract?: unknown
  attribution?: {
    photographer: string
    photographerUrl: string
    text: string
    url: string
  }
  generationId?: string
  imageSourceFlow?: unknown
  qualityWarnings?: string[]
}

export interface FrontendGraphicsResponse {
  graphics: FrontendGraphicItem[]
}

export function toFrontendResponse(result: CampaignPosterResult): FrontendGraphicsResponse {
  // imageDataUri: frontend uses this as <img src=...>
  // If we have a finalPosterUrl (local path or Cloudinary URL), use it.
  // Never fall back to a raw stock/original image in the user UI.
  // If the renderer did not produce a poster, return null so the API can use a safe fallback.
  const displayUrl = result.finalPosterUrl ?? (result.rendered ? result.imageUrl : null) ?? null

  const item: FrontendGraphicItem = {
    type: 'campaign-poster',
    title: result.creativeOutput?.headline ?? 'Campaign Poster',
    description: result.creativeOutput?.subheadline ?? 'AI-powered campaign poster',
    // imageDataUri is what the existing frontend renders — point it at our poster URL
    imageDataUri: displayUrl,
    svgDataUri: null, // No SVG fallback per spec
    source: result.source,
    imageUrl: displayUrl,
    previewImageUrl: displayUrl,
    finalPosterUrl: result.finalPosterUrl,
    rendered: result.rendered,
    renderContract: result.renderContract,
    attribution: result.attribution,
    generationId: result.generationId,
    imageSourceFlow: result.imageSourceFlow,
    qualityWarnings: result.qualityWarnings,
  }

  return { graphics: [item] }
}

export function toNoImageResponse(reason: string): FrontendGraphicsResponse {
  return {
    graphics: [{
      type: 'campaign-poster',
      title: 'Poster Generation',
      description: reason,
      imageDataUri: null,
      svgDataUri: null,
      source: 'no-image-available',
      imageUrl: null,
      previewImageUrl: null,
      finalPosterUrl: null,
      rendered: false,
      qualityWarnings: [reason],
    }],
  }
}
