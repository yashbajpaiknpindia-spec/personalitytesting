// src/lib/ai/safe-json.ts
// Small server-safe helpers for AI JSON responses. AI providers sometimes return
// fenced JSON, leading text, or a trailing explanation even when asked not to.
// These helpers prevent otherwise-good generations from failing at JSON.parse().

export function stripJsonFences(text: string): string {
  return String(text || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function findBalancedJsonSlice(text: string): string | null {
  const clean = stripJsonFences(text)
  const startObj = clean.indexOf('{')
  const startArr = clean.indexOf('[')
  let start = -1
  let open = ''
  let close = ''
  if (startObj >= 0 && (startArr < 0 || startObj < startArr)) {
    start = startObj
    open = '{'
    close = '}'
  } else if (startArr >= 0) {
    start = startArr
    open = '['
    close = ']'
  }
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i]
    if (inString) {
      if (escaped) { escaped = false; continue }
      if (ch === '\\') { escaped = true; continue }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') { inString = true; continue }
    if (ch === open) depth++
    if (ch === close) {
      depth--
      if (depth === 0) return clean.slice(start, i + 1)
    }
  }
  return clean.slice(start)
}

export function parseAIJson<T>(text: string, fallback: T): T {
  const candidates = [stripJsonFences(text), findBalancedJsonSlice(text)].filter(Boolean) as string[]
  for (const candidate of candidates) {
    try { return JSON.parse(candidate) as T } catch { /* try next */ }
  }
  return fallback
}

export function extractAIText(content: unknown): string {
  if (!Array.isArray(content)) return ''
  return content
    .filter((b: any) => b?.type === 'text')
    .map((b: any) => String(b?.text ?? ''))
    .join('')
}
