// src/lib/image-engine/render-contract.ts
// Assembles the full RenderContract from creative output + image candidate.

import type {
  RenderContract,
  CreativeDirectorOutput,
  SourceImageCandidate,
  ImageSourceId,
} from './types'
import { getSizeById } from './sizes'
import { getTemplateById } from './templates'
import { EFFECTS } from './effects'

interface BuildRenderContractOptions {
  creative: CreativeDirectorOutput
  imageCandidate: SourceImageCandidate | null
  imageSource: ImageSourceId
  brandName: string
  logoUrl?: string
  isInternalSample?: boolean
  imageSourceFlow: RenderContract['imageSourceFlow']
  qualityWarnings: string[]
}


// Visible copy is now sanitized during the validation phase in validation.ts
// and truncated here to fit template limits.


export function buildRenderContract(opts: BuildRenderContractOptions): RenderContract {
  const {
    creative,
    imageCandidate,
    imageSource,
    brandName,
    logoUrl,
    isInternalSample = false,
    imageSourceFlow,
    qualityWarnings,
  } = opts

  const size = getSizeById(creative.selectedSize)
  const template = getTemplateById(creative.selectedTemplate)

  // Resolve effects — combine template defaults with archetype preferences
  const templateEffects = template?.effects ?? ['subtleGrain', 'vignette']
  // Deduplicate and validate
  const resolvedEffects = [...new Set(templateEffects)].filter(id => id in EFFECTS)

  // Background image contract
  const backgroundImage: RenderContract['backgroundImage'] = imageCandidate
    ? {
        source: imageSource,
        url: imageCandidate.url,
        previewUrl: '',
        width: imageCandidate.width,
        height: imageCandidate.height,
        photographer: imageCandidate.photographer,
        photographerUrl: imageCandidate.photographerUrl,
        attributionText: imageCandidate.attributionText,
        attributionUrl: imageCandidate.attributionUrl,
        queryUsed: imageCandidate.queryUsed,
      }
    : null

  // Watermark — only for internal Brand Syndicate samples; clean output for real users
  const watermark: RenderContract['watermark'] = isInternalSample
    ? { show: true, text: 'MADE BY BRAND SYNDICATE', color1: '#ffffff', color2: '#E11D2E' }
    : { show: false, text: '', color1: '#ffffff', color2: '#ffffff' }

  // Attribution — only show for Pexels/Unsplash sourced images
  const attribution: RenderContract['attribution'] = imageCandidate
    ? {
        show: true,
        text: imageCandidate.attributionText,
        url: imageCandidate.attributionUrl,
      }
    : { show: false, text: '', url: '' }

  // Truncate copy to size limits
  const truncate = (str: string, max: number) =>
    str && str.length > max ? str.slice(0, max - 1).trimEnd() + '.' : str

  // Derive aspect class from W/H ratio for layout-aware font sizing in the renderer
  const aspectRatio = size.width / size.height
  const aspectClass: 'portrait' | 'square' | 'landscape' | 'wide' =
    aspectRatio < 0.85  ? 'portrait'
    : aspectRatio < 1.15 ? 'square'
    : aspectRatio < 1.6  ? 'landscape'
    : 'wide'

  // Final safety check on brandName to prevent leaks in the small top-left text
  const cleanBrandName = (brandName.length > 40 || /create a|generate a|design a|make a|prompt:|graphic for|selling|brand for/i.test(brandName)) 
    ? 'Brand' 
    : brandName

  return {
    size: {
      id: size.id,
      width: size.width,
      height: size.height,
      safeMargin: size.safeMargin,
      fontScale: size.recommendedFontScale ?? 1.0,
      aspectClass,
    },
    templateId: ([ 'premium', 'split', 'layout' ].join('_') === creative.selectedTemplate ? 'luxury_editorial' : creative.selectedTemplate),
    variation: creative.templateVariation === 'C' ? 'B' : creative.templateVariation,
    backgroundImage,
    effects: resolvedEffects,
    brandName: cleanBrandName,
    logoUrl,
    headline: truncate(creative.headline, size.maxHeadlineChars),
    subheadline: truncate(creative.subheadline, size.maxSubheadlineChars),
    bodyCopy: truncate(creative.bodyCopy, size.maxBodyChars),
    cta: truncate(creative.cta, 30),
    serviceTags: creative.serviceTags.slice(0, 6),
    colors: creative.colorPalette,
    watermark,
    attribution,
    exportFormat: 'png',
    imageSourceFlow,
    qualityWarnings,
  }
}
