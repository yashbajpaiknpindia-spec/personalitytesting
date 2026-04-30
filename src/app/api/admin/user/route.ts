import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'

async function checkAdmin() {
  const session = await auth()
  if (!session?.user || (session.user.email !== ADMIN_EMAIL && session.user.role !== 'ADMIN')) return null
  return session
}

// PATCH /api/admin/user — update user limits, plan, suspend, etc.
export async function PATCH(req: NextRequest) {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { userId, action, ...data } = body

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  if (action === 'suspend') {
    await db.user.update({ where: { id: userId }, data: { isSuspended: true, suspendReason: data.reason ?? null } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'unsuspend') {
    await db.user.update({ where: { id: userId }, data: { isSuspended: false, suspendReason: null } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'set_limits') {
    await db.user.update({
      where: { id: userId },
      data: {
        dailyGenLimit: data.daily != null ? parseInt(data.daily) : null,
        monthlyGenLimit: data.monthly != null ? parseInt(data.monthly) : null,
        yearlyGenLimit: data.yearly != null ? parseInt(data.yearly) : null,
      },
    })
    return NextResponse.json({ ok: true })
  }
  if (action === 'set_plan') {
    await db.user.update({ where: { id: userId }, data: { plan: data.plan } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'reset_usage') {
    await db.user.update({ where: { id: userId }, data: { usageCount: 0, usageResetAt: new Date() } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'delete') {
    await db.user.delete({ where: { id: userId } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// POST /api/admin/user — admin change own password
export async function POST(req: NextRequest) {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const admin = await db.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (!admin?.password) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, admin.password)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })

  const hash = await bcrypt.hash(newPassword, 12)
  await db.user.update({ where: { email: ADMIN_EMAIL }, data: { password: hash } })
  return NextResponse.json({ ok: true })
}
