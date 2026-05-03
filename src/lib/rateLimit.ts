import { db } from '@/lib/db'

type Plan = 'FREE' | 'PRO' | 'TEAM'

// Default plan limits
const PLAN_MONTHLY: Record<Plan, number | null> = {
  FREE: 3,
  PRO: null,   // unlimited
  TEAM: null,  // unlimited
}

const ipStore = new Map<string, { count: number; resetAt: number }>()

export function checkIpLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipStore.get(ip)
  if (!entry || now > entry.resetAt) {
    ipStore.set(ip, { count: 1, resetAt: now + 3600000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function checkUserConcurrency(userId: string): Promise<boolean> {
  const pending = await db.generation.count({
    where: { userId, status: 'PENDING' },
  })
  return pending < 5
}

export async function checkMonthlyUsage(userId: string, plan: Plan): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return false

  // Suspended users can never generate
  if (user.isSuspended) return false

  // If the last reset was before the start of the current month, reset now
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  if (user.usageResetAt < startOfMonth) {
    await db.user.update({
      where: { id: userId },
      data: { usageCount: 0, usageResetAt: new Date() },
    })
    return true // just reset → 0 uses this month
  }

  // Admin-set custom monthly limit takes priority over plan default
  if (user.monthlyGenLimit !== null && user.monthlyGenLimit !== undefined) {
    return user.usageCount < user.monthlyGenLimit
  }

  // Plan default
  const planLimit = PLAN_MONTHLY[plan]
  if (planLimit === null) return true // unlimited
  return user.usageCount < planLimit
}
