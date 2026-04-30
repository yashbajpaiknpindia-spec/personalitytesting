// src/app/api/generate-banner/route.ts
// Business Banner Generator — ChatGPT (gpt-4o) is the PRIMARY engine.
// Claude (claude-haiku-4-5-20251001) is the FALLBACK used only when OpenAI
// fails or is unavailable. This is intentional: OpenAI's DALL-E / GPT-4o
// vision yields richer visual-design guidance for marketing banners.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { checkUserConcurrency, checkMonthlyUsage } from '@/lib/rateLimit'

// ── Model config ──────────────────────────────────────────────────────────────
const OPENAI_MODEL   = 'gpt-4o'
const CLAUDE_MODEL   = 'claude-haiku-4-5-20251001'

const claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Cost helpers ──────────────────────────────────────────────────────────────
function calcClaudeCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * 0.0000008) + (outputTokens * 0.000004)
}
function calcOpenAICost(inputTokens: number, outputTokens: number) {
  // GPT-4o: $5/M input, $15/M output
  return (inputTokens * 0.000005) + (outputTokens * 0.000015)
}

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildBannerPrompt(data: BannerInput): string {
  return `You are a senior brand designer and marketing copywriter.

Generate a comprehensive set of marketing BANNER design specifications for a business.

Business details:
- Company: ${data.companyName}
- Industry: ${data.industry || 'Not specified'}
- Tagline: ${data.tagline || 'None'}
- Description: ${data.description || 'None'}
- Target Audience: ${data.audience || 'General'}
- Brand Tone: ${data.tone || 'professional'}
- Campaign Goal: ${data.campaignGoal || 'Brand awareness'}
- Platform Focus: ${data.platforms?.join(', ') || 'Instagram, LinkedIn, Google Display'}

Generate EXACTLY this JSON — no preamble, no markdown fences, only valid JSON:
{
  "banners": {
    "hero": {
      "headline": "primary headline (max 8 words, punchy)",
      "subheadline": "supporting text (max 16 words)",
      "cta": "call to action button text (2-4 words)",
      "colorScheme": {
        "background": "#hexcode",
        "primary": "#hexcode",
        "accent": "#hexcode",
        "text": "#hexcode"
      },
      "layout": "left-heavy | centered | right-heavy | diagonal",
      "visualStyle": "describe the visual style in 15 words",
      "fontPairing": { "display": "font name", "body": "font name" },
      "imageDirection": "photography style or illustration type to use (20 words)",
      "dimensions": { "width": 1920, "height": 1080 }
    },
    "square": {
      "headline": "headline for 1:1 format",
      "subheadline": "supporting text",
      "cta": "CTA text",
      "colorScheme": { "background": "#hexcode", "primary": "#hexcode", "accent": "#hexcode", "text": "#hexcode" },
      "layout": "centered | split",
      "visualStyle": "visual style description",
      "imageDirection": "image direction",
      "dimensions": { "width": 1080, "height": 1080 }
    },
    "story": {
      "headline": "vertical format headline (max 6 words)",
      "subheadline": "short supporting text",
      "cta": "CTA",
      "colorScheme": { "background": "#hexcode", "primary": "#hexcode", "accent": "#hexcode", "text": "#hexcode" },
      "layout": "bottom-third | full-bleed | split-vertical",
      "visualStyle": "visual style",
      "imageDirection": "image direction",
      "dimensions": { "width": 1080, "height": 1920 }
    },
    "leaderboard": {
      "headline": "horizontal banner headline",
      "subheadline": "very brief supporting text",
      "cta": "CTA",
      "colorScheme": { "background": "#hexcode", "primary": "#hexcode", "accent": "#hexcode", "text": "#hexcode" },
      "layout": "left-logo-right-text | centered | logo-cta",
      "visualStyle": "visual style",
      "imageDirection": "image direction",
      "dimensions": { "width": 728, "height": 90 }
    }
  },
  "brandVoice": {
    "tagline": "refined or new tagline for campaign",
    "tone": "one paragraph about brand communication style",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  },
  "campaignStrategy": {
    "hook": "what makes this campaign visually arresting in one sentence",
    "differentiator": "what sets this brand apart visually from competitors",
    "animationSuggestion": "brief animation idea for digital banners"
  },
  "aiModel": "gpt-4o"
}`
}

interface BannerInput {
  companyName: string
  industry?: string
  tagline?: string
  description?: string
  audience?: string
  tone?: string
  campaignGoal?: string
  platforms?: string[]
}

// ── OpenAI call ───────────────────────────────────────────────────────────────
async function callOpenAI(prompt: string): Promise<{ output: Record<string, unknown>; inputTokens: number; outputTokens: number }> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) throw new Error('OPENAI_API_KEY not configured')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 2500,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are a world-class brand designer and marketing strategist specializing in visual identity for modern businesses. Always respond with valid JSON only — no preamble, no markdown, no explanation.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const raw  = data.choices?.[0]?.message?.content ?? ''
  const clean = raw.replace(/```json\n?|```\n?/g, '').trim()
  const output = JSON.parse(clean)

  return {
    output,
    inputTokens:  data.usage?.prompt_tokens     ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  }
}

// ── Claude fallback call ──────────────────────────────────────────────────────
async function callClaude(prompt: string): Promise<{ output: Record<string, unknown>; inputTokens: number; outputTokens: number }> {
  const message = await claudeClient.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt + '\n\nIMPORTANT: Set "aiModel": "claude-fallback" in the JSON.' }],
  })

  const raw = message.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')

  const clean = raw.replace(/```json\n?|```\n?/g, '').trim()
  const output = JSON.parse(clean)

  return {
    output,
    inputTokens:  message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  }
}

