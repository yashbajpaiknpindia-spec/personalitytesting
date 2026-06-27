// src/app/api/rerender-poster/route.ts
// Re-renders an already-generated poster at a new canvas size.
//
// Takes the existing renderContract (has all brand data, copy, background image,
// template, colors) and re-runs the Sharp renderer at the new dimensions.
//
// Zero AI calls. Zero external API calls. No Pexels/Unsplash.
// Only cost is CPU time on your own server (~1–2s per render).
//
// POST /api/rerender-poster
//   body: {
//     renderContract: RenderContract   — from the existing generated image
//     sizeId: string                   — key from POSTER_SIZES e.g. 'instagram_story_9x16'
//   }
// Returns: { imageDataUri: string } | { error: string }

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { renderPosterToPng } from '@/lib/image-engine/renderer/render-poster'
import { getSizeById, POSTER_SIZES } from '@/lib/image-engine/sizes'
import type { RenderContract } from '@/lib/image-engine/types'


import { validateCreativeOutput } from '@/lib/image-engine/validation'

function sanitizeContractText(contract: any) {
  const brandName = contract?.brandName ?? 'Brand'
  const creative = {
    headline: contract.headline,
    subheadline: contract.subheadline,
    bodyCopy: contract.bodyCopy,
    cta: contract.cta,
    // Add dummy values for required CreativeDirectorOutput fields
    industry: '',
    campaignArchetype: '',
    selectedTemplate: '',
    selectedSize: '',
    templateVariation: 'A',
    visualMetaphor: '',
    sceneDirection: '',
    imageQueries: [],
    serviceTags: [],
    colorPalette: { background: '', text: '', accent: '' },
    typographyMood: '',
    imageDirection: '',
    negativeKeywords: [],
    confidence: 0
  }
  
  const { modified } = validateCreativeOutput(creative as any, brandName)
  if (modified.headline) contract.headline = modified.headline
  if (modified.subheadline) contract.subheadline = modified.subheadline
  if (modified.cta) contract.cta = modified.cta
  
  return contract
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Compute fontScale + aspectClass from width/height
// These are required by the renderer for proper landscape/portrait/wide sizing.
// Contracts built before this feature may not have them — we always recompute here.
function computeSizeExtras(width: number, height: number): { fontScale: number; aspectClass: string } {
  const ar = width / height
  const aspectClass =
    ar < 0.85  ? 'portrait'
    : ar < 1.15 ? 'square'
    : ar < 1.6  ? 'landscape'
    : 'wide'
  // fontScale tuned per aspect class — matches what rerender-graphics uses
  const fontScale =
    aspectClass === 'wide'      ? 0.72
    : aspectClass === 'landscape' ? 0.85
    : aspectClass === 'square'    ? 0.97
    : 1.0
  return { fontScale, aspectClass }
}

export async function POST(req: NextRequest) {
  // Auth check — must be logged in
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { renderContract?: unknown; sizeId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { renderContract: rawContract, sizeId } = body

  if (!rawContract || typeof rawContract !== 'object') {
    return NextResponse.json({ error: 'renderContract is required' }, { status: 400 })
  }
  if (!sizeId || typeof sizeId !== 'string') {
    return NextResponse.json({ error: 'sizeId is required' }, { status: 400 })
  }
  if (!POSTER_SIZES[sizeId]) {
    return NextResponse.json(
      { error: `Unknown sizeId: ${sizeId}. Valid: ${Object.keys(POSTER_SIZES).join(', ')}` },
      { status: 400 }
    )
  }

  const contract = sanitizeContractText(rawContract as RenderContract)
  const newSize = getSizeById(sizeId)
  const { fontScale, aspectClass } = computeSizeExtras(newSize.width, newSize.height)

  // Build the updated render contract:
  // - Swap in the new size (dimensions, margins, font limits)
  // - Keep EVERYTHING else: headline, subheadline, CTA, colors, template,
  //   background image URL, effects, brand name, watermark — all unchanged.
  // The renderer recalculates all font sizes, text positions, line wrapping,
  // and layout from scratch using the new W×H, so nothing gets cut off.
  const updatedContract: RenderContract = {
    ...contract,
    size: {
      ...newSize,
      // Inject computed layout helpers — renderer needs these for H-based font caps
      fontScale,
      aspectClass,
    } as RenderContract['size'],
  }

  // Use a unique render ID so export-poster saves with a distinct filename
  const renderId = `resize_${session.user.id}_${sizeId}_${Date.now()}`

  try {
    const result = await renderPosterToPng(updatedContract, renderId)

    if (!result.success || !result.finalPosterUrl) {
      console.error('[rerender-poster] Render failed:', result.failureReason)
      return NextResponse.json(
        { error: result.failureReason ?? 'Render failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      imageDataUri: result.finalPosterUrl,
      sizeId,
      width:  newSize.width,
      height: newSize.height,
      label:  newSize.label,
      storageType: result.storageType,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[rerender-poster] Unexpected error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
