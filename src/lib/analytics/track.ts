// src/lib/analytics/track.ts
// Lightweight fire-and-forget event tracker.
// Import and call from any API route or page.

import { db } from '@/lib/db'

export type TrackableEvent =
  | 'PORTFOLIO_VIEW'
  | 'CARD_VIEW'
  | 'RESUME_DOWNLOAD'
  | 'PRESENTATION_VIEW'
  | 'LEAD_CAPTURED'

interface TrackOptions {
  ownerId: string
  type: TrackableEvent
  metadata?: Record<string, unknown>
  request?: Request
}

export async function trackEvent(opts: TrackOptions): Promise<void> {
  try {
    const ip = opts.request
      ? (opts.request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined
      : undefined
    const ua = opts.request?.headers.get('user-agent') ?? undefined
    const referer = opts.request?.headers.get('referer') ?? undefined

    await db.analyticsEvent.create({
      data: {
        ownerId:   opts.ownerId,
        type:      opts.type,
        metadata:  (opts.metadata ?? {}) as any,
        visitorIp: ip,
        userAgent: ua,
        referer,
      },
    })
  } catch {
    // Never crash the caller on analytics failure
  }
}
