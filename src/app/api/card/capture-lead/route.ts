import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/card/capture-lead — public endpoint, no auth required
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, company, ownerId, sourceSlug } = body

    if (!name || !ownerId || (!email && !phone)) {
      return NextResponse.json({ error: 'name, ownerId and email or phone are required' }, { status: 400 })
    }

    // Verify ownerId actually exists
    const owner = await db.user.findUnique({ where: { id: ownerId }, select: { id: true } })
    if (!owner) return NextResponse.json({ error: 'Invalid owner' }, { status: 400 })

    const contact = await db.contact.create({
      data: {
        ownerId,
        name: String(name).slice(0, 120),
        email: email ? String(email).slice(0, 200) : `${String(phone).replace(/\D/g, '').slice(0, 30) || 'visitor'}@phone-lead.local`,
        phone: phone ? String(phone).slice(0, 30) : null,
        company: company ? String(company).slice(0, 120) : null,
        sourceSlug: sourceSlug ? String(sourceSlug).slice(0, 120) : null,
      },
    })

    return NextResponse.json({ success: true, id: contact.id })
  } catch (e) {
    console.error('[POST /api/card/capture-lead]', e)
    return NextResponse.json({ error: 'Failed to capture lead' }, { status: 500 })
  }
}
