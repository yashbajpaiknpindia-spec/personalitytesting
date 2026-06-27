import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { verifyPasswordResetToken } from '@/lib/auth/password-reset'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = String(body.token || '')
    const newPassword = String(body.newPassword || '')

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Reset token and new password are required.' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const unsafePayload = (() => {
      try {
        const encoded = token.split('.')[0]
        if (!encoded) return null
        return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { uid?: string }
      } catch {
        return null
      }
    })()

    if (!unsafePayload?.uid) {
      return NextResponse.json({ error: 'Invalid reset link.' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: unsafePayload.uid },
      select: { id: true, phone: true, password: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid reset link.' }, { status: 400 })
    }

    const verified = verifyPasswordResetToken(token, user.password)
    if (!verified.valid || verified.userId !== user.id) {
      return NextResponse.json({ error: verified.reason }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await db.user.update({ where: { id: user.id }, data: { password: hashed } })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[POST /api/auth/reset-password]', e)
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 })
  }
}
