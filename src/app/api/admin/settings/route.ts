import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'

async function checkAdmin() {
  const session = await auth()
  if (
    !session?.user ||
    (session.user.email !== ADMIN_EMAIL &&
      (session.user as unknown as Record<string, unknown>).role !== 'ADMIN')
  ) return null
  return session
}

export async function GET() {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const s = await db.adminSettings.findUnique({ where: { id: 'singleton' } })
  return NextResponse.json({
    usdToInr: s?.usdToInr ?? 84.0,
    limits: {
      free:  { daily: s?.freeDailyLimit ?? 3,    weekly: s?.freeWeeklyLimit ?? null,  monthly: s?.freeMonthlyLimit ?? 30   },
      pro:   { daily: s?.proDailyLimit  ?? null,  weekly: s?.proWeeklyLimit  ?? null,  monthly: s?.proMonthlyLimit  ?? null },
      team:  { daily: s?.teamDailyLimit ?? null,  weekly: s?.teamWeeklyLimit ?? null,  monthly: s?.teamMonthlyLimit ?? null },
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const updateData: Record<string, unknown> = {}

  if (body.usdToInr !== undefined) {
    const rate = Number(body.usdToInr)
    if (!rate || rate <= 0) return NextResponse.json({ error: 'Invalid rate' }, { status: 400 })
    updateData.usdToInr = rate
  }

  const toInt = (v: number | null | undefined) =>
    v === null || v === undefined ? null : Math.max(0, Math.floor(Number(v))) || null

  const limits = body.limits as {
    free?:  { daily?: number|null; weekly?: number|null; monthly?: number|null }
    pro?:   { daily?: number|null; weekly?: number|null; monthly?: number|null }
    team?:  { daily?: number|null; weekly?: number|null; monthly?: number|null }
  } | undefined

  if (limits?.free) {
    if ('daily'   in limits.free) updateData.freeDailyLimit   = toInt(limits.free.daily)
    if ('weekly'  in limits.free) updateData.freeWeeklyLimit  = toInt(limits.free.weekly)
    if ('monthly' in limits.free) updateData.freeMonthlyLimit = toInt(limits.free.monthly)
  }
  if (limits?.pro) {
    if ('daily'   in limits.pro) updateData.proDailyLimit   = toInt(limits.pro.daily)
    if ('weekly'  in limits.pro) updateData.proWeeklyLimit  = toInt(limits.pro.weekly)
    if ('monthly' in limits.pro) updateData.proMonthlyLimit = toInt(limits.pro.monthly)
  }
  if (limits?.team) {
    if ('daily'   in limits.team) updateData.teamDailyLimit   = toInt(limits.team.daily)
    if ('weekly'  in limits.team) updateData.teamWeeklyLimit  = toInt(limits.team.weekly)
    if ('monthly' in limits.team) updateData.teamMonthlyLimit = toInt(limits.team.monthly)
  }

  if (Object.keys(updateData).length === 0)
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const updated = await db.adminSettings.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton', ...updateData },
    update: updateData,
  })

  return NextResponse.json({
    ok: true,
    usdToInr: updated.usdToInr,
    limits: {
      free:  { daily: updated.freeDailyLimit ?? null,  weekly: updated.freeWeeklyLimit ?? null,  monthly: updated.freeMonthlyLimit ?? null },
      pro:   { daily: updated.proDailyLimit  ?? null,  weekly: updated.proWeeklyLimit  ?? null,  monthly: updated.proMonthlyLimit  ?? null },
      team:  { daily: updated.teamDailyLimit ?? null,  weekly: updated.teamWeeklyLimit ?? null,  monthly: updated.teamMonthlyLimit ?? null },
    },
  })
}
