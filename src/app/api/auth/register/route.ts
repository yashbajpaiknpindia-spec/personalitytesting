import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { normalisePhone, ADMIN_PHONE } from '@/lib/auth/config'
import { updateUserLastLocation } from '@/lib/geo'

export async function POST(req: NextRequest) {
  try {
    const { phone: rawPhone, password, name } = await req.json()

    if (!rawPhone || !password) {
      return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const phone = normalisePhone(rawPhone)
    if (!phone) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Indian mobile number' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this number already exists' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const safeName = (name || 'user').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') || 'user'
    const code = `${safeName}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // If registering with admin phone, auto-assign ADMIN role
    const isAdmin = phone === ADMIN_PHONE

    const user = await db.user.create({
      data: {
        phone,
        password: hashed,
        name:         name   || null,
        role:         isAdmin ? 'ADMIN' : 'USER',
        referralCode: code,
        onboarded:    true,
      },
    })

    // Fire-and-forget geo lookup — updates user's last known approximate location.
    updateUserLastLocation(user.id, req, { force: true }).catch(() => {})

    // Classy in-app onboarding notifications. These are targeted to the new user
    // and show up inside the bell dropdown immediately after signup.
    db.notification.createMany({
      data: [
        {
          title: 'Welcome to Brand Syndicate',
          body: 'Your business AI workspace is ready. Start with one clear prompt and build your website, logo, images, content, and strategy from one place.',
          type: 'targeted',
          targetUserId: user.id,
          sentBy: 'system-onboarding',
        },
        {
          title: 'Secure your account with email',
          body: 'Add your email in Settings now so password reset links, important alerts, and account updates can safely reach you.',
          type: 'targeted',
          targetUserId: user.id,
          sentBy: 'system-onboarding',
        },
      ],
    }).catch(err => console.error('Signup notification error:', err))

    if (user.email) {
      sendWelcomeEmail(user.email, name || 'there').catch(() => {})
    }

    return NextResponse.json({ id: user.id, phone: user.phone }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
