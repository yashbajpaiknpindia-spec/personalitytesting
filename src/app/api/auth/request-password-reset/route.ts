import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import {
  createPasswordResetToken,
  getStrictIndianMobileDigits,
  toStoredIndianPhone,
} from '@/lib/auth/password-reset'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  const visible = name.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const localDigits = getStrictIndianMobileDigits(body.phone)

    if (!localDigits) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      )
    }

    const storedPhone = toStoredIndianPhone(localDigits)
    const user = await db.user.findFirst({
      where: { OR: [{ phone: storedPhone }, { phone: localDigits }] },
      select: { id: true, phone: true, email: true, name: true, password: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No Brand Syndicate account exists with this mobile number.' },
        { status: 404 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        {
          code: 'EMAIL_NOT_LINKED',
          contactUrl: '/contact',
          error: "We can't reset this account password because no email is linked with it. Please contact our support immediately.",
        },
        { status: 409 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
    const token = createPasswordResetToken({
      userId: user.id,
      phone: user.phone || storedPhone,
      passwordHash: user.password,
    })
    const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`

    await sendPasswordResetEmail(user.email, user.name || 'there', resetUrl)

    return NextResponse.json({
      success: true,
      message: `Password reset link sent to ${maskEmail(user.email)}.`,
    })
  } catch (e) {
    console.error('[POST /api/auth/request-password-reset]', e)
    return NextResponse.json(
      { error: 'Could not send the reset link right now. Please try again.' },
      { status: 500 }
    )
  }
}