type Plan = 'FREE' | 'PRO' | 'TEAM'

export async function POST(req: NextRequest) {
  try {
    const body     = await req.json()
    const input: BannerInput = body
    const { companyName } = input

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const prompt = buildBannerPrompt(input)

    const session   = await auth()
    const usdToInr  = 84 // approximate; production should call exchange rate API

    // ── GUEST PATH ──────────────────────────────────────────────────────────
    if (!session?.user?.id) {
      let result: { output: Record<string, unknown>; inputTokens: number; outputTokens: number }
      let usedFallback = false

      try {
        result = await callOpenAI(prompt)
      } catch (openaiErr) {
        console.warn('[generate-banner] OpenAI failed for guest, falling back to Claude:', openaiErr)
        result = await callClaude(prompt)
        usedFallback = true
      }

      const costUsd = usedFallback
        ? calcClaudeCost(result.inputTokens, result.outputTokens)
        : calcOpenAICost(result.inputTokens, result.outputTokens)

      db.apiCallLog.create({
        data: {
          service:      usedFallback ? 'claude' : 'openai',
          endpoint:     'generate-banner-guest',
          userId:       null,
          model:        usedFallback ? CLAUDE_MODEL : OPENAI_MODEL,
          inputTokens:  result.inputTokens,
          outputTokens: result.outputTokens,
          totalTokens:  result.inputTokens + result.outputTokens,
          costUsd,
          costInr:      costUsd * usdToInr,
          success:      true,
        },
      }).catch(e => console.error('[ApiCallLog] banner-guest log failed:', e))

      return NextResponse.json({
        output:       result.output,
        aiModel:      usedFallback ? 'claude-fallback' : 'gpt-4o',
        usedFallback,
        guest:        true,
        usage:        { inputTokens: result.inputTokens, outputTokens: result.outputTokens, costUsd },
      })
    }

    // ── AUTHENTICATED PATH ──────────────────────────────────────────────────
    const userId   = session.user.id
    const userPlan = session.user.plan as Plan

    const userRecord = await db.user.findUnique({ where: { id: userId } })
    if (userRecord?.isSuspended) {
      return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 })
    }

    const canProceed = await checkUserConcurrency(userId)
    if (!canProceed) {
      return NextResponse.json({ error: 'Too many active generations. Please wait.' }, { status: 429 })
    }

    const withinLimit = await checkMonthlyUsage(userId, userPlan)
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Monthly banner limit reached. Upgrade your plan for more banners.' },
        { status: 403 },
      )
    }

    let template = await db.template.findFirst({ where: { slug: 'noir-card' } })
    if (!template) template = await db.template.findFirst()
    if (!template) return NextResponse.json({ error: 'No templates found' }, { status: 500 })

    const generation = await db.generation.create({
      data: {
        userId,
        templateId: template.id,
        status:     'PENDING',
        inputData:  body as never,
        enrichedData: { type: 'banner', engine: 'gpt-4o-primary' },
      },
    })

    let result: { output: Record<string, unknown>; inputTokens: number; outputTokens: number }
    let usedFallback = false

    try {
      result = await callOpenAI(prompt)
    } catch (openaiErr) {
      console.warn('[generate-banner] OpenAI failed, falling back to Claude:', openaiErr)
      try {
        result = await callClaude(prompt)
        usedFallback = true
      } catch (claudeErr) {
        await db.generation.update({ where: { id: generation.id }, data: { status: 'FAILED' } })
        throw claudeErr
      }
    }

    const costUsd = usedFallback
      ? calcClaudeCost(result.inputTokens, result.outputTokens)
      : calcOpenAICost(result.inputTokens, result.outputTokens)
    const costInr = costUsd * usdToInr

    await db.generation.update({
      where: { id: generation.id },
      data: {
        status:       'COMPLETE',
        outputData:   result.output as never,
        tokenCount:   result.inputTokens + result.outputTokens,
        inputTokens:  result.inputTokens,
        outputTokens: result.outputTokens,
        modelUsed:    usedFallback ? CLAUDE_MODEL : OPENAI_MODEL,
        costUsd,
      },
    })

    db.apiCallLog.create({
      data: {
        service:      usedFallback ? 'claude' : 'openai',
        endpoint:     'generate-banner',
        userId,
        model:        usedFallback ? CLAUDE_MODEL : OPENAI_MODEL,
        inputTokens:  result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens:  result.inputTokens + result.outputTokens,
        costUsd,
        costInr,
        generationId: generation.id,
        success:      true,
      },
    }).catch(e => console.error('[ApiCallLog] banner log failed:', e))

    await db.user.update({
      where: { id: userId },
      data:  { usageCount: { increment: 1 } },
    })

    return NextResponse.json({
      generationId: generation.id,
      output:       result.output,
      aiModel:      usedFallback ? 'claude-fallback' : 'gpt-4o',
      usedFallback,
      usage: {
        inputTokens:  result.inputTokens,
        outputTokens: result.outputTokens,
        tokenCount:   result.inputTokens + result.outputTokens,
        costUsd,
        costInr,
        model: usedFallback ? CLAUDE_MODEL : OPENAI_MODEL,
      },
    })
  } catch (error) {
    console.error('[generate-banner]', error)
    const msg = error instanceof Error ? error.message : 'Banner generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
