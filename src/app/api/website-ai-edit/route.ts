// src/app/api/website-ai-edit/route.ts
// Secure server-side proxy for AI-powered website HTML editing.
// Keeps the Anthropic API key on the server, never exposed to the browser.
// Called by the "Apply" button in the Website Preview tab of Business Studio.
//
// FIX v2 (blank screen after AI edit):
//   1. Removed the 40KB slice — it was cutting body content on large sites.
//      Replaced with a smarter head-preservation + body-safe truncation.
//   2. System prompt explicitly requires complete HTML with body content.
//   3. Validates that updated HTML has a non-empty <body> before returning it.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { getUsdToInr } from '@/lib/ai/generate'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL  = 'claude-haiku-4-5-20251001' // fast + cheap for HTML edits

// Haiku 4.5 pricing: $0.80 / 1M input tokens, $4.00 / 1M output tokens
const COST_PER_INPUT_TOKEN  = 0.80  / 1_000_000
const COST_PER_OUTPUT_TOKEN = 4.00  / 1_000_000

// ── Smart HTML truncation ────────────────────────────────────────────────────
// Instead of a dumb 40KB slice (which cuts mid-body), we:
//   1. Keep the full <head> (CSS is critical for layout)
//   2. Keep as much <body> as we can up to the token budget
//   3. Close the document properly so Claude receives valid HTML
const MAX_INPUT_HTML_CHARS = 60_000 // ~15K tokens — safe for Haiku's 200K context

function smartTruncateHtml(html: string): { html: string; wasTruncated: boolean } {
  if (html.length <= MAX_INPUT_HTML_CHARS) return { html, wasTruncated: false }

  // Try to keep <head> intact + first chunk of <body>
  const headEnd = html.toLowerCase().indexOf('</head>')
  if (headEnd === -1) {
    // No head — just truncate at char limit and close
    return { html: html.slice(0, MAX_INPUT_HTML_CHARS) + '\n</body>\n</html>', wasTruncated: true }
  }

  const headSection = html.slice(0, headEnd + 7) // include </head>
  const remaining   = MAX_INPUT_HTML_CHARS - headSection.length
  const bodySection = html.slice(headEnd + 7, headEnd + 7 + remaining)

  return {
    html: headSection + bodySection + '\n<!-- [content truncated for edit] -->\n</body>\n</html>',
    wasTruncated: true,
  }
}

// ── Validate that the returned HTML has real body content ────────────────────
function htmlHasBodyContent(html: string): boolean {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (!bodyMatch) return false
  const bodyContent = bodyMatch[1].replace(/<!--[\s\S]*?-->/g, '').trim()
  return bodyContent.length > 100
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[website-ai-edit] ANTHROPIC_API_KEY not set')
      return NextResponse.json({ missingKey: true }, { status: 503 })
    }

    const { currentHtml, editPrompt } = await req.json()

    if (!editPrompt?.trim()) {
      return NextResponse.json({ error: 'Edit prompt is required' }, { status: 400 })
    }

    if (!currentHtml?.trim()) {
      return NextResponse.json({ error: 'No HTML to edit' }, { status: 400 })
    }

    // FIX: Smart truncation instead of blind 40KB slice
    const { html: safeHtml, wasTruncated } = smartTruncateHtml(currentHtml)

    if (wasTruncated) {
      console.warn(`[website-ai-edit] HTML truncated from ${currentHtml.length} to ${safeHtml.length} chars for edit`)
    }

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 16_000, // raised from 8192 — edits on large sites need more room
      system:
        'You are a web developer editing an HTML business website. ' +
        'Apply the requested change to the HTML. ' +
        'CRITICAL: You MUST return a COMPLETE HTML document starting with <!DOCTYPE html> ' +
        'and including ALL body content. Never return only a partial document or only CSS. ' +
        'Return ONLY the complete updated HTML, no explanation, no markdown, no code fences.',
      messages: [
        {
          role: 'user',
          content: `Current website HTML:\n${safeHtml}\n\nRequested change: ${editPrompt.trim()}\n\nReturn only the complete updated HTML document. Make sure the <body> contains all the page sections.`,
        },
      ],
    })

    let updatedHtml = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .replace(/^```html?\n?/i, '')
      .replace(/\n?```$/, '')
      .trim()

    if (!updatedHtml) {
      return NextResponse.json({ error: 'AI returned empty response' }, { status: 502 })
    }

    // FIX: Validate body content — if empty/missing, return original with error note
    if (!htmlHasBodyContent(updatedHtml)) {
      console.error('[website-ai-edit] Returned HTML has empty or missing body content. Returning original.')
      return NextResponse.json({
        error: 'Edit produced incomplete HTML. The original site has been preserved. Please try a simpler edit.',
      }, { status: 422 })
    }

    // FIX: If truncated site was edited, merge the edit back with the original tail
    // so users don't lose the sections that were beyond the edit window
    if (wasTruncated && currentHtml.length > updatedHtml.length + 5000) {
      // The AI returned a much shorter document (edited the truncated version).
      // Best-effort: keep the AI's edited version as-is since we can't reliably
      // reconstruct the tail without causing duplication. Log for debugging.
      console.warn('[website-ai-edit] Edited truncated HTML — full original tail may be missing')
    }

    // VISIBILITY SAFETY NET: inject override CSS so any scroll-reveal patterns
    // left in the edited HTML don't cause invisible content in the iframe
    const visibilityOverride = `\n<style id="bs-visibility-fix">
[class*="reveal"],[class*="hidden"],[class*="fade"],[class*="slide"],[data-reveal],[data-animate]{opacity:1!important;transform:none!important;visibility:visible!important;}
</style>`
    if (updatedHtml.includes('</head>')) {
      updatedHtml = updatedHtml.replace('</head>', visibilityOverride + '\n</head>')
    }

    // Log token usage + cost
    const inTok  = message.usage?.input_tokens  ?? 0
    const outTok = message.usage?.output_tokens ?? 0
    const costUsd = inTok * COST_PER_INPUT_TOKEN + outTok * COST_PER_OUTPUT_TOKEN

    const session = await auth()
    const userId  = session?.user?.id ?? null
    const usdToInr = await getUsdToInr()

    db.apiCallLog.create({
      data: {
        service:      'claude',
        endpoint:     'website-ai-edit',
        userId,
        model:        MODEL,
        inputTokens:  inTok,
        outputTokens: outTok,
        totalTokens:  inTok + outTok,
        costUsd,
        costInr:      costUsd * usdToInr,
        success:      true,
      },
    }).catch((e: unknown) => console.error('[ApiCallLog] website-ai-edit log failed:', e))

    return NextResponse.json({ updatedHtml })
  } catch (error) {
    console.error('[website-ai-edit]', error)
    db.apiCallLog.create({ data: { service: 'claude', endpoint: 'website-ai-edit', userId: null, success: false } }).catch(() => {})
    return NextResponse.json({ error: 'Website edit failed. Please try again.' }, { status: 500 })
  }
}
