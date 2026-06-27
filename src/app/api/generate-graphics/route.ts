// src/app/api/generate-graphics/route.ts
// IMAGE ENGINE v2 — Pexels → Unsplash → Sharp renderer pipeline
//
// SAME route path. SAME response shape: { graphics: [{ imageDataUri, svgDataUri, source, ... }] }
// Frontend is completely untouched.
//
// NEW INTERNAL FLOW:
//   1. Auth + validate (same as before)
//   2. Accept existing request body shape (companyName, industry, tagline, primaryColors,
//      brandVoice, brandStory, tone, logoKeywords)
//      PLUS new optional fields: prompt, offer, city, platformSize
//   3. Creative Director (Claude Sonnet) → campaign JSON
//   4. Pexels searches → score → use if ≥ MIN_IMAGE_SCORE (default 55)
//   5. If Pexels fails / weak score → Unsplash
//   6. Build renderContract
//   7. Sharp backend renderer → final poster PNG
//   8. Save PNG to Cloudinary or public/generated/campaign-images/
//   9. Return { graphics: [{ imageDataUri: finalPosterUrl, svgDataUri: null, source, ... }] }
//  10. Full metadata saved to Generation.outputData + ApiCallLog

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { getUsdToInr, calcCostUsd } from '@/lib/ai/generate'
import { parseAIJson } from '@/lib/ai/safe-json'
import { checkGlobalLimit, incrementUsage } from '@/lib/rateLimit'

// Image engine modules
import { runCreativeDirector } from '@/lib/image-engine/creative-director'
import { findBestCampaignImage } from '@/lib/image-engine/image-source-router'
import { buildRenderContract } from '@/lib/image-engine/render-contract'
import { renderPosterToPng } from '@/lib/image-engine/renderer/render-poster'
import { validateCreativeOutput } from '@/lib/image-engine/validation'
import { buildCostEstimate } from '@/lib/image-engine/cost'
import type { CreativeDirectorOutput } from '@/lib/image-engine/types'

const CREATIVE_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o'   // OpenAI Creative Director

