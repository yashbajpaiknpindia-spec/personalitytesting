import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const generation = await db.generation.findFirst({
      where: { id, userId: session.user.id, status: 'COMPLETE' },
      select: { id: true, inputData: true, outputData: true, templateId: true },
    })

    if (!generation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(generation)
  } catch (error) {
    console.error('Load generation error:', error)
    return NextResponse.json({ error: 'Failed to load generation' }, { status: 500 })
  }
}
