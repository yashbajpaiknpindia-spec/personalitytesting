// src/app/api/website/[id]/book/route.ts
// POST /api/website/[id]/book
// Public endpoint — no auth required. Captures a booking/appointment request
// from a generated/template website and stores it as a Contact under the site owner,
// with booking details packed into the company field (no schema migration needed).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter: max 5 bookings per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now    = Date.now()
  const window = 10 * 60 * 1000
  const max    = 5

  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const site = await db.userWebsite.findUnique({
      where:  { id: params.id },
      select: { userId: true, slug: true, name: true },
    })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, email, phone, date, time, service, message } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Pack booking details into the company field (fits existing schema without migration)
    const bookingDetails = [
      service ? `Service: ${String(service).slice(0, 80)}`   : null,
      date    ? `Date: ${String(date).slice(0, 30)}`         : null,
      time    ? `Time: ${String(time).slice(0, 30)}`         : null,
      message ? `Notes: ${String(message).slice(0, 300)}`    : null,
    ]
      .filter(Boolean)
      .join(' | ') || 'Booking Request'

    await db.contact.create({
      data: {
        ownerId:    site.userId,
        name:       String(name).slice(0, 120),
        email:      String(email).toLowerCase().trim().slice(0, 200),
        phone:      phone ? String(phone).slice(0, 30) : null,
        company:    bookingDetails.slice(0, 500),
        sourceSlug: site.slug
          ? `booking:${site.slug}`
          : `booking:${params.id}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[POST /api/website/[id]/book]', e)
    return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 })
  }
}
