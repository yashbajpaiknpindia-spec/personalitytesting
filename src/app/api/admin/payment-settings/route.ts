import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null
  return session
}

async function ensurePaymentColumns() {
  await db.$executeRawUnsafe('ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT')
  await db.$executeRawUnsafe('ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT')
  await db.$executeRawUnsafe('ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false')
  await db.adminSettings.upsert({ where: { id: 'singleton' }, update: {}, create: { id: 'singleton' } })
}

function maskSecret(secret: string | null | undefined) {
  if (!secret) return ''
  if (secret.length <= 8) return '••••••••'
  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await ensurePaymentColumns()
  const rows = await db.$queryRaw<Array<{ razorpayKeyId: string | null; razorpayKeySecret: string | null; razorpayEnabled: boolean }>>`
    SELECT "razorpayKeyId", "razorpayKeySecret", "razorpayEnabled" FROM admin_settings WHERE id = 'singleton' LIMIT 1
  `
  const row = rows[0]
  return NextResponse.json({
    razorpayEnabled: !!row?.razorpayEnabled,
    razorpayKeyId: row?.razorpayKeyId || '',
    razorpayKeySecretMasked: maskSecret(row?.razorpayKeySecret),
  })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await ensurePaymentColumns()
  const body = await req.json().catch(() => ({}))
  const keyId = String(body.razorpayKeyId || body.keyId || '').trim()
  const keySecret = String(body.razorpayKeySecret || body.keySecret || '').trim()
  const enabled = body.razorpayEnabled !== false
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Razorpay Key ID and Secret are required' }, { status: 400 })
  }
  await db.$executeRaw`
    UPDATE admin_settings
    SET "razorpayKeyId" = ${keyId}, "razorpayKeySecret" = ${keySecret}, "razorpayEnabled" = ${enabled}, "updatedAt" = NOW()
    WHERE id = 'singleton'
  `
  return NextResponse.json({ ok: true, razorpayEnabled: enabled, razorpayKeyId: keyId, razorpayKeySecretMasked: maskSecret(keySecret) })
}
