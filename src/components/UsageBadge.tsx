// src/components/UsageBadge.tsx
// Visible generation quota badge shown on the generate page.
// Fetches /api/usage and renders a compact pill showing "X / Y used today".
// Refreshes after every generation event via the onRefresh prop (or auto-polls).
//
// Design language: BrandSyndicate gold/dark, monospace font, tight.

'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface UsageData {
  allowed: boolean
  used: number
  limit: number | null
  period: 'daily' | 'monthly'
  resetAt: string
}

interface UsageBadgeProps {
  /** Set to true after a generation completes to trigger a re-fetch */
  refreshTrigger?: number
  /** Optional accent colour override */
  accent?: string
}

export default function UsageBadge({ refreshTrigger = 0, accent = '#C9A84C' }: UsageBadgeProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = useCallback(async () => {
    try {
      const r = await fetch('/api/usage')
      if (r.ok) {
        const d = await r.json()
        setUsage(d)
      }
    } catch {
      // silent fail — badge just stays hidden
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage, refreshTrigger])

  if (loading || !usage) return null
  if (usage.limit === null) return null  // unlimited — no badge needed

  const used     = usage.used
  const limit    = usage.limit
  const period   = usage.period
  const pct      = Math.min(100, Math.round((used / limit) * 100))
  const remaining = Math.max(0, limit - used)
  const exhausted = used >= limit

  // Colour logic: green → amber → red
  const barColor = exhausted
    ? '#E57373'
    : pct >= 80 ? '#F0A500'
    : accent

  // Human-readable reset time
  const resetDate = new Date(usage.resetAt)
  const now       = new Date()
  const hoursLeft = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  const resetLabel = period === 'daily'
    ? hoursLeft <= 1 ? 'resets in <1h' : `resets in ${hoursLeft}h`
    : `resets ${resetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`

  return (
    <div
      title={exhausted
        ? `You have used all ${limit} ${period} generations. ${resetLabel}.`
        : `${remaining} of ${limit} ${period} generations remaining. ${resetLabel}.`
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 10px 5px 8px',
        background: exhausted ? 'rgba(229,115,115,0.08)' : 'rgba(201,168,76,0.06)',
        border: `1px solid ${exhausted ? 'rgba(229,115,115,0.25)' : `${accent}25`}`,
        borderRadius: 100,
        cursor: 'default',
        userSelect: 'none',
        transition: 'all 0.2s',
      }}
    >
      {/* Circular progress indicator */}
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
        {/* Background track */}
        <circle cx="7" cy="7" r="5.5" fill="none" stroke={exhausted ? 'rgba(229,115,115,0.2)' : `${accent}20`} strokeWidth="1.5" />
        {/* Progress arc */}
        <circle
          cx="7" cy="7" r="5.5"
          fill="none"
          stroke={barColor}
          strokeWidth="1.5"
          strokeDasharray={`${2 * Math.PI * 5.5}`}
          strokeDashoffset={`${2 * Math.PI * 5.5 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 7 7)"
          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s' }}
        />
        {/* Centre dot */}
        <circle cx="7" cy="7" r="1.2" fill={barColor} style={{ transition: 'fill 0.3s' }} />
      </svg>

      {/* Text */}
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.06em',
        color: exhausted ? '#E57373' : 'var(--muted)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        {exhausted ? (
          <>
            <span style={{ color: '#E57373', fontWeight: 600 }}>Limit reached</span>
            <span style={{ color: 'var(--muted)', marginLeft: 4 }}>· {resetLabel}</span>
          </>
        ) : (
          <>
            <span style={{ color: barColor, fontWeight: 600 }}>{remaining}</span>
            <span style={{ color: 'var(--muted)' }}> / {limit} left {period === 'daily' ? 'today' : 'this month'}</span>
          </>
        )}
      </span>
    </div>
  )
}
