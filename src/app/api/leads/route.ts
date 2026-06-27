// src/app/api/leads/route.ts
// Returns contact/lead submissions for the currently authenticated user's website.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 })
  }

  // Verify the site belongs to this user
  const site = await db.userWebsite.findUnique({
    where: { slug },
    select: { userId: true, id: true },
  })

  if (!site) {
    return NextResponse.json({ error: 'Website not found' }, { status: 404 })
  }

  // Admins can see all; regular users only their own
  const isAdmin = session.user.email === 'yashbajpaiknpindia@gmail.com'
  if (!isAdmin && site.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Match bare slug AND the prefixed variants written by bs-backend.js embed script:
  // "website:<slug>" for contact forms, "booking:<slug>" for booking forms
  const contacts = await db.contact.findMany({
    where: {
      ownerId: site.userId,
      OR: [
        { sourceSlug: slug },
        { sourceSlug: `website:${slug}` },
        { sourceSlug: `booking:${slug}` },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id:         true,
      name:       true,
      email:      true,
      phone:      true,
      company:    true,
      createdAt:  true,
      sourceSlug: true,
    },
  })

  return NextResponse.json({ contacts, total: contacts.length })
}
