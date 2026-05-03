import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') // 'business' | null (personal)

    // Fetch ALL complete generations for this user — filter in JS
    // Reason: Prisma JSON path filtering (inputData: { path: [...] }) is unreliable
    // across PostgreSQL versions and Prisma adapters — it silently returns [] on many setups.
    const allGenerations = await db.generation.findMany({
      where: {
        userId: session.user.id,
        status: 'COMPLETE',
      },
      select: {
        id: true,
        createdAt: true,
        inputData: true,
        outputData: true,
        version: true,
        template: { select: { name: true, category: true, accentColor: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    if (mode === 'business') {
      // Business generations have companyName in inputData (set by generate-business route)
      const generations = allGenerations.filter(g => {
        try {
          const input = g.inputData as Record<string, unknown>
          return typeof input?.companyName === 'string' && input.companyName.trim().length > 0
        } catch { return false }
      })
      return NextResponse.json({ generations })
    }

    // Personal: does NOT have companyName in inputData
    const generations = allGenerations.filter(g => {
      try {
        const input = g.inputData as Record<string, unknown>
        return !input?.companyName || typeof input.companyName !== 'string' || input.companyName.trim().length === 0
      } catch { return true }
    })
    return NextResponse.json({ generations })
  } catch (e) {
    console.error('[my-generations]', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
