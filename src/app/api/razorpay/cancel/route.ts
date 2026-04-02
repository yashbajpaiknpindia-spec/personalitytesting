import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// Razorpay has no hosted billing portal like Stripe.
// This endpoint lets a user cancel/downgrade directly from the app.
export async function POST(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.user.update({
      where: { id: session.user.id },
      data: { plan: 'FREE', razorpayId: null, razorpaySubId: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'Cancellation failed' }, { status: 500 })
  }
}
