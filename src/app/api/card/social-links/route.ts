import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/card/social-links — fetch current user's social links
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const links = await db.socialLinks.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(links ?? {})
}

// PUT /api/card/social-links — upsert social links
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['linkedin', 'whatsapp', 'instagram', 'website', 'portfolio', 'twitter', 'github']
  const data: Record<string, string | null> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key] ?? null
  }

  const links = await db.socialLinks.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  })

  return NextResponse.json({ links })
}
