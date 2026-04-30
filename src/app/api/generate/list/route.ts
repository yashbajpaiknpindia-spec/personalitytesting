import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// GET /api/generate/list?limit=20
// Returns the logged-in user's COMPLETE generations, newest first.
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = Math.min(
      50,
      parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10) || 20
    )

    const generations = await db.generation.findMany({
      where: { userId: session.user.id, status: 'COMPLETE' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        inputData: true,
        outputData: true,
        templateId: true,
      },
    })

    return NextResponse.json({ generations })
  } catch (error) {
    console.error('[GET /api/generate/list]', error)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}
