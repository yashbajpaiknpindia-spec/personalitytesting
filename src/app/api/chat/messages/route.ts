import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { answerFromLocalIntelligence, shouldUseExternalApi } from '@/lib/chat/local-intelligence'
import { calcCostUsd, getUsdToInr } from '@/lib/ai/generate'
import { checkGlobalLimit, incrementUsage } from '@/lib/rateLimit'

const DEFAULT_CLAUDE_MODEL = process.env.CHAT_MODEL || 'claude-haiku-4-5-20251001'

type ChatRole = 'user' | 'assistant'

function trimTitle(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 58 ? clean.slice(0, 55) + '…' : clean || 'New chat'
}

async function callOpenAI(message: string, history: Array<{ role: ChatRole; content: string }>) {
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: 'You are Brand Syndicate AI, a concise business growth and creative assistant. Answer in plain conversational text. No markdown formatting, no hashtags, no ** bold **, no horizontal lines. Use short paragraphs or numbered lists. Use the user business context when available. Do not mention provider names.' },
        ...history.slice(-12),
        { role: 'user', content: message },
      ],
    }),
  })
  if (!response.ok) throw new Error(`OpenAI chat failed: ${response.status}`)
  const data = await response.json()
  const answer = data.choices?.[0]?.message?.content || 'I could not generate a response.'
  const inputTokens = data.usage?.prompt_tokens || 0
  const outputTokens = data.usage?.completion_tokens || 0
  const totalTokens = data.usage?.total_tokens || inputTokens + outputTokens
  // Conservative configurable fallback pricing. Override in admin later if needed.
  const costUsd = (inputTokens / 1_000_000) * 0.15 + (outputTokens / 1_000_000) * 0.60
  return { answer, provider: 'openai', model, inputTokens, outputTokens, totalTokens, costUsd }
}

async function callClaude(message: string, history: Array<{ role: ChatRole; content: string }>, localContext: string[]) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: DEFAULT_CLAUDE_MODEL,
    max_tokens: 1200,
    system: `You are Brand Syndicate AI. You help business owners with websites, branding, graphics, strategy, WhatsApp funnels, and cost-aware execution. Answer in plain conversational text. Do NOT use markdown formatting: no hashtags, no ** bold **, no bullet hyphens, no horizontal lines, no backticks. Use numbered lists or short paragraphs instead. Keep answers focused and direct. Never reveal provider names.`,
    messages: [
      ...history.slice(-12).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: `${localContext.length ? `Relevant local Brand Syndicate context:\n${localContext.join('\n\n')}\n\n` : ''}${message}` },
    ],
  })
  const answer = response.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('\n').trim()
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const totalTokens = inputTokens + outputTokens
  const costUsd = calcCostUsd(DEFAULT_CLAUDE_MODEL, inputTokens, outputTokens)
  return { answer, provider: 'claude', model: DEFAULT_CLAUDE_MODEL, inputTokens, outputTokens, totalTokens, costUsd }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const message = String(body.message || '').trim()
  let threadId = body.threadId ? String(body.threadId) : ''
  const mode = String(body.mode || 'brand_studio')
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  let thread = threadId
    ? await db.chatThread.findFirst({ where: { id: threadId, userId } })
    : null

  if (!thread) {
    thread = await db.chatThread.create({
      data: { userId, title: trimTitle(message), mode, lastMessageAt: new Date(), messageCount: 0 },
    })
    threadId = thread.id
  }

  const userMessageRow = await db.chatMessage.create({
    data: { threadId, userId, role: 'user', content: message, provider: 'local', usedExternalApi: false },
  })

  const previous = await db.chatMessage.findMany({
    where: { threadId, NOT: { id: userMessageRow.id } },
    orderBy: { createdAt: 'asc' },
    take: 24,
    select: { role: true, content: true },
  })
  const history = previous
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as ChatRole, content: m.content }))

  const local = answerFromLocalIntelligence(message)
  const mustUseExternal = shouldUseExternalApi(message, local)
  const usdToInr = await getUsdToInr()

  let result: { answer: string; provider: string; model: string | null; inputTokens: number; outputTokens: number; totalTokens: number; costUsd: number; usedExternal: boolean; confidence: number; limitBlocked?: boolean }

  try {
    if (!mustUseExternal) {
      result = { answer: local.answer, provider: 'local', model: null, inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, usedExternal: false, confidence: local.confidence }
    } else {
      const limitResult = await checkGlobalLimit(userId)
      if (!limitResult.allowed) {
        result = {
          answer: 'We could not generate content right now because your generation limit is over. Please upgrade your plan or wait for your quota to reset.',
          provider: 'local',
          model: null,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          costUsd: 0,
          usedExternal: false,
          confidence: 1,
          limitBlocked: true,
        }
      } else if (process.env.ANTHROPIC_API_KEY) {
      const r = await callClaude(message, history, local.contextUsed)
      result = { ...r, usedExternal: true, confidence: local.confidence }
      } else if (process.env.OPENAI_API_KEY) {
        const r = await callOpenAI(message, history)
        result = { ...r, usedExternal: true, confidence: local.confidence }
      } else {
        result = { answer: local.answer, provider: 'local', model: null, inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, usedExternal: false, confidence: local.confidence }
      }
    }
  } catch (error) {
    console.error('[chat] external call failed:', error)
    result = { answer: local.answer, provider: 'local', model: null, inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, usedExternal: false, confidence: local.confidence }
  }

  const costInr = result.costUsd * usdToInr
  const assistantMessage = await db.chatMessage.create({
    data: {
      threadId,
      userId,
      role: 'assistant',
      content: result.answer,
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.totalTokens,
      costUsd: result.costUsd,
      costInr,
      usedExternalApi: result.usedExternal,
      confidence: result.confidence,
      metadata: { localContextUsed: local.contextUsed, externalReason: mustUseExternal ? 'uncertain_or_creative_request' : 'local_confident' },
    },
  })

  await db.chatThread.update({
    where: { id: threadId },
    data: {
      lastMessageAt: new Date(),
      messageCount: { increment: 2 },
      totalCostUsd: { increment: result.costUsd },
      totalCostInr: { increment: costInr },
      title: thread.title === 'New chat' ? trimTitle(message) : thread.title,
    },
  })

  if (result.usedExternal) {
    await incrementUsage(userId).catch(e => console.error('[chat] usage increment failed:', e))
    db.apiCallLog.create({
      data: {
        service: result.provider,
        endpoint: 'chat',
        userId,
        model: result.model || undefined,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        costUsd: result.costUsd,
        costInr,
        success: true,
      },
    }).catch(e => console.error('[chat] apiCallLog failed:', e))
  }

  return NextResponse.json({ threadId, message: assistantMessage, usage: { ...result, costInr } })
}
