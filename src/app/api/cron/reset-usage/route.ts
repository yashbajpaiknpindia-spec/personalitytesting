import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await db.user.updateMany({
      where: { plan: 'FREE' },
      data: { usageCount: 0, usageResetAt: new Date() },
    })

    console.log(`[CRON] Reset usage for ${result.count} FREE users`)
    return NextResponse.json({ success: true, usersReset: result.count })
  } catch (error) {
    console.error('Cron reset error:', error)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
