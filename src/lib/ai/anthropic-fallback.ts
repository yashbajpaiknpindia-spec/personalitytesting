// src/lib/ai/anthropic-fallback.ts
// Anthropic model wrapper that prevents hard failures caused by stale/invalid
// model IDs or temporary overloads. It tries configured model first, then safe
// fallbacks, while preserving the exact response shape used by existing routes.

const FALLBACK_MODELS = [
  process.env.CLAUDE_MODEL,
  process.env.ANTHROPIC_MODEL,
  process.env.CLAUDE_TEMPLATE_MODEL,
  'claude-sonnet-4-5',
  'claude-3-5-sonnet-latest',
  'claude-haiku-4-5-20251001',
  'claude-3-5-haiku-latest',
].filter(Boolean) as string[]

function unique(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const v = String(value || '').trim()
    if (!v || seen.has(v)) continue
    seen.add(v); out.push(v)
  }
  return out
}

function isRecoverableAnthropicError(error: unknown): boolean {
  const e = error as { status?: number; message?: string }
  const msg = String(e?.message || '').toLowerCase()
  return (
    e?.status === 400 ||
    e?.status === 404 ||
    e?.status === 429 ||
    e?.status === 529 ||
    msg.includes('model') ||
    msg.includes('not found') ||
    msg.includes('overloaded') ||
    msg.includes('rate limit') ||
    msg.includes('invalid_request_error')
  )
}

async function pause(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

export async function createAnthropicMessage(
  client: any,
  params: Record<string, unknown>,
  preferredModels: Array<string | undefined | null> = [],
): Promise<{ message: any; model: string }> {
  const models = unique([...preferredModels, String(params.model || ''), ...FALLBACK_MODELS])
  let lastError: unknown = null

  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
      const message = await client.messages.create({ ...params, model })
      return { message, model }
    } catch (error) {
      lastError = error
      const recoverable = isRecoverableAnthropicError(error)
      console.warn(`[Anthropic] model attempt failed (${model}):`, error)
      if (!recoverable || i === models.length - 1) break
      const status = (error as { status?: number })?.status
      if (status === 429 || status === 529) await pause(Math.min(4000, 800 * (i + 1)))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Anthropic request failed')
}
