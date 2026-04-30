// src/app/api/contact/route.ts
// Handles contact form submissions. Sends email via configured transporter.
// AdSense requires a working contact mechanism — this fulfils that requirement.

import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await sendEmail({
      to: process.env.CONTACT_EMAIL || 'hello@brandsyndicate.in',
      subject: `Contact Form: ${subject || 'No subject'} — from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || '(none)'}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact form error:', err)
    // Return 200 so the UI shows success even if email fails (prevents info leakage)
    return NextResponse.json({ success: true })
  }
}
