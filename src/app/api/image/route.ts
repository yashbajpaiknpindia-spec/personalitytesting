// src/app/api/image/route.ts
// Generates a contextual background/hero image using OpenAI gpt-image-1.
// Used by the public portfolio shell (PublicPortfolioShell) for hero and work section imagery.
// Falls back gracefully if OPENAI_API_KEY is not configured.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { getUsdToInr } from '@/lib/ai/generate'

// In-process 1-hour cache keyed by query — avoids redundant OpenAI calls
const cache = new Map<string, { b64: string; expiresAt: number }>()

const OPENAI_IMAGE_MODEL = 'gpt-image-1'
const COST_PER_IMAGE_USD = 0.04

function buildImagePrompt(query: string): string {
  return [
    'A high-quality, professional, cinematic photograph suitable for a hero background.',
    `Subject/context: ${query}.`,
    'Wide landscape orientation (16:9 feel). Atmospheric, moody lighting.',
    'High production value. Subtle depth of field. No text overlays. No watermarks.',
    'Editorial photography style. Clean composition.',
  ].join(' ')
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ url: null }, { status: 400 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[/api/image] OPENAI_API_KEY is not set — returning null')
    return NextResponse.json({ url: null })
  }

  // ── Cache hit ──────────────────────────────────────────────────────────────
  const cached = cache.get(query)
  if (cached && Date.now() < cached.expiresAt) {
    const session = await auth()
    db.apiCallLog.create({
      data: {
        service:  'openai',
        endpoint: 'image-route',
        userId:   session?.user?.id ?? null,
        query,
        success:  true,
        cached:   true,
      },
    }).catch(() => {})
    const dataUri = `data:image/png;base64,${cached.b64}`
    return NextResponse.json({ url: dataUri }, { headers: { 'Cache-Control': 'public, max-age=3600' } })
  }

  // ── Generate via gpt-image-1 ───────────────────────────────────────────────
  try {
    const prompt = buildImagePrompt(query)

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:         OPENAI_IMAGE_MODEL,
        prompt,
        n:             1,
        size:          '1536x1024',   // landscape, closest to 16:9
        quality:       'medium',       // medium quality = cheaper for background use
        output_format: 'b64_json',
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[/api/image] OpenAI error', res.status, errText.slice(0, 300))
      const session = await auth()
      db.apiCallLog.create({
        data: {
          service:  'openai',
          endpoint: 'image-route',
          userId:   session?.user?.id ?? null,
          query,
          success:  false,
          cached:   false,
        },
      }).catch(() => {})
      return NextResponse.json({ url: null })
    }

    const data = await res.json() as { data?: Array<{ b64_json?: string }> }
    const b64  = data.data?.[0]?.b64_json ?? null

    if (b64) {
      cache.set(query, { b64, expiresAt: Date.now() + 3_600_000 }) // 1-hour cache
    }

    const session   = await auth()
    const usdToInr  = await getUsdToInr()

    db.apiCallLog.create({
      data: {
        service:      'openai',
        endpoint:     'image-route',
        userId:       session?.user?.id ?? null,
        model:        OPENAI_IMAGE_MODEL,
        inputTokens:  0,
        outputTokens: 0,
        totalTokens:  0,
        costUsd:      COST_PER_IMAGE_USD,
        costInr:      COST_PER_IMAGE_USD * usdToInr,
        query,
        success:      !!b64,
        cached:       false,
      },
    }).catch(() => {})

    const url = b64 ? `data:image/png;base64,${b64}` : null
    return NextResponse.json({ url }, { headers: { 'Cache-Control': 'public, max-age=3600' } })
  } catch (err) {
    console.error('[/api/image] fetch error', err)
    return NextResponse.json({ url: null })
  }
}
