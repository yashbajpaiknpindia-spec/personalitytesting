// src/app/api/edit-poster/route.ts
// AI-powered poster editor — modifies a render contract based on user instructions
// then re-renders using the Sharp pipeline.
//
// POST body:
//   renderContract  — the existing RenderContract JSON (from creativeOutput.renderContract)
//   editPrompt      — free-text edit instruction (e.g. "change headline to X", "use a darker background")
//   generationId    — optional, used as base for the re-render file name
//
// Response:
//   { imageDataUri, renderContract } — new poster URL + modified contract

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { renderPosterToPng } from '@/lib/image-engine/renderer/render-poster'
import type { RenderContract } from '@/lib/image-engine/types'
import { validateCreativeOutput } from '@/lib/image-engine/validation'

// ── Admin edit-limit helper ───────────────────────────────────────────────────
async function getPosterEditLimit(): Promise<number> {
  try {
    const s = await db.adminSettings.findUnique({ where: { id: 'singleton' } })
    return (s as any)?.posterEditLimit ?? 2
  } catch {
    return 2
  }
}

// ── Claude Haiku: parse the edit and return a patch ──────────────────────────
async function applyEditToContract(
  contract: RenderContract,
  editPrompt: string
): Promise<RenderContract> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return contract

  const systemPrompt = `You are a brand design assistant. A user wants to edit a campaign poster.
Given the current poster data and an edit instruction, return ONLY a JSON patch object
containing ONLY the fields that should change. Do not include unchanged fields.

Editable fields:
- "headline"              (string, max 46 chars — the main title on the poster)
- "subheadline"           (string, max 110 chars — supporting text below headline)
- "cta"                   (string, max 30 chars — the call-to-action button label)
- "colors.accent"         (hex string — accent/button colour)
- "colors.text"           (hex string — main text colour)
- "colors.background"     (hex string — background fill colour)
- "templateId"            (string — one of: luxury_editorial, dark_power_campaign, legacy_story_poster,
                            heritage_city_campaign, clean_typography_offer, service_grid_premium,
                            care_wellness, bold_offer_card, founder_ambition, dark_agency_noir,
                            transformation_offer, festival_celebration, testimonial_proof,
                            minimal_proof_card, local_market_story, startup_pitch_visual)
- "variation"             (string — "A" standard layout, "B" full-bleed, "C" vertical split-panel)
- "size.layout"           (string — ONLY set this when user explicitly requests text placement:
                            "bottom-left", "center", "top-center", "bottom-center", "split-left")

Rules:
- Return ONLY valid JSON, no markdown, no explanation, no code fences.
- Only include keys the user actually asked to change.
- Respect max character limits — truncate with … if needed.
- For colour requests like "darker", "lighter", "warmer", compute a sensible hex.
- For layout requests like "center text", "split panel", "text on left", map to the correct variation/layout.
- "split-panel layout" → variation:"C"  (do NOT set size.layout for this)
- "full-bleed" or "text lower" → variation:"B"
- "text at center" or "centered" → size.layout:"center"  AND variation:"A"
- "text at top" → size.layout:"top-center" AND variation:"A"
- "bold style" or "bold typography" → templateId:"bold_offer_card"
- "luxury style" or "editorial" → templateId:"luxury_editorial"
- "dark style" or "dark background" → templateId:"dark_power_campaign", colors:{"background":"#0a0a0e","text":"#ffffff"}
- "minimal style" → templateId:"minimal_proof_card"
- If the request is unclear, make the most logical change.

Example: "Change headline to Premium Coffee Experience"
Output: {"headline":"Premium Coffee Experience"}

Example: "make button gold and change CTA to Book Now"
Output: {"cta":"Book Now","colors":{"accent":"#C9A84C"}}

Example: "use split-panel layout"
Output: {"variation":"C"}

Example: "move text to center"
Output: {"variation":"A","size":{"layout":"center"}}

Example: "use dark style with red accent"
Output: {"templateId":"dark_power_campaign","colors":{"background":"#0a0a0e","text":"#ffffff","accent":"#E11D2E"}}`

  const userMsg = `Current poster:
Headline: "${contract.headline ?? ''}"
Subheadline: "${contract.subheadline ?? ''}"
CTA: "${contract.cta ?? ''}"
Template: ${contract.templateId}
Variation: ${contract.variation ?? 'A'}
Accent colour: ${contract.colors?.accent ?? 'n/a'}
Background: ${contract.colors?.background ?? 'n/a'}
Text colour: ${contract.colors?.text ?? 'n/a'}

Edit instruction: "${editPrompt}"`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    })

    if (!res.ok) {
      console.warn('[edit-poster] Claude API error:', res.status)
      return contract
    }

    const data = await res.json()
    const raw = (data.content?.[0]?.text ?? '{}')
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()

    const patch = JSON.parse(raw) as {
      headline?: string
      subheadline?: string
      cta?: string
      templateId?: string
      variation?: string
      colors?: { accent?: string; text?: string; background?: string }
      size?: { layout?: string }
    }

    const modified: RenderContract = { ...contract }

    if (typeof patch.headline === 'string')
      modified.headline = patch.headline.slice(0, 46)
    if (typeof patch.subheadline === 'string')
      modified.subheadline = patch.subheadline.slice(0, 110)
    if (typeof patch.cta === 'string')
      modified.cta = patch.cta.slice(0, 30)
    if (typeof patch.templateId === 'string')
      modified.templateId = patch.templateId
    if (typeof patch.variation === 'string' && ['A','B','C'].includes(patch.variation))
      modified.variation = patch.variation as 'A' | 'B' | 'C'
    if (patch.colors && typeof patch.colors === 'object') {
      modified.colors = { ...contract.colors }
      if (patch.colors.accent)     modified.colors.accent     = patch.colors.accent
      if (patch.colors.text)       modified.colors.text       = patch.colors.text
      if (patch.colors.background) modified.colors.background = patch.colors.background
    }
    // Layout override — stored as an extension on size so the renderer picks it up
    if (patch.size?.layout) {
      ;(modified.size as any).layoutOverride = patch.size.layout
    }

    return modified
  } catch (err) {
    console.warn('[edit-poster] Patch parsing failed:', err)
    return contract
  }
}

