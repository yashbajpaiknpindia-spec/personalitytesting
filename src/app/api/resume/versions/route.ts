import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

    const versions = await db.resumeVersion.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        label: true,
        atsScore: true,
        tone: true,
        jobDescription: true,
        createdAt: true,
        tailoredResume: true,
        coverLetter: true,
        atsBreakdown: true,
        atsSuggestions: true,
      },
    })

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Resume versions error:', error)
    return NextResponse.json({ error: 'Failed to load versions' }, { status: 500 })
  }
}
