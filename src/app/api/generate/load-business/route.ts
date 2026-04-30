import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// Load a business generation by id — used by BusinessGenerateStudio for
// ?from=<id> (Remix) and ?gen=<id> (Preview/Edit) URL params.
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const generation = await db.generation.findFirst({
      where: { id, userId: session.user.id, status: 'COMPLETE' },
      select: { id: true, inputData: true, outputData: true, createdAt: true },
    })

    if (!generation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Confirm it's a business generation
    const input = generation.inputData as Record<string, unknown>
    if (!input?.companyName) {
      return NextResponse.json({ error: 'Not a business generation' }, { status: 400 })
    }

    return NextResponse.json(generation)
  } catch (error) {
    console.error('[load-business]', error)
    return NextResponse.json({ error: 'Failed to load generation' }, { status: 500 })
  }
}
