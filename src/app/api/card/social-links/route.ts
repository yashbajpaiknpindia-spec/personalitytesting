// src/app/api/card/social-links/route.ts
// GET  — fetch current user's social links
// PUT  — upsert (create or update) social links

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const links = await db.socialLinks.findUnique({ where: { userId: session.user.id } })
    return NextResponse.json(links ?? {})
  } catch (err) {
    console.error('[card/social-links GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { linkedin, whatsapp, instagram, website, portfolio, twitter, github } = body

    // Basic URL sanitisation — allow null/empty to clear a field
    const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

    const links = await db.socialLinks.upsert({
      where:  { userId: session.user.id },
      create: {
        userId: session.user.id,
        linkedin:  clean(linkedin),
        whatsapp:  clean(whatsapp),
        instagram: clean(instagram),
        website:   clean(website),
        portfolio: clean(portfolio),
        twitter:   clean(twitter),
        github:    clean(github),
      },
      update: {
        linkedin:  clean(linkedin),
        whatsapp:  clean(whatsapp),
        instagram: clean(instagram),
        website:   clean(website),
        portfolio: clean(portfolio),
        twitter:   clean(twitter),
        github:    clean(github),
      },
    })

    return NextResponse.json({ success: true, links })
  } catch (err) {
    console.error('[card/social-links PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
