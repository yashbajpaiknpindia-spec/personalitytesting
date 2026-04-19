import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// GET /api/generate/latest
// Returns the most recent COMPLETE generation's outputData for the logged-in user.
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const generation = await db.generation.findFirst({
      where: { userId: session.user.id, status: 'COMPLETE' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, outputData: true },
    })

    if (!generation) {
      return NextResponse.json({ outputData: null })
    }

    return NextResponse.json({
      id: generation.id,
      outputData: generation.outputData,
    })
  } catch (error) {
    console.error('[GET /api/generate/latest]', error)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}

// PATCH /api/generate/latest
// Merges supplied fields into the latest generation's outputData.
// Used by ProfileSectionsPanel to persist headline, bio sections etc.
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const generation = await db.generation.findFirst({
      where: { userId: session.user.id, status: 'COMPLETE' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, outputData: true },
    })

    if (!generation) {
      return NextResponse.json({ error: 'No generation found' }, { status: 404 })
    }

    // Merge the incoming fields into existing outputData
    const existing = (generation.outputData as Record<string, unknown>) ?? {}
    const merged = { ...existing, ...body }

    await db.generation.update({
      where: { id: generation.id },
      data: { outputData: merged },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/generate/latest]', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
