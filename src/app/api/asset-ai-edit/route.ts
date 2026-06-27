import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { getUsdToInr } from '@/lib/ai/generate'

export const dynamic = 'force-dynamic'

const MODEL = process.env.ASSET_EDIT_MODEL || 'claude-haiku-4-5-20251001'

function safeJson(value: unknown, limit = 12000) {
  const text = JSON.stringify(value ?? {}, null, 2)
  return text.length > limit ? text.slice(0, limit) + '\n...TRUNCATED...' : text
}

function cleanJson(raw: string) {
  return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function deepMerge(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    if (isPlainObject(value) && isPlainObject(merged[key])) merged[key] = deepMerge(merged[key] as Record<string, unknown>, value)
    else merged[key] = value
  }
  return merged
}

function allowedFieldsFor(assetType: string) {
  const common = ['companyName','industry','tagline','brandStory','brandVoice','primaryColors']
  const copy = ['copyHeadlines','copySocialCaptions','copyEmailSubject','copyEmailBody','copyCtas','copyAdCopy','bannerHeadline','bannerSubheadline','bannerCta','headline','subheadline','cta']
  const strategy = ['strategy','positioning','audiencePersona','offer','marketingPlan','brandPillars']
  const calendar = ['contentCalendar','calendar','weeklyPlan','postIdeas','contentPillars']
  const website = ['websiteSections','services','flyerBody','flyerHighlights','heroHeadline','about','copyCtas']
  const logo = ['logoConceptName','logoConceptDescription','logoSymbolIdea','logoKeywords']

  if (/copy|content/i.test(assetType)) return [...common, ...copy]
  if (/strategy/i.test(assetType)) return [...common, ...strategy]
  if (/calendar/i.test(assetType)) return [...common, ...calendar]
  if (/website/i.test(assetType)) return [...common, ...website, ...copy]
  if (/logo/i.test(assetType)) return [...common, ...logo]
  return [...common, ...copy, ...strategy, ...calendar, ...website, ...logo]
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'You must be logged in to edit assets.' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const generationId = String(body.generationId ?? body.id ?? '').trim()
    const editPrompt = String(body.editPrompt ?? body.prompt ?? '').trim()
    const assetType = String(body.assetType ?? 'asset').trim().toLowerCase()

    if (!generationId) return NextResponse.json({ error: 'generationId is required.' }, { status: 400 })
    if (!editPrompt) return NextResponse.json({ error: 'Tell us what to change.' }, { status: 400 })

    const generation = await db.generation.findFirst({
      where: { id: generationId, userId },
      select: { id: true, inputData: true, outputData: true },
    })
    if (!generation) return NextResponse.json({ error: 'Asset not found.' }, { status: 404 })

    const outputData = isPlainObject(generation.outputData) ? generation.outputData : {}
    const inputData = isPlainObject(generation.inputData) ? generation.inputData : {}

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'AI editing is unavailable right now.' }, { status: 503 })

    const allowed = allowedFieldsFor(assetType)
    const client = new Anthropic({ apiKey })
    const system = `You are Brand Syndicate's asset editor. Return ONLY valid JSON.

The user wants to edit one saved generated asset, not create unrelated content.
Return a JSON object with this shape exactly:
{"patch":{},"summary":""}

Rules:
- Only put changed fields inside patch.
- Keep the same brand, industry, and asset purpose unless the user explicitly asks to change them.
- Allowed top-level patch fields for this asset: ${allowed.join(', ')}.
- Do not include image data, base64, markdown, commentary, or code fences.
- For arrays, return the full revised array.
- For objects like strategy/contentCalendar, return the revised object or changed nested keys.
- summary must be one short sentence describing what changed.`

    const user = `Asset type: ${assetType}
User edit instruction: ${editPrompt}

Saved input data:
${safeJson(inputData, 5000)}

Current output data:
${safeJson(outputData, 12000)}

Return only JSON.`

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const raw = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('').trim()
    const parsed = JSON.parse(cleanJson(raw)) as { patch?: unknown; summary?: unknown }
    const rawPatch = isPlainObject(parsed.patch) ? parsed.patch : {}

    // Guard against unrelated fields sneaking in.
    const patch: Record<string, unknown> = {}
    for (const key of Object.keys(rawPatch)) {
      if (allowed.includes(key)) patch[key] = rawPatch[key]
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No safe changes were produced. Try a clearer edit instruction.' }, { status: 422 })
    }

    const updatedOutput = deepMerge(outputData, patch)
    await db.generation.update({
      where: { id: generation.id },
      data: { outputData: updatedOutput as never },
    })

    const usage = msg.usage
    const usdToInr = await getUsdToInr().catch(() => 84)
    const costUsd = ((usage.input_tokens ?? 0) * 0.0000008) + ((usage.output_tokens ?? 0) * 0.000004)
    void db.apiCallLog.create({
      data: {
        service: 'claude', endpoint: 'asset-ai-edit', userId,
        model: MODEL,
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        totalTokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
        costUsd,
        costInr: costUsd * usdToInr,
        generationId: generation.id,
        success: true,
        query: editPrompt.slice(0, 120),
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      generationId: generation.id,
      patch,
      outputData: updatedOutput,
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Asset updated.',
    })
  } catch (err) {
    console.error('[asset-ai-edit]', err)
    return NextResponse.json({ error: 'AI edit failed. Please try again.' }, { status: 500 })
  }
}
