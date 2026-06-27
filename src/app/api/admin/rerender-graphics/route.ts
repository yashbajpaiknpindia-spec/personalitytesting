// src/app/api/admin/rerender-graphics/route.ts
// Backfill tool: re-renders campaign-image generations with the Sharp renderer.
//
// POST /api/admin/rerender-graphics
//   body: {
//     dryRun?:       boolean   — scan only, no writes (default false)
//     limit?:        number    — max batch (default 50, max 200)
//     generationId?: string    — target a single generation
//     variationIndex?: number   — target one image inside outputData.graphics/variations
//     forceAll?:     boolean   — re-render ALL campaign images, even already-rendered ones
//   }
// GET  /api/admin/rerender-graphics  — quick scan counts (no writes)
//
// Returns: { processed, succeeded, failed, skipped, forceAll, results[] }

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { renderPosterToPng } from '@/lib/image-engine/renderer/render-poster'
import type { RenderContract } from '@/lib/image-engine/types'
import { validateCreativeOutput } from '@/lib/image-engine/validation'


function sanitizeContractText(contract: any) {
  const brandName = contract?.brandName ?? 'Brand'
  const creative = {
    headline: contract.headline,
    subheadline: contract.subheadline,
    bodyCopy: contract.bodyCopy,
    cta: contract.cta,
    industry: '', campaignArchetype: '', selectedTemplate: '', selectedSize: '',
    templateVariation: 'A', visualMetaphor: '', sceneDirection: '', imageQueries: [],
    serviceTags: [], colorPalette: { background: '', text: '', accent: '' },
    typographyMood: '', imageDirection: '', negativeKeywords: [], confidence: 0
  }
  const { modified } = validateCreativeOutput(creative as any, brandName)
  if (modified.headline) contract.headline = modified.headline
  if (modified.subheadline) contract.subheadline = modified.subheadline
  if (modified.cta) contract.cta = modified.cta
  return contract
}

export const dynamic = 'force-dynamic'
export const maxDuration = 300  // 5 min

interface RerenderResult {
  generationId: string
  companyName: string
  before: string | null
  after: string | null
  success: boolean
  reason?: string
  skipped?: boolean
  wasAlreadyRendered?: boolean
}

