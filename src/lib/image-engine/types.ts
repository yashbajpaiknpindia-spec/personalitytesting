// src/lib/image-engine/types.ts
// Core type definitions for the BrandSyndicate campaign poster engine.
// These are shared across creative-director, image-source, renderer, and route layers.

export type ImageSourceId = 'pexels' | 'unsplash' | 'none'

export type ExportFormat = 'png' | 'jpg'

// ── Canonical candidate returned by any image source ─────────────────────────
export interface SourceImageCandidate {
  id: string
  source: ImageSourceId
  url: string               // Full-resolution download URL
  previewUrl: string        // Smaller preview URL
  downloadUrl: string       // Same as url for most sources
  width: number
  height: number
  avgColor: string          // hex e.g. "#3a2c1f"
  alt: string
  description: string
  photographer: string
  photographerUrl: string
  attributionText: string   // e.g. "Photo by John Doe on Pexels"
  attributionUrl: string
  queryUsed: string
  orientation: 'portrait' | 'landscape' | 'square'
  score?: number
  raw?: unknown
}

// ── Creative Director output ──────────────────────────────────────────────────
export interface CreativeDirectorOutput {
  industry: string
  campaignArchetype: string
  selectedTemplate: string
  selectedSize: string
  templateVariation: 'A' | 'B' | 'C'
  visualMetaphor: string
  sceneDirection: string
  imageQueries: string[]
  headline: string
  subheadline: string
  bodyCopy: string
  cta: string
  serviceTags: string[]
  colorPalette: {
    background: string
    text: string
    accent: string
    secondary?: string
  }
  typographyMood: string
  imageDirection: string
  negativeKeywords: string[]
  confidence: number
}

// ── Image source search input ─────────────────────────────────────────────────
export interface ImageSourceInput {
  imageQueries: string[]
  negativeKeywords?: string[]
  preferredOrientation?: 'portrait' | 'landscape' | 'square'
  industry?: string
  archetype?: string
  templateId?: string
  size?: { width: number; height: number }
}

// ── Render contract ───────────────────────────────────────────────────────────
export interface BackgroundImageContract {
  source: ImageSourceId
  url: string
  previewUrl: string
  // cleanBackgroundUrl: permanently-hosted copy of the RAW stock photo (no text baked in).
  // Set after first render. Used by rerender-poster and edit-poster as the background source
  // so re-renders never accidentally use a text-baked finalPosterUrl as the background.
  cleanBackgroundUrl?: string
  // permanentUrl: DEPRECATED — was incorrectly set to finalPosterUrl (text-baked) which
  // caused double-text on every resize/re-render. Kept for old stored contracts only.
  // The renderer now uses cleanBackgroundUrl ?? url — NOT permanentUrl.
  permanentUrl?: string
  width: number
  height: number
  photographer: string
  photographerUrl: string
  attributionText: string
  attributionUrl: string
  queryUsed: string
}

export interface RenderContract {
  size: {
    id: string
    width: number
    height: number
    safeMargin: number
    fontScale: number        // from PosterSize.recommendedFontScale — applies to all font sizes
    aspectClass: 'portrait' | 'square' | 'landscape' | 'wide'  // derived from W/H ratio
  }
  templateId: string
  variation: 'A' | 'B' | 'C'
  backgroundImage: BackgroundImageContract | null
  effects: string[]
  brandName: string
  logoUrl?: string
  headline: string
  subheadline: string
  bodyCopy: string
  cta: string
  serviceTags: string[]
  colors: {
    background: string
    text: string
    accent: string
    secondary?: string
  }
  watermark: {
    show: boolean
    text: string
    color1: string
    color2: string
  }
  attribution: {
    show: boolean
    text: string
    url: string
  }
  exportFormat: ExportFormat
  imageSourceFlow: {
    selected: ImageSourceId
    attempts: Array<{ source: ImageSourceId; tried: boolean; candidateCount: number; bestScore: number }>
    failureReasons: string[]
  }
  qualityWarnings: string[]
}

// ── Renderer output ───────────────────────────────────────────────────────────
export interface RenderedPoster {
  success: boolean
  finalPosterUrl: string | null
  storageType: 'cloudinary' | 'local' | 'base64' | 'fallback-raw'
  rendererUsed: string
  failureReason?: string
}

// ── Full pipeline result ──────────────────────────────────────────────────────
export interface CampaignPosterResult {
  success: boolean
  generationId: string
  imageUrl: string | null
  previewImageUrl: string | null
  finalPosterUrl: string | null
  rendered: boolean
  source: ImageSourceId
  renderContract: RenderContract
  creativeOutput: CreativeDirectorOutput
  attribution: {
    photographer: string
    photographerUrl: string
    text: string
    url: string
  }
  imageSourceFlow: RenderContract['imageSourceFlow']
  qualityWarnings: string[]
  costEstimate: {
    pexelsCost: number
    unsplashCost: number
    rendererCost: number
    paidImageApiUsed: boolean
    estimatedTotalCostUsd: number
  }
  error?: string
}
