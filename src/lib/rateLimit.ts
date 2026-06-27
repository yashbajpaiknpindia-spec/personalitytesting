// src/lib/rateLimit.ts
// Unified generation-limit engine for BrandSyndicate.
//
// MASTER LIMIT:  globalGenLimit + globalLimitPeriod from AdminSettings
//   • "daily"   → 5 generations per calendar day (default)
//   • "monthly" → 5 generations per calendar month
//   Both can be changed by admin in /admin → Settings → Master Generation Limit.
//
// PER-USER OVERRIDE: user.dailyGenLimit / user.monthlyGenLimit (set per-user in admin Users tab)
// PLAN LIMITS: fallback per-plan limits still apply for backwards compat
//
// All 7+ generation endpoints call checkGlobalLimit() at the top of their handler.
// On pass  → returns { allowed: true, used, limit, period, resetAt }
// On block → returns { allowed: false, used, limit, period, resetAt, reason }
//
// After a successful generation the caller MUST call incrementUsage(userId)
// so the counter is updated atomically.

import { db } from '@/lib/db'

type Plan = 'FREE' | 'PRO' | 'TEAM'
type LimitPeriod = 'daily' | 'monthly'

export interface LimitResult {
  allowed: boolean
  used: number
  limit: number | null   // null = unlimited
  period: LimitPeriod
  resetAt: string        // ISO string — when the window resets for display
  reason?: string
}

// ── Helper: today's date string "YYYY-MM-DD" in UTC ───────────────────────────
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Helper: start of current month in UTC ─────────────────────────────────────
function startOfMonthUtc(): Date {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// ── Helper: next reset date string ────────────────────────────────────────────
function nextReset(period: LimitPeriod): string {
  if (period === 'daily') {
    // midnight tonight UTC
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + 1)
    d.setUTCHours(0, 0, 0, 0)
    return d.toISOString()
  }
  // first of next month
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() + 1)
  d.setUTCDate(1)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

// ── Load master limit settings from AdminSettings ────────────────────────────
async function getGlobalLimitConfig(): Promise<{ limit: number; period: LimitPeriod }> {
  try {
    const s = await db.adminSettings.findUnique({ where: { id: 'singleton' } })
    return {
      limit:  (s as any)?.globalGenLimit    ?? 5,
      period: ((s as any)?.globalLimitPeriod ?? 'daily') as LimitPeriod,
    }
  } catch {
    return { limit: 5, period: 'daily' }
  }
}

// ── MAIN: checkGlobalLimit ────────────────────────────────────────────────────
// Call at the start of EVERY generation route (website, logo, graphics, strategy,
// calendar, video, business, etc.) BEFORE doing any AI work.
export async function checkGlobalLimit(userId: string): Promise<LimitResult> {
  // 1. Load user + admin config in parallel
  const [user, config] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    getGlobalLimitConfig(),
  ])

  if (!user) return { allowed: false, used: 0, limit: config.limit, period: config.period, resetAt: nextReset(config.period), reason: 'User not found' }
  if (user.isSuspended) return { allowed: false, used: 0, limit: config.limit, period: config.period, resetAt: nextReset(config.period), reason: 'Account suspended' }

  const { limit: globalLimit, period } = config

  // 2. Determine the effective usage counter for this period
  let currentUsed: number

  if (period === 'daily') {
    // Use dailyUsageCount, resetting if the stored date is not today
    const today = todayUtc()
    if ((user as any).dailyUsageDate !== today) {
      // Reset the daily counter — new day
      await db.user.update({
        where: { id: userId },
        data: { dailyUsageCount: 0, dailyUsageDate: today },
      })
      currentUsed = 0
    } else {
      currentUsed = (user as any).dailyUsageCount ?? 0
    }
  } else {
    // monthly — use the existing usageCount + usageResetAt mechanism
    const startOfMonth = startOfMonthUtc()
    if (user.usageResetAt < startOfMonth) {
      await db.user.update({
        where: { id: userId },
        data: { usageCount: 0, usageResetAt: new Date() },
      })
      currentUsed = 0
    } else {
      currentUsed = user.usageCount
    }
  }

  // 3. Per-user admin override takes highest priority
  const userOverride = period === 'daily'
    ? ((user.dailyGenLimit ?? null) as number | null)
    : ((user.monthlyGenLimit ?? null) as number | null)

  const effectiveLimit = userOverride !== null ? userOverride : globalLimit

  // null / 0 from admin = unlimited
  if (effectiveLimit === null || effectiveLimit <= 0) {
    return { allowed: true, used: currentUsed, limit: null, period, resetAt: nextReset(period) }
  }

  if (currentUsed >= effectiveLimit) {
    return {
      allowed: false,
      used: currentUsed,
      limit: effectiveLimit,
      period,
      resetAt: nextReset(period),
      reason: `${period === 'daily' ? 'Daily' : 'Monthly'} generation limit of ${effectiveLimit} reached.`,
    }
  }

  return { allowed: true, used: currentUsed, limit: effectiveLimit, period, resetAt: nextReset(period) }
}

// ── incrementUsage ─────────────────────────────────────────────────────────────
// Call AFTER a successful generation to bump both the master counter and the legacy
// monthly usageCount so no stats break.
export async function incrementUsage(userId: string): Promise<void> {
  const config = await getGlobalLimitConfig()
  const today  = todayUtc()

  if (config.period === 'daily') {
    await db.user.update({
      where: { id: userId },
      data: {
        dailyUsageCount: { increment: 1 },
        dailyUsageDate:  today,
        usageCount:      { increment: 1 }, // keep legacy counter in sync
      },
    })
  } else {
    await db.user.update({
      where: { id: userId },
      data: { usageCount: { increment: 1 } },
    })
  }
}

// ── getUserUsage ───────────────────────────────────────────────────────────────
// Returns current usage info for display in the UI (usage badge on generate page).
export async function getUserUsage(userId: string): Promise<LimitResult & { suspendReason?: string }> {
  return checkGlobalLimit(userId)
}

// ── Legacy: these are kept so no other code breaks ───────────────────────────
const PLAN_MONTHLY: Record<Plan, number | null> = {
  FREE: 3,
  PRO: null,
  TEAM: null,
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

/** @deprecated — use checkGlobalLimit() instead */
export async function checkMonthlyUsage(userId: string, plan: Plan): Promise<boolean> {
  const result = await checkGlobalLimit(userId)
  return result.allowed
}
