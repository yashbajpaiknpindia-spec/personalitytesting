// src/app/api/generate-logo-image/route.ts
// Logo image generator — OpenAI / ChatGPT image format only.
// OpenAI image generation only. If image generation is unavailable,
// the user sees a clear unavailable/failure message instead of receiving a vector fallback.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { getUsdToInr } from '@/lib/ai/generate'
import { checkGlobalLimit, incrementUsage } from '@/lib/rateLimit'

const OPENAI_IMAGE_MODEL = process.env.OPENAI_LOGO_IMAGE_MODEL || 'gpt-image-1'
const COST_PER_IMAGE_USD = 0.04

function buildOpenAILogoPrompt(params: {
  companyName: string
  industry?: string
  logoConceptName?: string
  symbolIdea?: string
  primaryColors?: string[]
  tone?: string
  editPrompt?: string
}): string {
  const { companyName, industry, logoConceptName, symbolIdea, primaryColors, tone, editPrompt } = params
  const colors = primaryColors?.length ? primaryColors.slice(0, 4).join(', ') : '#C9A84C, #111111'
  return [
    `Create a clean premium logo for the brand named "${companyName}".`,
    industry ? `Business category: ${industry}.` : 'Business category: modern business brand.',
    logoConceptName ? `Logo direction: ${logoConceptName}.` : 'Logo direction: modern, memorable, premium and simple.',
    symbolIdea ? `Symbol idea: ${symbolIdea}.` : 'Symbol idea: refined abstract geometric mark with a clear wordmark.',
    `Use only these brand colours where possible: ${colors}.`,
    tone ? `Tone: ${tone}.` : 'Tone: professional, trustworthy and premium.',
    editPrompt ? `User requested edit to the existing saved logo direction: ${editPrompt}. Keep the same brand identity but apply this change clearly.` : '',
    'Flat vector-logo look, centered composition, white or transparent-looking clean background, sharp edges, no mockup scene, no watermark, no extra explanatory text, no random letters, no spelling mistakes.',
  ].filter(Boolean).join(' ')
}

function extractOpenAIImageDataUri(data: any): string | null {
  const item = data?.data?.[0]
  const b64 = item?.b64_json
    ?? item?.image_base64
    ?? item?.output?.[0]?.data
    ?? item?.output?.[0]?.b64_json
    ?? null
  const url = item?.url ?? null
  if (typeof b64 === 'string' && b64.trim()) return `data:image/png;base64,${b64.trim()}`
  if (typeof url === 'string' && url.trim()) return url.trim()
  return null
}

