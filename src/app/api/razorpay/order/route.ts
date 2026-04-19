import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { getRazorpay, PLAN_AMOUNTS } from '@/lib/razorpay'
import crypto from 'node:crypto'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await req.json()
    if (!['PRO', 'TEAM'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { amount, currency, planName } = PLAN_AMOUNTS[plan]

    const order = await getRazorpay().orders.create({
      amount,
      currency,
      receipt: `rcpt_${crypto.randomBytes(8).toString('hex')}`,
      notes: {
        userId:   user.id,
        plan,
        planName,
        email:    user.email,
      },
    })

    return NextResponse.json({
      orderId:   order.id,
      amount:    order.amount,
      currency:  order.currency,
      keyId:     process.env.RAZORPAY_KEY_ID,
      userName:  user.name  || '',
      userEmail: user.email,
      planName,
    })
  } catch (error) {
    console.error('Razorpay order error:', error)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
