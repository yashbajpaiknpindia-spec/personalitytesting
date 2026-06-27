import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

async function updateGeneration(req: NextRequest, idFromQuery?: string | null) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const id = idFromQuery || body.id || body.generationId
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const patch = body.outputData && typeof body.outputData === 'object' ? body.outputData : body
    delete patch.id
    delete patch.generationId

    const generation = await db.generation.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, outputData: true },
    })
    if (!generation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const existing = (generation.outputData as Record<string, unknown>) ?? {}
    await db.generation.update({
      where: { id: generation.id },
      data: { outputData: { ...existing, ...patch } },
    })
    return NextResponse.json({ success: true, id: generation.id })
  } catch (e) {
    console.error('[api/generate/update]', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// PATCH /api/generate/update?id=<generationId>
export async function PATCH(req: NextRequest) {
  return updateGeneration(req, req.nextUrl.searchParams.get('id'))
}

// POST /api/generate/update  { id, outputData }
// Kept for the business editor autosave path.
export async function POST(req: NextRequest) {
  return updateGeneration(req, req.nextUrl.searchParams.get('id'))
}
