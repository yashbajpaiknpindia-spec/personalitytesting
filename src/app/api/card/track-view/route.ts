// src/app/api/card/track-view/route.ts
// Called client-side when someone opens a digital business card.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/analytics/track'

export async function POST(req: NextRequest) {
  try {
    const { ownerId } = await req.json()
    if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 })

    await Promise.all([
      db.cardView.create({
        data: {
          ownerId,
          visitorIp: (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null,
          userAgent: req.headers.get('user-agent') || null,
          referer: req.headers.get('referer') || null,
        },
      }),
      trackEvent({ ownerId, type: 'CARD_VIEW', request: req }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[card/track-view]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
