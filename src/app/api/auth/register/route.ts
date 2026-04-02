import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)

    // Generate referral code
    const safeName = (name || 'user').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') || 'user'
    const code = `${safeName}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const user = await db.user.create({
      data: {
        email,
        password: hashed,
        name:         name   || null,
        referralCode: code,
      },
    })

    // Send welcome email (fire and forget)
    sendWelcomeEmail(email, name || 'there').catch(() => {})

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
