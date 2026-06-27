import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { PLAN_AMOUNTS } from '@/lib/razorpay'
import crypto from 'node:crypto'
import Razorpay from 'razorpay'

type RazorCreds = { keyId: string; keySecret: string }

async function getRazorpayCreds(): Promise<RazorCreds | null> {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return { keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET }
  }
  try {
    await db.$executeRawUnsafe('ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT')
    await db.$executeRawUnsafe('ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT')
    await db.$executeRawUnsafe('ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false')
    const rows = await db.$queryRaw<Array<{ razorpayKeyId: string | null; razorpayKeySecret: string | null; razorpayEnabled: boolean }>>`
      SELECT "razorpayKeyId", "razorpayKeySecret", "razorpayEnabled" FROM admin_settings WHERE id = 'singleton' LIMIT 1
    `
    const row = rows[0]
    if (row?.razorpayEnabled && row.razorpayKeyId && row.razorpayKeySecret) {
      return { keyId: row.razorpayKeyId, keySecret: row.razorpayKeySecret }
    }
  } catch (err) {
    console.warn('[razorpay/order] DB payment settings unavailable:', err)
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const creds = await getRazorpayCreds()
    if (!creds) {
      return NextResponse.json({ error: 'Payments are currently not available. Please contact support.' }, { status: 503 })
    }

    const { plan } = await req.json()
    const selectedPlan = PLAN_AMOUNTS[String(plan || '')]
    if (!selectedPlan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { amount, currency, planName, accountPlan } = selectedPlan

    const razorpay = new Razorpay({ key_id: creds.keyId, key_secret: creds.keySecret })
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `rcpt_${crypto.randomBytes(8).toString('hex')}`,
      notes: {
        userId:   user.id,
        plan,
        planName,
        accountPlan,
        email:    user.email,
      },
    })

    return NextResponse.json({
      orderId:   order.id,
      amount:    order.amount,
      currency:  order.currency,
      keyId:     creds.keyId,
      userName:  user.name  || '',
      userEmail: user.email,
      planName,
    })
  } catch (error) {
    console.error('Razorpay order error:', error)
    return NextResponse.json({ error: 'Payments are currently not available. Please contact support.' }, { status: 503 })
  }
}
