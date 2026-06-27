// src/app/api/website/[id]/contact/route.ts
// POST /api/website/[id]/contact
// Public endpoint — no auth required. Captures a contact form submission
// from a generated/template website and stores it as a Lead under the site owner.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter: max 5 submissions per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now    = Date.now()
  const window = 10 * 60 * 1000 // 10 min
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
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    // Resolve site → owner
    const site = await db.userWebsite.findUnique({
      where:  { id: params.id },
      select: { userId: true, slug: true, isPublished: true },
    })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, email, phone, company, message } = body

    // Validate required fields
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Compose the notes/company field: store message here since Contact has no message column
    const companyField = [
      company ? `Company: ${String(company).slice(0, 100)}` : null,
      message ? `Message: ${String(message).slice(0, 500)}` : null,
    ]
      .filter(Boolean)
      .join(' | ') || null

    await db.contact.create({
      data: {
        ownerId:    site.userId,
        name:       String(name).slice(0, 120),
        email:      String(email).toLowerCase().trim().slice(0, 200),
        phone:      phone    ? String(phone).slice(0, 30)   : null,
        company:    companyField,
        sourceSlug: site.slug ? `website:${site.slug}` : `website:${params.id}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[POST /api/website/[id]/contact]', e)
    return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 })
  }
}