// ── POST /api/edit-poster ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id ?? null
  if (!userId) {
    return NextResponse.json({ error: 'You must be logged in to edit posters.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { renderContract, editPrompt, generationId, editCount = 0 } = body as {
      renderContract: RenderContract
      editPrompt: string
      generationId?: string
      editCount?: number
    }

    if (!renderContract || !editPrompt?.trim()) {
      return NextResponse.json({ error: 'renderContract and editPrompt are required.' }, { status: 400 })
    }

    // Enforce admin-configured edit limit
    const editLimit = await getPosterEditLimit()
    if (editCount >= editLimit) {
      return NextResponse.json(
        { error: `Edit limit of ${editLimit} reached for this poster.`, limitReached: true },
        { status: 429 }
      )
    }

    // Apply AI-parsed edits to the render contract
    let modifiedContract = await applyEditToContract(renderContract, editPrompt.trim())

    // Sanitize for prompt leaks after AI edit
    const brandName = modifiedContract.brandName ?? 'Brand'
    const creativeForValidation = {
      headline: modifiedContract.headline,
      subheadline: modifiedContract.subheadline,
      bodyCopy: modifiedContract.bodyCopy,
      cta: modifiedContract.cta,
      industry: '', campaignArchetype: '', selectedTemplate: '', selectedSize: '',
      templateVariation: 'A', visualMetaphor: '', sceneDirection: '', imageQueries: [],
      serviceTags: [], colorPalette: { background: '', text: '', accent: '' },
      typographyMood: '', imageDirection: '', negativeKeywords: [], confidence: 0
    }
    const { modified: sanitized } = validateCreativeOutput(creativeForValidation as any, brandName)
    if (sanitized.headline) modifiedContract.headline = sanitized.headline
    if (sanitized.subheadline) modifiedContract.subheadline = sanitized.subheadline
    if (sanitized.cta) modifiedContract.cta = sanitized.cta

    // FIX-LAYOUT: backfill fontScale + aspectClass in case this contract was stored
    // before the layout fix (older posters won't have these fields on size).
    if (!(modifiedContract.size as any).fontScale) {
      const W = modifiedContract.size.width
      const H = modifiedContract.size.height
      const ar = W / H
      const aspectClass =
        ar < 0.85  ? 'portrait'
        : ar < 1.15 ? 'square'
        : ar < 1.6  ? 'landscape'
        : 'wide'
      // Derive a reasonable fontScale from the aspect class
      const fontScale =
        aspectClass === 'wide'      ? 0.72
        : aspectClass === 'landscape' ? 0.85
        : 1.0
      ;(modifiedContract.size as any).fontScale   = fontScale
      ;(modifiedContract.size as any).aspectClass = aspectClass
    }

    // FIX: Ensure the background source URL is valid before re-render.
    // The renderer uses cleanBackgroundUrl ?? url as the background fetch target.
    // cleanBackgroundUrl is the raw stock photo (no text baked in) — always safe to use.
    // If neither is available or both have expired, strip backgroundImage so the renderer
    // falls back to a solid-colour text-only poster instead of failing silently.
    if (modifiedContract.backgroundImage) {
      const bg = modifiedContract.backgroundImage as typeof modifiedContract.backgroundImage & {
        cleanBackgroundUrl?: string
        permanentUrl?: string
      }
      // The effective fetch URL — same precedence as render-poster.ts
      const effectiveBgUrl = bg.cleanBackgroundUrl ?? bg.url
      if (effectiveBgUrl) {
        // Test whether the source URL is still alive (quick HEAD, 4s timeout)
        try {
          const probe = await fetch(effectiveBgUrl, { method: 'HEAD', signal: AbortSignal.timeout(4000) })
          if (!probe.ok) {
            console.warn('[edit-poster] Background URL expired (HTTP', probe.status, ') — falling back to solid colour render')
            modifiedContract = { ...modifiedContract, backgroundImage: null }
          }
        } catch {
          console.warn('[edit-poster] Background URL probe timed out — falling back to solid colour render')
          modifiedContract = { ...modifiedContract, backgroundImage: null }
        }
      } else {
        // No usable background URL at all — strip it
        modifiedContract = { ...modifiedContract, backgroundImage: null }
      }
    }

    // Re-render with Sharp
    const effectiveGenId = generationId
      ? `${generationId}_edit_${editCount + 1}_${Date.now()}`
      : `edit_${Date.now()}`

    const rendered = await renderPosterToPng(modifiedContract, effectiveGenId)

    if (!rendered.success || !rendered.finalPosterUrl) {
      console.error('[edit-poster] Re-render failed:', rendered.failureReason)
      return NextResponse.json(
        { error: 'Re-render failed. Please try again.', detail: rendered.failureReason },
        { status: 502 }
      )
    }

    // Log the edit
    void db.apiCallLog.create({
      data: {
        service: 'anthropic',
        endpoint: 'edit-poster',
        userId,
        model: 'claude-haiku-4-5-20251001',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costUsd: 0.0001,
        costInr: 0.0001 * 84,
        success: true,
        generationId: generationId ?? null,
        query: editPrompt.slice(0, 100),
      },
    }).catch(() => {})

    return NextResponse.json({
      imageDataUri: rendered.finalPosterUrl,
      renderContract: modifiedContract,
      changes: {
        headline: modifiedContract.headline,
        subheadline: modifiedContract.subheadline,
        cta: modifiedContract.cta,
      },
    })
  } catch (err) {
    console.error('[edit-poster] Unhandled error:', err)
    return NextResponse.json({ error: 'Edit failed unexpectedly.' }, { status: 500 })
  }
}
