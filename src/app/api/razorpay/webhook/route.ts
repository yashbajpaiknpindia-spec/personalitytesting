import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { planFromNotes } from '@/lib/razorpay'
import crypto from 'node:crypto'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  // Verify webhook signature
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (expected !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { event: string; payload: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    switch (event.event) {
      case 'payment.captured': {
        const payment = (event.payload as { payment?: { entity?: Record<string, unknown> } })
          ?.payment?.entity as Record<string, string> | undefined
        const notes = payment?.notes as Record<string, string> | undefined
        if (!notes) break
        const { userId, plan } = notes
        if (userId && plan) {
          await db.user.update({
            where: { id: userId },
            data: {
              plan:         planFromNotes(notes),
              razorpayId:   payment?.id,
              razorpaySubId: payment?.order_id,
            },
          })
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        const sub = (event.payload as { subscription?: { entity?: Record<string, string> } })
          ?.subscription?.entity
        if (sub?.notes) {
          const notes = sub.notes as unknown as Record<string, string>
          const { userId } = notes
          if (userId) {
            await db.user.update({
              where: { id: userId },
              data: { plan: 'FREE', razorpaySubId: null },
            })
          }
        }
        break
      }

      case 'payment.failed': {
        // Log only — could send email here
        console.log('Razorpay payment failed:', event.payload)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