// ── Auth helper ───────────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  return user?.role === 'ADMIN' ? user : null
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const dryRun:     boolean       = body.dryRun    === true
  const forceAll:   boolean       = body.forceAll   === true
  const limit:      number        = Math.min(500, parseInt(body.limit ?? '50', 10) || 50)
  const singleId:   string | null = body.generationId ?? null
  const variationIndex: number | null = Number.isInteger(body.variationIndex) ? body.variationIndex : null

  // ── Query ────────────────────────────────────────────────────────────────
  const where = singleId ? { id: singleId } : { status: 'COMPLETE' as const }

  const generations = await db.generation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: singleId ? 1 : limit + 200,
    select: { id: true, outputData: true, inputData: true },
  })

  // Filter to campaign-image type that have a renderContract
  const campaignImages = generations.filter(g => {
    const od = g.outputData as Record<string, unknown> | null
    if (!od || od.genType !== 'campaign-image') return false
    const hasRootContract = !!od.renderContract && typeof od.renderContract === 'object'
    const hasVariationContract = [od.graphics, od.variations].some((list: any) =>
      Array.isArray(list) && list.some((item: any) => item?.renderContract && typeof item.renderContract === 'object')
    )
    return hasRootContract || hasVariationContract
  })

  // Split into already-rendered vs needs-backfill
  const needsBackfill = campaignImages.filter(g => {
    const rendering = ((g.outputData as Record<string, unknown>).rendering) as Record<string, unknown> | null
    return rendering?.rendered !== true
  })
  const alreadyRendered = campaignImages.filter(g => {
    const rendering = ((g.outputData as Record<string, unknown>).rendering) as Record<string, unknown> | null
    return rendering?.rendered === true
  })

  // variationIndex + generationId → process exactly one image variation inside one generation.
  // forceAll → process everything; otherwise only unrendered
  const targets = variationIndex !== null && singleId
    ? campaignImages.slice(0, 1)
    : forceAll
      ? campaignImages.slice(0, limit)
      : needsBackfill.slice(0, limit)

  if (targets.length === 0) {
    return NextResponse.json({
      processed: 0, succeeded: 0, failed: 0, skipped: 0, forceAll,
      results: [],
      message: forceAll
        ? 'No campaign-image generations found.'
        : 'No unrendered campaign-image generations found. Use forceAll=true to re-render all.',
      scanSummary: {
        total_campaign_images: campaignImages.length,
        already_rendered: alreadyRendered.length,
        needs_backfill: needsBackfill.length,
      },
    })
  }

  if (dryRun) {
    return NextResponse.json({
      processed: 0, succeeded: 0, failed: 0, skipped: targets.length, forceAll,
      dryRun: true,
      results: targets.map(g => {
        const od = g.outputData as Record<string, unknown>
        const input = g.inputData as Record<string, unknown>
        const rendering = od.rendering as Record<string, unknown> | null
        return {
          generationId: g.id,
          companyName: (input?.companyName ?? input?.businessName ?? 'Unknown') as string,
          before: (od.rawImageUrl ?? od.imageUrl ?? null) as string | null,
          after: null, success: false, skipped: true, reason: 'dry-run',
          wasAlreadyRendered: rendering?.rendered === true,
        }
      }),
      message: `Dry run: ${targets.length} generations would be re-rendered (forceAll=${forceAll}).`,
      scanSummary: {
        total_campaign_images: campaignImages.length,
        already_rendered: alreadyRendered.length,
        needs_backfill: needsBackfill.length,
      },
    })
  }

  // ── Process ──────────────────────────────────────────────────────────────
  const results: RerenderResult[] = []
  let succeeded = 0
  let failed = 0

  for (const gen of targets) {
    const od = gen.outputData as Record<string, unknown>
    const input = gen.inputData as Record<string, unknown>
    const companyName = (input?.companyName ?? input?.businessName ?? 'Unknown') as string
    const graphics = Array.isArray((od as any).graphics) ? ([...(od as any).graphics] as any[]) : []
    const variations = Array.isArray((od as any).variations) ? ([...(od as any).variations] as any[]) : []
    const sourceGraphics = graphics.length ? graphics : variations
    const selectedGraphic = variationIndex !== null ? sourceGraphics[variationIndex] : null
    const rawImageUrl = (
      selectedGraphic?.renderContract?.backgroundImage?.cleanBackgroundUrl ??
      selectedGraphic?.renderContract?.backgroundImage?.url ??
      selectedGraphic?.previewImageUrl ??
      od.rawImageUrl ?? od.pexelsImageUrl ?? od.unsplashImageUrl ?? null
    ) as string | null
    const rendering = od.rendering as Record<string, unknown> | null
    const wasAlreadyRendered = selectedGraphic ? selectedGraphic.rendered === true : rendering?.rendered === true

    if (variationIndex !== null && !selectedGraphic) {
      results.push({
        generationId: gen.id, companyName,
        before: null, after: null, success: false,
        reason: `variationIndex ${variationIndex} not found`, wasAlreadyRendered: false,
      })
      failed++
      continue
    }

    let renderContract = (selectedGraphic?.renderContract ?? od.renderContract) as RenderContract
    if (!renderContract || typeof renderContract !== 'object') {
      results.push({
        generationId: gen.id, companyName,
        before: rawImageUrl, after: null, success: false,
        reason: 'No renderContract found for selected image', wasAlreadyRendered,
      })
      failed++
      continue
    }
    
    // Sanitize contract text to remove prompt leaks
    renderContract = sanitizeContractText(renderContract)

    // Patch backgroundImage.url with stored rawImageUrl if the contract has a stale local path
    if (rawImageUrl && renderContract.backgroundImage) {
      renderContract = {
        ...renderContract,
        backgroundImage: { ...renderContract.backgroundImage, url: rawImageUrl },
      }
    }

    // FIX-LAYOUT: backfill fontScale + aspectClass for contracts created before the layout fix.
    // Without these, the renderer falls back to defaults and old layout bugs re-appear.
    if (!(renderContract.size as any).fontScale) {
      const W = renderContract.size.width
      const H = renderContract.size.height
      const ar = W / H
      const aspectClass =
        ar < 0.85  ? 'portrait'
        : ar < 1.15 ? 'square'
        : ar < 1.6  ? 'landscape'
        : 'wide'
      const fontScale =
        aspectClass === 'wide'      ? 0.72
        : aspectClass === 'landscape' ? 0.85
        : 1.0
      renderContract = {
        ...renderContract,
        size: { ...(renderContract.size as any), fontScale, aspectClass },
      }
    }

    try {
      const suffix = variationIndex !== null ? `_v${variationIndex + 1}_admin_rerender` : '_rerender'
      const result = await renderPosterToPng(renderContract, `${gen.id}${suffix}`)

      if (result.success && result.finalPosterUrl) {
        let updatedOutputData: Record<string, unknown>
        if (variationIndex !== null && selectedGraphic) {
          const updatedGraphic = {
            ...selectedGraphic,
            imageDataUri: result.finalPosterUrl,
            imageUrl: result.finalPosterUrl,
            url: result.finalPosterUrl,
            finalPosterUrl: result.finalPosterUrl,
            rendered: true,
            renderContract,
            adminRerenderedAt: new Date().toISOString(),
          }
          const updatedGraphics = sourceGraphics.map((g, idx) => idx === variationIndex ? updatedGraphic : g)
          updatedOutputData = {
            ...od,
            graphics: Array.isArray((od as any).graphics) ? updatedGraphics : (od as any).graphics,
            variations: Array.isArray((od as any).variations) ? updatedGraphics : (od as any).variations,
            ...(variationIndex === 0 ? {
              finalPosterUrl: result.finalPosterUrl,
              imageUrl: result.finalPosterUrl,
              renderContract,
            } : {}),
            rendering: {
              ...(rendering ?? {}),
              rendered: true,
              renderer: 'sharp-composite-admin-single',
              finalPosterUrl: variationIndex === 0 ? result.finalPosterUrl : (od.finalPosterUrl ?? result.finalPosterUrl),
              storageType: result.storageType,
              failureReason: null,
              lastSingleVariationIndex: variationIndex,
              backfilledAt: new Date().toISOString(),
              wasAlreadyRendered,
            },
          }
        } else {
          updatedOutputData = {
            ...od,
            finalPosterUrl: result.finalPosterUrl,
            imageUrl: result.finalPosterUrl,
            rendering: {
              rendered: true,
              renderer: 'sharp-composite-backfill',
              finalPosterUrl: result.finalPosterUrl,
              storageType: result.storageType,
              failureReason: null,
              backfilledAt: new Date().toISOString(),
              wasAlreadyRendered,
            },
          }
        }

        await db.generation.update({
          where: { id: gen.id },
          data: { outputData: updatedOutputData as never },
        })

        results.push({
          generationId: gen.id, companyName,
          before: rawImageUrl, after: result.finalPosterUrl,
          success: true, wasAlreadyRendered,
        })
        succeeded++
        console.log(`[rerender-backfill] ✓ ${gen.id} (${companyName}) forceAll=${forceAll} → ${result.storageType}`)
      } else {
        results.push({
          generationId: gen.id, companyName,
          before: rawImageUrl, after: null,
          success: false, reason: result.failureReason ?? 'Renderer returned failure',
          wasAlreadyRendered,
        })
        failed++
        console.warn(`[rerender-backfill] ✗ ${gen.id} (${companyName}): ${result.failureReason}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({
        generationId: gen.id, companyName,
        before: rawImageUrl, after: null,
        success: false, reason: msg, wasAlreadyRendered,
      })
      failed++
      console.error(`[rerender-backfill] ✗ ${gen.id} threw:`, err)
    }
  }

  return NextResponse.json({
    processed: targets.length, succeeded, failed, skipped: 0, forceAll,
    results,
    message: variationIndex !== null ? `Re-rendered selected image ${variationIndex + 1}: ${succeeded}/${targets.length}. ${failed} failed.` : `Re-rendered ${succeeded}/${targets.length}. ${failed} failed. (forceAll=${forceAll})`,
    scanSummary: {
      total_campaign_images: campaignImages.length,
      already_rendered: alreadyRendered.length,
      needs_backfill: needsBackfill.length,
    },
  })
}

// ── GET — quick scan ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const all = await db.generation.findMany({
    where: { status: 'COMPLETE' },
    select: { id: true, outputData: true, inputData: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const campaignImages = all.filter(g => {
    const od = g.outputData as Record<string, unknown> | null
    if (od?.genType !== 'campaign-image') return false
    const hasRootContract = !!od.renderContract
    const hasVariationContract = [od.graphics, od.variations].some((list: any) =>
      Array.isArray(list) && list.some((item: any) => item?.renderContract)
    )
    return hasRootContract || hasVariationContract
  })

  const alreadyRendered = campaignImages.filter(g => {
    const rendering = ((g.outputData as Record<string, unknown>).rendering) as Record<string, unknown> | null
    return rendering?.rendered === true
  })
  const needsBackfill = campaignImages.filter(g => {
    const rendering = ((g.outputData as Record<string, unknown>).rendering) as Record<string, unknown> | null
    return rendering?.rendered !== true
  })

  return NextResponse.json({
    total_campaign_images: campaignImages.length,
    already_rendered: alreadyRendered.length,
    needs_backfill: needsBackfill.length,
    sample_needs_backfill: needsBackfill.slice(0, 5).map(g => ({
      id: g.id,
      company: ((g.inputData as Record<string, unknown>)?.companyName ?? 'Unknown') as string,
      createdAt: g.createdAt,
    })),
    sample_already_rendered: alreadyRendered.slice(0, 3).map(g => ({
      id: g.id,
      company: ((g.inputData as Record<string, unknown>)?.companyName ?? 'Unknown') as string,
      createdAt: g.createdAt,
    })),
  })
}
