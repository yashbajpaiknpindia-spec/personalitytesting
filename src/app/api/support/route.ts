// src/app/api/support/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const { subject, message, userEmail, userName } = await req.json()

    if (!subject || !message?.trim()) {
      return NextResponse.json({ error: 'Missing subject or message' }, { status: 400 })
    }

    const userId = (session?.user as any)?.id ?? 'anonymous'
    const displayName = userName || userEmail || 'Unknown user'
    const titleLabel = `[Support] ${subject} — ${displayName}`

    // Create admin-visible notification
    try {
      await db.notification.create({
        data: {
          title: titleLabel,
          body: message.substring(0, 500),
          type: 'support',
          targetUserId: null,
          sentBy: userId,
        },
      })
    } catch (dbErr) {
      console.error('Support notification DB error:', dbErr)
    }

    // Send email to support inbox
    try {
      await sendEmail({
        to: process.env.CONTACT_EMAIL || 'brandsyndicateindia@gmail.com',
        subject: titleLabel,
        html: `
          <p><strong>From:</strong> ${displayName} (${userEmail || 'no email'})</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Topic:</strong> ${subject}</p>
          <hr />
          <p>${message.replace(/\n/g, '<br />')}</p>
        `,
      })
    } catch (emailErr) {
      console.error('Support email failed:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Support route error:', err)
    return NextResponse.json({ success: true })
  }
}
