import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import crypto from 'node:crypto'
import { accountPlanFromBillingPlan } from '@/lib/razorpay'

async function getRazorpayKeySecret(): Promise<string | null> {
  if (process.env.RAZORPAY_KEY_SECRET) return process.env.RAZORPAY_KEY_SECRET
  try {
    await db.$executeRawUnsafe('ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT')
    await db.$executeRawUnsafe('ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false')
    const rows = await db.$queryRaw<Array<{ razorpayKeySecret: string | null; razorpayEnabled: boolean }>>`
      SELECT "razorpayKeySecret", "razorpayEnabled" FROM admin_settings WHERE id = 'singleton' LIMIT 1
    `
    const row = rows[0]
    return row?.razorpayEnabled && row.razorpayKeySecret ? row.razorpayKeySecret : null
  } catch {
    return null
  }
}

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

    const keySecret = await getRazorpayKeySecret()
    if (!keySecret) return NextResponse.json({ error: 'Payments are currently not available. Please contact support.' }, { status: 503 })

    // Verify HMAC signature
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected  = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const accountPlan = accountPlanFromBillingPlan(String(plan))
    if (accountPlan === 'FREE') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Upgrade plan in DB. The public package id is stored in razorpaySubId/order notes;
    // the account plan stays compatible with the existing Prisma enum: FREE | PRO | TEAM.
    await db.user.update({
      where: { id: session.user.id },
      data: {
        plan:         accountPlan,
        razorpayId:   razorpay_payment_id,
        razorpaySubId: razorpay_order_id,
      },
    })

    return NextResponse.json({ success: true, plan: accountPlan, billingPlan: plan })
  } catch (error) {
    console.error('Razorpay verify error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
