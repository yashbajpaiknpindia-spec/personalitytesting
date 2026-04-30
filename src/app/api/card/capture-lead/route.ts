// src/app/api/card/capture-lead/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/analytics/track'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ownerId, name, email, phone, company, sourceSlug } = body

    if (!ownerId || !name || !email) {
      return NextResponse.json(
        { error: 'ownerId, name, and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Validate owner exists
    const owner = await db.user.findUnique({ where: { id: ownerId }, select: { id: true } })
    if (!owner) {
      return NextResponse.json({ error: 'Invalid owner' }, { status: 404 })
    }

    // Create contact + track event in parallel
    const [contact] = await Promise.all([
      db.contact.create({
        data: {
          ownerId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          company: company?.trim() || null,
          sourceSlug: sourceSlug || null,
        },
      }),
      trackEvent({
        ownerId,
        type: 'LEAD_CAPTURED',
        metadata: { name, email, sourceSlug },
        request: req,
      }),
      // Also record a card view
      db.cardView.create({
        data: {
          ownerId,
          visitorIp: (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null,
          userAgent: req.headers.get('user-agent') || null,
          referer: req.headers.get('referer') || null,
        },
      }),
    ])

    return NextResponse.json({ success: true, contactId: contact.id })
  } catch (err) {
    console.error('[card/capture-lead]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