// ── Creative Director system prompt ──────────────────────────────────────────
const CD_SYSTEM = `You are Brand Syndicate's Creative Director Agent. Return ONLY valid JSON. No markdown, no preamble, no explanation.

Return exactly this JSON shape:
{"industry":"","campaignArchetype":"","selectedTemplate":"","selectedSize":"instagram_post_4x5","templateVariation":"A","visualMetaphor":"","sceneDirection":"","imageQueries":[],"headline":"","subheadline":"","bodyCopy":"","cta":"","serviceTags":[],"colorPalette":{"background":"","text":"","accent":""},"typographyMood":"","imageDirection":"","negativeKeywords":[],"confidence":0}

TEMPLATE VARIATION RULES (rotate for visual diversity):
- "A" = standard editorial layout
- "B" = full-bleed image with safe text lower/central
- NEVER use "C". The old half-panel focus layout is disabled because it crops subjects and creates inconsistent images.
- Use B for founder, authority, luxury editorial, festival, heritage landscape, celebration
- Default to A for offers and text-heavy prompts

BUSINESS-TYPE ROUTING — BE SPECIFIC, DO NOT over-route to legacy_story_poster:
- car/automobile/showroom/vehicle → automotive + authority_power + dark_power_campaign (variation B), imageQueries: ["luxury car showroom interior", "sports car dealership night", "car keys luxury bokeh", "automobile premium lighting India", "vehicle interior leather detail"]
- restaurant/dhaba/catering → food_beverage + bold_offer + bold_offer_card or local_market_story, imageQueries: ["restaurant interior warm ambient India", "fine dining food presentation", "chef kitchen action", "elegant dining bokeh", "plated meal luxury"]
- cafe/coffee shop → food_beverage + local_pride + local_market_story, imageQueries: ["cafe interior natural light", "coffee latte art pour", "barista bokeh", "cosy cafe window seat", "espresso macro close up"]
- jewellery/gold/bridal/diamond → jewellery + premium_luxury + luxury_editorial (variation B), imageQueries: ["gold jewellery close up India", "bridal jewelry warm light", "diamond ring bokeh", "luxury necklace studio", "bridal set macro detail"]
- clinic/doctor/hospital/medical/dental → clinic + care_ritual + care_wellness, imageQueries: ["modern clinic interior white", "doctor consultation warm", "healthcare professional portrait", "medical equipment bokeh", "clean hospital corridor"]
- startup/saas/app/tech/software → startup + founder_ambition + startup_pitch_visual (variation B), imageQueries: ["startup team modern office", "laptop code dark background", "tech workspace minimal", "developer coding night", "modern office bokeh"]
- gym/fitness/yoga/trainer → fitness + transformation + transformation_offer, imageQueries: ["gym weights dramatic lighting", "athlete training silhouette", "fitness model motivation", "yoga session natural light", "workout action shot"]
- salon/beauty/spa/skincare → beauty_fashion + premium_luxury + care_wellness or luxury_editorial, imageQueries: ["luxury spa interior", "beauty treatment close up", "skincare product bokeh", "salon modern interior India", "wellness calm white"]
- school/coaching/education/institute → education + professional_trust + testimonial_proof or service_grid_premium, imageQueries: ["students classroom modern India", "teacher student mentoring", "education books study", "campus building exterior", "learning environment bright"]
- real estate/property/apartments → real_estate + bold_offer + bold_offer_card, imageQueries: ["luxury apartment interior India", "real estate property exterior", "modern living room bokeh", "property development aerial", "luxury home interior"]
- fashion/clothing/boutique/saree → beauty_fashion + premium_luxury + luxury_editorial, imageQueries: ["fashion editorial India", "clothing boutique interior", "saree model editorial", "fashion studio portrait", "designer clothing display"]
- brand syndicate/branding agency/marketing/authority → branding_agency + authority_power + dark_power_campaign, imageQueries: ["dark businessman portrait cinematic", "moody suit silhouette", "corporate boardroom shadows", "executive portrait dramatic", "business authority dark"]
- local/city name only (no specific business type) → local_pride + heritage_city_campaign (variation B), imageQueries: ["Indian heritage street", "old city bazaar India", "historic architecture India", "river ghat dusk", "local market India"]
- heritage/family business/decades/generation → traditional_trade + legacy_story + legacy_story_poster, imageQueries: ["Indian heritage building", "vintage family business", "traditional craft artisan India", "old shop heritage India", "generation legacy"]
- Hindi offer/"free"/"aap"/"50% off" → bold_offer + clean_typography_offer, imageQueries: ["clean background texture", "minimal gradient", "bold typography background"]
- services list/multiple categories → service_grid_premium + authority_power + dark_power_campaign, imageQueries: ["professional business team India", "corporate service delivery", "business meeting modern", "office team diverse India"]
- festival/diwali/eid/holi/celebration → celebration + festival_celebration (variation B), imageQueries: ["festival lights bokeh India", "diwali lamps warm", "celebration colorful India", "festive decor warm glow", "joy celebration people India"]
- testimonial/review/trusted by → trust_proof + testimonial_proof, imageQueries: ["happy customer portrait India", "satisfied client smile", "positive review concept", "trust handshake business India"]
- Default: bold_offer + bold_offer_card

COLOR PALETTE — distinct per template:
- dark_power_campaign: {"background":"#0a0a0e","text":"#ffffff","accent":"#E11D2E"}
- luxury_editorial: {"background":"#F4EBDD","text":"#111111","accent":"#B58A3B"}
- care_wellness: {"background":"#F0F7FF","text":"#1A2C3D","accent":"#2E7DB2"}
- heritage_city_campaign: {"background":"#F5EED8","text":"#1C1008","accent":"#B8892B"}
- legacy_story_poster: {"background":"#EDE6D3","text":"#1A0F00","accent":"#8B5E2E"}
- clean_typography_offer: {"background":"#FAFAF7","text":"#111111","accent":"#C9A84C"}
- service_grid_premium: {"background":"#0a0a0e","text":"#ffffff","accent":"#E11D2E"}
- founder_ambition: {"background":"#040815","text":"#ffffff","accent":"#3B82F6"}
- startup_pitch_visual: {"background":"#050E1F","text":"#ffffff","accent":"#6366F1"}
- bold_offer_card: {"background":"#1A0A00","text":"#ffffff","accent":"#FF6B00"}
- transformation_offer: {"background":"#0D0D14","text":"#ffffff","accent":"#8B5CF6"}
- festival_celebration: {"background":"#1A0800","text":"#FFE4A0","accent":"#FFB800"}
- local_market_story: {"background":"#F7F3EC","text":"#111111","accent":"#D97706"}
- testimonial_proof: {"background":"#F9F9F6","text":"#111111","accent":"#374151"}

IMAGE QUERY RULES — CRITICAL:
- imageQueries MUST match the actual business type, NOT the city name
- NEVER use generic city street photos, brick walls, or random urban scenes
- NEVER use Korean/foreign text images for Indian businesses
- Always generate 5-8 highly specific queries relevant to WHAT the business does
- For Indian local businesses: add "India" to queries
- Negative keywords: always include location names, foreign language text, text/signage

SIZES: instagram_post_4x5 (default), instagram_story_9x16, linkedin_post_1_91x1, website_hero_16x9, whatsapp_portfolio_3x4

TEMPLATES: luxury_editorial, dark_power_campaign, legacy_story_poster, heritage_city_campaign, clean_typography_offer, service_grid_premium, care_wellness, product_hero, bold_offer_card, founder_ambition, dark_agency_noir, transformation_offer, festival_celebration, testimonial_proof, minimal_proof_card, local_market_story, website_hero_campaign, craftsmanship_detail, startup_pitch_visual, clean_brand_audit

COPY: headline max 46 chars, subheadline max 110, cta max 30, serviceTags max 5 (service_grid_premium only), bodyCopy max 200

Do not ask questions. Return JSON only.`

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return NextResponse.json(
      { error: 'You must be logged in to generate brand images.' },
      { status: 401 }
    )
  }

  // ── Global generation limit check ─────────────────────────────────────────
  const limitResult = await checkGlobalLimit(userId)
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: limitResult.reason || 'Generation limit reached.', limitReached: true, used: limitResult.used, limit: limitResult.limit, period: limitResult.period, resetAt: limitResult.resetAt },
      { status: 429 }
    )
  }

  let generationId: string | null = null

  try {
    const body = await req.json()

    // Support both the existing request shape AND new optional fields
    const {
      companyName,
      businessName,
      industry,
      tagline,
      primaryColors,
      brandVoice,
      brandStory,
      tone,
      logoKeywords,
      // New optional fields
      prompt: rawPrompt,
      offer,
      city,
      platformSize,
      forcedSize,   // NEW: override Creative Director size selection (for ratio picker)
      generationId: existingGenerationId,
      singleImage,
    } = body

    let brandName = (companyName ?? businessName ?? '').trim()
    if (!brandName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Sanitize brandName itself — sometimes the user puts the full prompt in the "Company Name" field
    const brandMarkers = ['create a', 'generate a', 'design a', 'make a', 'prompt:', 'graphic for', 'selling', 'brand for']
    if (brandMarkers.some(m => brandName.toLowerCase().includes(m)) || brandName.length > 40) {
      brandName = 'Brand'
    }

    // Build effective prompt from all available context
    const effectivePrompt = rawPrompt?.trim() || [
      `Create a premium brand poster for ${brandName}`,
      industry ? `in the ${industry} industry` : '',
      tagline ? `with tagline: "${tagline}"` : '',
      offer ? `featuring: ${offer}` : '',
      brandVoice ? `brand voice: ${brandVoice}` : '',
      brandStory?.slice(0, 120) ? `context: ${brandStory.slice(0, 120)}` : '',
      logoKeywords?.length ? `keywords: ${logoKeywords.slice(0, 5).join(', ')}` : '',
    ].filter(Boolean).join(', ')

    // Track in DB. If the frontend created a pending media session, keep updating that
    // same row so partial image previews can appear while remaining variations render.
    const template = await db.template.findFirst({ where: { slug: 'noir-card' } })
      ?? await db.template.findFirst()
    if (existingGenerationId && typeof existingGenerationId === 'string') {
      const existing = await db.generation.findFirst({ where: { id: existingGenerationId, userId } }).catch(() => null)
      if (existing) {
        generationId = existing.id
        void db.generation.update({
          where: { id: existing.id },
          data: {
            status: 'PENDING',
            inputData: body as never,
            enrichedData: { genType: 'campaign-image', companyName: brandName, industry } as never,
          },
        }).catch(() => {})
      }
    }
    if (!generationId) {
      const gen = await db.generation.create({
        data: {
          userId,
          templateId: template?.id ?? null,
          status: 'PENDING',
          inputData: body as never,
          enrichedData: { genType: 'campaign-image', companyName: brandName, industry } as never,
        },
      }).catch(() => null)
      if (gen) generationId = gen.id
    }

    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      if (generationId) void db.generation.update({ where: { id: generationId }, data: { status: 'FAILED' } }).catch(() => {})
      return NextResponse.json({ error: 'API key not configured', missingKey: true }, { status: 503 })
    }

    const usdToInr = await getUsdToInr()

    // ── STEP 1: Creative Director (GPT-4o) ────────────────────────────────────
    let creative: CreativeDirectorOutput
    let cdInputTokens = 0
    let cdOutputTokens = 0

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      // No OpenAI key — use deterministic fallback immediately
      console.warn('[generate-graphics] No OPENAI_API_KEY, using deterministic fallback')
      creative = await runCreativeDirector({
        prompt: effectivePrompt,
        companyName: brandName,
        businessName: brandName,
        industry, city, offer, tone,
        platformSize, tagline,
        primaryColors: primaryColors ?? [],
        brandVoice,
      })
    } else {
      try {
        const userMsg = [
          `Business: ${brandName}`,
          industry ? `Industry: ${industry}` : '',
          city ? `City: ${city}` : '',
          offer ? `Offer/campaign: ${offer}` : '',
          tone ? `Tone: ${tone}` : '',
          platformSize ? `Platform: ${platformSize}` : '',
          tagline ? `Tagline: ${tagline}` : '',
          primaryColors?.length ? `Brand colors: ${primaryColors.slice(0, 3).join(', ')}` : '',
          brandVoice ? `Brand voice: ${brandVoice?.slice(0, 80)}` : '',
          `\nPrompt: ${effectivePrompt}`,
        ].filter(Boolean).join('\n')

        const oaiCdRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: CREATIVE_MODEL,
            max_tokens: 1200,
            temperature: 0.75, // FIX 4: was 0.4, raised for creative diversity
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: CD_SYSTEM },
              { role: 'user', content: userMsg },
            ],
          }),
        })

        if (!oaiCdRes.ok) {
          const errText = await oaiCdRes.text()
          throw new Error(`OpenAI CD error ${oaiCdRes.status}: ${errText.slice(0, 200)}`)
        }

        const oaiCdData = await oaiCdRes.json() as {
          choices: Array<{ message: { content: string } }>
          usage?: { prompt_tokens?: number; completion_tokens?: number }
        }

        cdInputTokens = oaiCdData.usage?.prompt_tokens ?? 0
        cdOutputTokens = oaiCdData.usage?.completion_tokens ?? 0

        const rawText = (oaiCdData.choices[0]?.message?.content ?? '')
          .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
          .trim()

        const parsedCreative = parseAIJson<CreativeDirectorOutput | null>(rawText, null)
        if (!parsedCreative?.headline || !parsedCreative?.selectedTemplate) {
          throw new Error('Creative Director returned incomplete JSON')
        }
        creative = parsedCreative as CreativeDirectorOutput

        void db.apiCallLog.create({
          data: {
            service: 'openai', endpoint: 'generate-graphics/creative-director', userId,
            model: CREATIVE_MODEL,
            inputTokens: cdInputTokens, outputTokens: cdOutputTokens,
            totalTokens: cdInputTokens + cdOutputTokens,
            costUsd: (cdInputTokens * 0.0000025) + (cdOutputTokens * 0.00001), // gpt-4o pricing
            costInr: ((cdInputTokens * 0.0000025) + (cdOutputTokens * 0.00001)) * usdToInr,
            generationId, success: true,
          },
        }).catch(() => {})

      } catch (cdErr) {
        console.warn('[generate-graphics] GPT-4o CD failed, using deterministic fallback:', cdErr)
        creative = await runCreativeDirector({
          prompt: effectivePrompt,
          companyName: brandName,
          businessName: brandName,
          industry, city, offer, tone,
          platformSize, tagline,
          primaryColors: primaryColors ?? [],
          brandVoice,
        })
      }
    }

    // Validate — warn only, never hard-fail
    const { warnings: validationWarnings, modified } = validateCreativeOutput(creative, brandName)
    if (Object.keys(modified).length > 0) Object.assign(creative, modified)

    // ── forcedSize override — user selected a specific aspect ratio ──────────
    if (forcedSize && typeof forcedSize === 'string') {
      creative.selectedSize = forcedSize
      console.log('[generate-graphics] forcedSize applied:', forcedSize)
    }

    // ── STEP 2: Image source search (Pexels → Unsplash) ─────────────────────
    // Optional single-image mode is kept for lightweight internal calls.
    const variationLimit = singleImage === true ? 1 : 4

    // One Creative Director call powers the requested poster variations.
    const imageSourceResult = await findBestCampaignImage({
      imageQueries: creative.imageQueries ?? [],
      negativeKeywords: creative.negativeKeywords ?? [],
      industry: creative.industry,
      templateId: creative.selectedTemplate,
      archetypeId: creative.campaignArchetype,
      sizeId: creative.selectedSize,
      limit: variationLimit,
    })

    const imageCandidates = (imageSourceResult.candidates?.length
      ? imageSourceResult.candidates
      : imageSourceResult.candidate ? [imageSourceResult.candidate] : [])
      .slice(0, variationLimit)

    // Log image source calls once per provider used (free APIs, tracked for usage)
    const loggedSources = new Set<string>()
    for (const candidate of imageCandidates) {
      if (candidate.source === 'none' || loggedSources.has(candidate.source)) continue
      loggedSources.add(candidate.source)
      void db.apiCallLog.create({
        data: {
          service: candidate.source === 'pexels' ? 'pexels-website' : 'unsplash',
          endpoint: 'generate-graphics/image-search',
          userId,
          query: candidate.queryUsed ?? creative.imageQueries?.[0] ?? '',
          costUsd: 0,
          costInr: 0,
          success: true,
          cached: false,
          generationId,
        },
      }).catch(() => {})
    }

    // ── STEP 3/4: Build and render 4 variation contracts safely ──────────────
    const isInternalSample = brandName.toLowerCase().includes('brand syndicate')
      || brandName.toLowerCase().includes('brandsyndicate')

    const imageSourceFlow = {
      selected: imageSourceResult.selected,
      attempts: imageSourceResult.attempts,
      failureReasons: imageSourceResult.failureReasons,
    }

    const variationConfigs: Array<{
      variation: 'A' | 'B'
      layoutOverride?: 'bottom-left' | 'center' | 'bottom-center'
      label: string
    }> = [
      { variation: 'A', layoutOverride: 'bottom-left',   label: 'Left Editorial' },
      { variation: 'B', layoutOverride: 'center',        label: 'Editorial Focus' },
      { variation: 'B', layoutOverride: 'bottom-center', label: 'Bottom Impact' },
      { variation: 'A', layoutOverride: 'center',        label: 'Centered Premium' },
    ]

    const effectiveGenId = generationId ?? `gen_${Date.now()}`
    const graphics: any[] = []
    const renderingFailures: Array<{ variationIndex: number; reason?: string }> = []

    for (let i = 0; i < imageCandidates.length; i++) {
      const imageCandidate = imageCandidates[i]
      const config = variationConfigs[i % variationConfigs.length]
      const creativeForVariation: CreativeDirectorOutput = {
        ...creative,
        templateVariation: config.variation,
      }

      const renderContract = buildRenderContract({
        creative: creativeForVariation,
        imageCandidate,
        imageSource: imageCandidate.source,
        brandName,
        logoUrl: undefined,
        isInternalSample,
        imageSourceFlow: {
          ...imageSourceFlow,
          selected: imageCandidate.source,
        },
        qualityWarnings: validationWarnings,
      }) as any

      renderContract._layoutOverride = config.layoutOverride
      renderContract._variationIndex = i
      renderContract._variationLabel = config.label

      const renderedPoster = await renderPosterToPng(renderContract, `${effectiveGenId}_v${i + 1}`)

      let finalPosterUrl: string | null = null
      let rendered = false

      if (renderedPoster.success && renderedPoster.finalPosterUrl) {
        finalPosterUrl = renderedPoster.finalPosterUrl
        rendered = true
        if (renderContract.backgroundImage) {
          renderContract.backgroundImage.cleanBackgroundUrl = renderContract.backgroundImage.url
        }
      } else {
        console.warn(`[generate-graphics] Renderer failed for variation ${i + 1}:`, renderedPoster.failureReason)
        renderingFailures.push({ variationIndex: i, reason: renderedPoster.failureReason })

        const textOnlyContract = { ...renderContract, backgroundImage: null }
        const textOnlyResult = await renderPosterToPng(textOnlyContract, `${effectiveGenId}_v${i + 1}_txt`)
        if (textOnlyResult.success && textOnlyResult.finalPosterUrl) {
          finalPosterUrl = textOnlyResult.finalPosterUrl
          rendered = true
          validationWarnings.push('Image source/renderer failed quality gate — served safe text-only poster instead of raw stock image')
        } else {
          validationWarnings.push('Variation skipped because renderer failed and safe fallback could not be created')
          continue
        }
      }

      if (!finalPosterUrl || !rendered) continue

      const displayUrl = finalPosterUrl
      const previewUrl = displayUrl

      graphics.push({
        id: `${effectiveGenId}_v${i + 1}`,
        type: 'campaign-poster',
        title: creative.headline || 'Campaign Poster',
        description: `${config.label} · ${creative.selectedTemplate} · ${creative.selectedSize}`,
        imageDataUri: displayUrl,
        svgDataUri: null,
        source: imageCandidate.source,
        imageUrl: displayUrl,
        url: displayUrl,
        previewImageUrl: previewUrl,
        finalPosterUrl,
        rendered,
        renderContract,
        template: creative.selectedTemplate,
        size: creative.selectedSize,
        variationIndex: i,
        variationLabel: config.label,
        creativeOutput: {
          headline:          creative.headline,
          subheadline:       creative.subheadline,
          bodyCopy:          creative.bodyCopy,
          cta:               creative.cta,
          serviceTags:       creative.serviceTags,
          selectedTemplate:  creative.selectedTemplate,
          selectedSize:      creative.selectedSize,
          campaignArchetype: creative.campaignArchetype,
          visualMetaphor:    creative.visualMetaphor,
          sceneDirection:    creative.sceneDirection,
          imageDirection:    creative.imageDirection,
          imageQueries:      creative.imageQueries,
          typographyMood:    creative.typographyMood,
          colorPalette:      creative.colorPalette,
          confidence:        creative.confidence,
        },
        attribution: {
          photographer: imageCandidate?.photographer ?? '',
          photographerUrl: imageCandidate?.photographerUrl ?? '',
          text: imageCandidate?.attributionText ?? '',
          url: imageCandidate?.attributionUrl ?? '',
        },
        generationId: effectiveGenId,
        imageSourceFlow: { ...imageSourceFlow, selected: imageCandidate.source },
        qualityWarnings: validationWarnings,
      })

      // Progressive preview: save each rendered variation immediately so the
      // preview panel can poll this generation and show images one-by-one.
      if (generationId) {
        const partialPrimary = graphics[0]
        void db.generation.update({
          where: { id: generationId },
          data: {
            status: 'PENDING',
            outputData: {
              genType: 'campaign-image',
              companyName: brandName,
              brandName,
              mode: body.mode ?? 'free',
              source: partialPrimary?.source ?? imageCandidate.source,
              size: creative.selectedSize,
              industry: creative.industry,
              archetype: creative.campaignArchetype,
              templateId: creative.selectedTemplate,
              variation: creative.templateVariation,
              imageUrl: partialPrimary?.imageUrl ?? null,
              finalPosterUrl: partialPrimary?.finalPosterUrl ?? null,
              graphics,
              variations: graphics,
              generationId,
              isPartial: true,
              partialCount: graphics.length,
              headline: partialPrimary?.renderContract?.headline ?? creative.headline,
              subheadline: partialPrimary?.renderContract?.subheadline ?? creative.subheadline,
              cta: partialPrimary?.renderContract?.cta ?? creative.cta,
              renderContract: partialPrimary?.renderContract ?? null,
              imageSourceFlow,
              rendering: { rendered: graphics.some(g => g.rendered), renderer: 'sharp-composite', finalPosterUrl: partialPrimary?.finalPosterUrl ?? null, failureReason: null },
              qualityWarnings: validationWarnings,
            } as never,
          },
        }).catch(err => console.warn('[generate-graphics] partial DB update failed:', err))
      }
    }

    // Last-resort text-only poster if no stock candidate was usable
    if (graphics.length === 0) {
      const config = variationConfigs[0]
      const creativeForVariation: CreativeDirectorOutput = { ...creative, templateVariation: config.variation }
      const renderContract = buildRenderContract({
        creative: creativeForVariation,
        imageCandidate: null,
        imageSource: 'none',
        brandName,
        logoUrl: undefined,
        isInternalSample,
        imageSourceFlow,
        qualityWarnings: validationWarnings,
      }) as any
      renderContract._layoutOverride = config.layoutOverride
      renderContract._variationIndex = 0
      renderContract._variationLabel = config.label

      const textOnlyResult = await renderPosterToPng(renderContract, `${effectiveGenId}_txt`)
      if (textOnlyResult.success && textOnlyResult.finalPosterUrl) {
        graphics.push({
          id: `${effectiveGenId}_v1`,
          type: 'campaign-poster',
          title: creative.headline || 'Campaign Poster',
          description: `${config.label} · ${creative.selectedTemplate} · ${creative.selectedSize}`,
          imageDataUri: textOnlyResult.finalPosterUrl,
          svgDataUri: null,
          source: 'none',
          imageUrl: textOnlyResult.finalPosterUrl,
          url: textOnlyResult.finalPosterUrl,
          previewImageUrl: textOnlyResult.finalPosterUrl,
          finalPosterUrl: textOnlyResult.finalPosterUrl,
          rendered: true,
          renderContract,
          template: creative.selectedTemplate,
          size: creative.selectedSize,
          variationIndex: 0,
          variationLabel: config.label,
          creativeOutput: creative,
          attribution: { photographer: '', photographerUrl: '', text: '', url: '' },
          generationId: effectiveGenId,
          imageSourceFlow,
          qualityWarnings: validationWarnings,
        })
      }
    }

    if (graphics.length === 0) {
      if (generationId) void db.generation.update({ where: { id: generationId }, data: { status: 'FAILED' } }).catch(() => {})
      return NextResponse.json({ error: 'Image generation failed — renderer and image sources both unavailable.' }, { status: 502 })
    }

    // ── STEP 5: Save metadata ─────────────────────────────────────────────────
    const cdCostUsd = (cdInputTokens * 0.0000025) + (cdOutputTokens * 0.00001)
    const primaryGraphic = graphics[0]
    if (generationId) {
      void db.generation.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETE',
          modelUsed: CREATIVE_MODEL,
          inputTokens: cdInputTokens,
          outputTokens: cdOutputTokens,
          tokenCount: cdInputTokens + cdOutputTokens,
          costUsd: cdCostUsd,
          outputData: {
            genType: 'campaign-image',
            companyName: brandName,
            brandName,
            mode: body.mode ?? 'free',
            source: primaryGraphic.source,
            size: creative.selectedSize,
            industry: creative.industry,
            archetype: creative.campaignArchetype,
            templateId: creative.selectedTemplate,
            variation: creative.templateVariation,
            imageUrl: primaryGraphic.imageUrl,
            rawImageUrl: primaryGraphic.renderContract?.backgroundImage?.url ?? null,
            finalPosterUrl: primaryGraphic.finalPosterUrl,
            graphics,
            variations: graphics,
            imageProvider: primaryGraphic.source,
            pexelsImageUrl: primaryGraphic.source === 'pexels' ? primaryGraphic.renderContract?.backgroundImage?.url : null,
            unsplashImageUrl: primaryGraphic.source === 'unsplash' ? primaryGraphic.renderContract?.backgroundImage?.url : null,
            photographer: primaryGraphic.attribution?.photographer ?? null,
            photographerUrl: primaryGraphic.attribution?.photographerUrl ?? null,
            attributionText: primaryGraphic.attribution?.text ?? null,
            attributionUrl: primaryGraphic.attribution?.url ?? null,
            headline: primaryGraphic.renderContract?.headline ?? creative.headline,
            subheadline: primaryGraphic.renderContract?.subheadline ?? creative.subheadline,
            bodyCopy: primaryGraphic.renderContract?.bodyCopy ?? creative.bodyCopy,
            cta: primaryGraphic.renderContract?.cta ?? creative.cta,
            serviceTags: creative.serviceTags,
            renderContract: primaryGraphic.renderContract,
            imageSourceFlow,
            rendering: {
              rendered: graphics.some(g => g.rendered),
              renderer: 'sharp-composite',
              finalPosterUrl: primaryGraphic.finalPosterUrl,
              failureReason: renderingFailures.length ? renderingFailures.map(f => `v${f.variationIndex + 1}: ${f.reason}`).join('; ') : null,
            },
            costEstimate: buildCostEstimate(),
            qualityWarnings: validationWarnings,
          } as never,
        },
      }).catch(err => console.warn('[generate-graphics] DB update failed:', err))
    }

    // ── STEP 6: Return same response shape, now with up to 4 items ───────────
    await incrementUsage(userId)
    return NextResponse.json({ graphics, generationId })

  } catch (error) {
    console.error('[generate-graphics] Unhandled exception:', error)
    if (generationId) {
      void db.generation.update({ where: { id: generationId }, data: { status: 'FAILED' } }).catch(() => {})
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error during graphic generation' }, { status: 500 })
  }
}
