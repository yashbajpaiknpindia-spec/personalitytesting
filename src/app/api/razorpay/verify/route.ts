import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import crypto from 'node:crypto'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    // Verify HMAC signature
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Upgrade plan in DB
    await db.user.update({
      where: { id: session.user.id },
      data: {
        plan:         plan as 'PRO' | 'TEAM',
        razorpayId:   razorpay_payment_id,
        razorpaySubId: razorpay_order_id,
      },
    })

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('Razorpay verify error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
