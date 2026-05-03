import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    name: user.name,
    username: user.username,
    jobTitle: user.jobTitle,
    company: user.company,
    location: user.location,
    website: user.website,
    linkedin: user.linkedin,
    bio: user.bio,
    accentColor: user.accentColor,
    onboarded: user.onboarded,
    plan: user.plan,
  })
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // Validate username uniqueness before building the update
    if (body.username !== undefined) {
      const existing = await db.user.findFirst({
        where: { username: body.username as string, NOT: { id: session.user.id } },
      })
      if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const updates: Record<string, string | boolean | null | undefined> = {}
    if (body.name        !== undefined) updates.name        = body.name        as string | null
    if (body.username    !== undefined) updates.username    = body.username    as string | null
    if (body.jobTitle    !== undefined) updates.jobTitle    = body.jobTitle    as string | null
    if (body.company     !== undefined) updates.company     = body.company     as string | null
    if (body.location    !== undefined) updates.location    = body.location    as string | null
    if (body.website     !== undefined) updates.website     = body.website     as string | null
    if (body.linkedin    !== undefined) updates.linkedin    = body.linkedin    as string | null
    if (body.bio         !== undefined) updates.bio         = body.bio         as string | null
    if (body.accentColor !== undefined) updates.accentColor = body.accentColor as string
    if (body.onboarded   !== undefined) updates.onboarded   = body.onboarded   as boolean

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updates,
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
