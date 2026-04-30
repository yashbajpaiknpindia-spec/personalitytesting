import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// PATCH /api/generate/update?id=<generationId>
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const body = await req.json()
    const generation = await db.generation.findFirst({
      where: { id, userId: session.user.id, status: 'COMPLETE' },
      select: { id: true, outputData: true },
    })
    if (!generation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const existing = (generation.outputData as Record<string, unknown>) ?? {}
    await db.generation.update({
      where: { id: generation.id },
      data: { outputData: { ...existing, ...body } },
    })
    return NextResponse.json({ success: true, id: generation.id })
  } catch (e) {
    console.error('[PATCH /api/generate/update]', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
