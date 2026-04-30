import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'

// Claude pricing (per million tokens) — manually curated, updated from Anthropic pricing page
// These are the official Anthropic prices as of 2025
const CLAUDE_PRICING: Record<string, { inputPerM: number; outputPerM: number; cacheWritePerM?: number; cacheReadPerM?: number }> = {
  'claude-opus-4-5':           { inputPerM: 15.0,  outputPerM: 75.0  },
  'claude-sonnet-4-5':         { inputPerM: 3.0,   outputPerM: 15.0  },
  'claude-haiku-4-5-20251001': { inputPerM: 0.80,  outputPerM: 4.0   },
  'claude-opus-4-6':           { inputPerM: 15.0,  outputPerM: 75.0  },
  'claude-sonnet-4-6':         { inputPerM: 3.0,   outputPerM: 15.0  },
  'claude-haiku-4-6':          { inputPerM: 0.80,  outputPerM: 4.0   },
}

// GET /api/admin/live-rates — fetch live USD→INR rate + return Claude pricing
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const isAdmin = session.user.email === ADMIN_EMAIL || (session.user as unknown as Record<string, unknown>).role === 'ADMIN'
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let liveRate: number | null = null
  let rateSource = 'fallback'
  let rateError: string | null = null

  // Try multiple free exchange rate APIs
  const APIs = [
    `https://open.er-api.com/v6/latest/USD`,
    `https://api.exchangerate-api.com/v4/latest/USD`,
  ]

  for (const url of APIs) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 3600 }, // cache 1 hour
      })
      if (res.ok) {
        const data = await res.json() as { rates?: Record<string, number>; conversion_rates?: Record<string, number> }
        const rates = data.rates || data.conversion_rates
        if (rates?.INR) {
          liveRate = Math.round(rates.INR * 100) / 100
          rateSource = 'live'
          break
        }
      }
    } catch (e) {
      rateError = e instanceof Error ? e.message : 'fetch failed'
    }
  }

  return NextResponse.json({
    usdToInr: liveRate,
    rateSource,
    rateError,
    claudePricing: CLAUDE_PRICING,
    fetchedAt: new Date().toISOString(),
  })
}
