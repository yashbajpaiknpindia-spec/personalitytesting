import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const referredCount = user.referralCode
    ? await db.user.count({ where: { referredBy: user.referralCode } })
    : 0

  return NextResponse.json({
    code: user.referralCode ?? '',
    referredCount,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

    const referrer = await db.user.findUnique({ where: { referralCode: code } })
    if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })

    return NextResponse.json({ valid: true, referrerId: referrer.id })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