async function generateOpenAILogo(params: {
  openaiKey: string
  prompt: string
}): Promise<{ imageDataUri: string | null; modelUsed?: string; error?: string }> {
  const { openaiKey, prompt } = params

  const requestedModel = OPENAI_IMAGE_MODEL
  const payloads: Array<{ model: string; payload: Record<string, unknown> }> = []
  const pushPayload = (model: string, payload: Record<string, unknown>) => {
    if (!model) return
    payloads.push({ model, payload: { ...payload, model, prompt, n: 1, size: '1024x1024' } })
  }

  // GPT image payloads. Some accounts reject quality/output_format/response_format,
  // so progressively remove optional fields before trying other image models.
  pushPayload(requestedModel, { quality: 'high', output_format: 'png' })
  pushPayload(requestedModel, {})
  if (requestedModel !== 'gpt-image-1') {
    pushPayload('gpt-image-1', { quality: 'high', output_format: 'png' })
    pushPayload('gpt-image-1', {})
  }
  // Compatibility fallbacks for accounts that still have DALL·E image access but
  // not gpt-image-1 access.
  if (requestedModel !== 'dall-e-3') pushPayload('dall-e-3', { quality: 'standard' })
  if (requestedModel !== 'dall-e-2') pushPayload('dall-e-2', { response_format: 'b64_json' })

  const seen = new Set<string>()
  let lastError = ''
  for (const attempt of payloads) {
    const key = JSON.stringify(attempt.payload)
    if (seen.has(key)) continue
    seen.add(key)
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify(attempt.payload),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!res.ok) {
        lastError = data?.error?.message || text || `OpenAI image API failed with ${res.status}`
        console.warn(`[generate-logo-image] ${attempt.model} failed:`, lastError)
        continue
      }
      const imageDataUri = extractOpenAIImageDataUri(data)
      if (imageDataUri) return { imageDataUri, modelUsed: attempt.model }
      lastError = 'OpenAI image API returned no image data.'
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.warn(`[generate-logo-image] ${attempt.model} exception:`, lastError)
    }
  }

  return { imageDataUri: null, modelUsed: requestedModel, error: lastError || 'OpenAI image generation failed.' }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return NextResponse.json({ error: 'You must be logged in to generate logos.' }, { status: 401 })
  }

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
    const { companyName, industry, logoConceptName, symbolIdea, primaryColors, tone, editPrompt } = body

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const template = await db.template.findFirst({ where: { slug: 'noir-card' } }) ?? await db.template.findFirst()
    const gen = await db.generation.create({
      data: {
        userId,
        templateId: template?.id ?? null,
        status: 'PENDING',
        inputData: body as never,
        enrichedData: { genType: 'logo-image', companyName, industry },
      },
    }).catch(() => null)
    if (gen) generationId = gen.id

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      if (generationId) db.generation.update({ where: { id: generationId }, data: { status: 'FAILED' } }).catch(() => {})
      return NextResponse.json({ error: 'Logo image generation is currently unavailable. Please try again later.', missingKey: true }, { status: 503 })
    }

    const usdToInr = await getUsdToInr()
    const prompt = buildOpenAILogoPrompt({ companyName, industry, logoConceptName, symbolIdea, primaryColors, tone, editPrompt })
    const result = await generateOpenAILogo({ openaiKey, prompt })

    if (!result.imageDataUri) {
      console.warn('[generate-logo-image] OpenAI failed:', result.error)
      if (generationId) db.generation.update({ where: { id: generationId }, data: { status: 'FAILED' } }).catch(() => {})
      await db.apiCallLog.create({
        data: {
          service: 'openai', endpoint: 'generate-logo-image', userId,
          model: result.modelUsed ?? OPENAI_IMAGE_MODEL,
          costUsd: 0,
          costInr: 0,
          generationId,
          success: false,
        } as any,
      }).catch(() => {})
      return NextResponse.json({ error: result.error || 'Logo image generation failed. Please try again.' }, { status: 502 })
    }

    await db.apiCallLog.create({
      data: {
        service: 'openai', endpoint: 'generate-logo-image', userId,
        model: result.modelUsed ?? OPENAI_IMAGE_MODEL,
        costUsd: COST_PER_IMAGE_USD,
        costInr: COST_PER_IMAGE_USD * usdToInr,
        generationId,
        success: true,
      },
    }).catch(() => {})

    if (generationId) {
      db.generation.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETE',
          outputData: { imageGenerated: true, source: result.modelUsed ?? OPENAI_IMAGE_MODEL, imageDataUri: result.imageDataUri } as never,
          modelUsed: result.modelUsed ?? OPENAI_IMAGE_MODEL,
          costUsd: COST_PER_IMAGE_USD,
        },
      }).catch(() => {})
    }

    await incrementUsage(userId)

    return NextResponse.json({
      imageDataUri: result.imageDataUri,
      source: result.modelUsed ?? OPENAI_IMAGE_MODEL,
      generationId,
    })
  } catch (error) {
    console.error('[generate-logo-image] Unhandled exception:', error)
    if (generationId) db.generation.update({ where: { id: generationId }, data: { status: 'FAILED' } }).catch(() => {})
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error during logo generation' }, { status: 500 })
  }
}
