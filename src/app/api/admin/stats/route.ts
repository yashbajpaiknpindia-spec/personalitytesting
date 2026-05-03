import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user.email !== ADMIN_EMAIL && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const startOfDay   = new Date(now); startOfDay.setHours(0,0,0,0)
  const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
  const startOfYear  = new Date(now.getFullYear(), 0, 1)

  const [
    totalUsers, totalGenerations, failedGenerations, flaggedGenerations,
    claudeAll, claudeToday, claudeMonth, claudeYear,
    pexelsAll, pexelsToday, pexelsMonth,
    recentGenerations, planCounts, modelBreakdown,
    pexelsCached, pexelsReal,
    // Business-mode cost breakdowns
    businessAll, businessToday, businessMonth,
    // Guest (no userId) breakdowns — personal + business
    guestAll, guestToday, guestMonth,
    // Guest business specifically
    guestBusinessAll, guestBusinessToday, guestBusinessMonth,
    // Authenticated personal (endpoint = 'claude', no business endpoint)
    personalAuthAll, personalAuthMonth,
    // Monthly cost rollup per endpoint for the cost breakdown table
    endpointBreakdown,
  ] = await Promise.all([
    db.user.count(),
    db.generation.count({ where: { status: 'COMPLETE' } }),
    db.generation.count({ where: { status: 'FAILED' } }),
    db.generation.count({ where: { status: 'FLAGGED' } }),

    // All Claude calls (both personal and business, auth + guest)
    db.apiCallLog.aggregate({
      where: { service: 'claude' },
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costUsd: true, costInr: true },
      _count: true,
      _avg: { costUsd: true, costInr: true, totalTokens: true },
    }),
    db.apiCallLog.aggregate({
      where: { service: 'claude', createdAt: { gte: startOfDay } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'claude', createdAt: { gte: startOfMonth } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'claude', createdAt: { gte: startOfYear } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),

    db.apiCallLog.aggregate({ where: { service: 'pexels' }, _count: true }),
    db.apiCallLog.aggregate({ where: { service: 'pexels', createdAt: { gte: startOfDay } }, _count: true }),
    db.apiCallLog.aggregate({ where: { service: 'pexels', createdAt: { gte: startOfMonth } }, _count: true }),

    db.generation.findMany({
      where: { status: 'COMPLETE' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true, name: true } } },
    }),
    db.user.groupBy({ by: ['plan'], _count: true }),
    db.apiCallLog.groupBy({
      by: ['model'],
      where: { service: 'claude', model: { not: null } },
      _sum: { costUsd: true, costInr: true, totalTokens: true, inputTokens: true, outputTokens: true },
      _count: true,
    }),
    db.apiCallLog.count({ where: { service: 'pexels', cached: true } }),
    db.apiCallLog.count({ where: { service: 'pexels', cached: false } }),

    // Business mode: endpoint contains 'generate-business'
    db.apiCallLog.aggregate({
      where: { service: 'claude', endpoint: { contains: 'generate-business' } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'claude', endpoint: { contains: 'generate-business' }, createdAt: { gte: startOfDay } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'claude', endpoint: { contains: 'generate-business' }, createdAt: { gte: startOfMonth } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),

    // All guest calls (userId is null)
    db.apiCallLog.aggregate({
      where: { service: 'claude', userId: null },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'claude', userId: null, createdAt: { gte: startOfDay } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'claude', userId: null, createdAt: { gte: startOfMonth } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),

    // Guest business
    db.apiCallLog.aggregate({
      where: { service: 'claude', userId: null, endpoint: { contains: 'generate-business' } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'claude', userId: null, endpoint: { contains: 'generate-business' }, createdAt: { gte: startOfDay } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'claude', userId: null, endpoint: { contains: 'generate-business' }, createdAt: { gte: startOfMonth } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),

    // Authenticated personal (has userId, endpoint NOT business)
    db.apiCallLog.aggregate({
      where: { service: 'claude', userId: { not: null }, NOT: { endpoint: { contains: 'generate-business' } } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'claude', userId: { not: null }, NOT: { endpoint: { contains: 'generate-business' } }, createdAt: { gte: startOfMonth } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
    }),

    // Group by endpoint for table breakdown
    db.apiCallLog.groupBy({
      by: ['endpoint'],
      where: { service: 'claude' },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
      orderBy: { _sum: { costUsd: 'desc' } },
    }),
  ])

  const adminSettings = await db.adminSettings.findUnique({ where: { id: 'singleton' } })
  const usdToInr = adminSettings?.usdToInr ?? 84.0

  return NextResponse.json({
    overview: { totalUsers, totalGenerations, failedGenerations, flaggedGenerations, planCounts },
    claude: {
      allTime: {
        calls: claudeAll._count,
        inputTokens:  claudeAll._sum.inputTokens  ?? 0,
        outputTokens: claudeAll._sum.outputTokens ?? 0,
        totalTokens:  claudeAll._sum.totalTokens  ?? 0,
        costUsd:      claudeAll._sum.costUsd       ?? 0,
        costInr:      claudeAll._sum.costInr       ?? 0,
        avgCostUsd:   claudeAll._avg.costUsd       ?? 0,
        avgCostInr:   claudeAll._avg.costInr       ?? 0,
        avgTokens:    claudeAll._avg.totalTokens   ?? 0,
      },
      today:     { calls: claudeToday._count,  totalTokens: claudeToday._sum.totalTokens  ?? 0, costUsd: claudeToday._sum.costUsd  ?? 0, costInr: claudeToday._sum.costInr  ?? 0 },
      thisMonth: { calls: claudeMonth._count,  totalTokens: claudeMonth._sum.totalTokens  ?? 0, costUsd: claudeMonth._sum.costUsd  ?? 0, costInr: claudeMonth._sum.costInr  ?? 0 },
      thisYear:  { calls: claudeYear._count,   totalTokens: claudeYear._sum.totalTokens   ?? 0, costUsd: claudeYear._sum.costUsd   ?? 0, costInr: claudeYear._sum.costInr   ?? 0 },
      modelBreakdown,
    },
    pexels: { total: pexelsAll._count, today: pexelsToday._count, thisMonth: pexelsMonth._count, cached: pexelsCached, real: pexelsReal },
    recentGenerations,
    usdToInr,

    // ── New: broken-down cost segments ───────────────────────────────────────
    costSegments: {
      business: {
        allTime:   { calls: businessAll._count,   costUsd: businessAll._sum.costUsd   ?? 0, costInr: businessAll._sum.costInr   ?? 0, totalTokens: businessAll._sum.totalTokens   ?? 0 },
        today:     { calls: businessToday._count, costUsd: businessToday._sum.costUsd ?? 0, costInr: businessToday._sum.costInr ?? 0, totalTokens: businessToday._sum.totalTokens ?? 0 },
        thisMonth: { calls: businessMonth._count, costUsd: businessMonth._sum.costUsd ?? 0, costInr: businessMonth._sum.costInr ?? 0, totalTokens: businessMonth._sum.totalTokens ?? 0 },
      },
      guest: {
        allTime:   { calls: guestAll._count,   costUsd: guestAll._sum.costUsd   ?? 0, costInr: guestAll._sum.costInr   ?? 0, totalTokens: guestAll._sum.totalTokens   ?? 0 },
        today:     { calls: guestToday._count, costUsd: guestToday._sum.costUsd ?? 0, costInr: guestToday._sum.costInr ?? 0, totalTokens: guestToday._sum.totalTokens ?? 0 },
        thisMonth: { calls: guestMonth._count, costUsd: guestMonth._sum.costUsd ?? 0, costInr: guestMonth._sum.costInr ?? 0, totalTokens: guestMonth._sum.totalTokens ?? 0 },
      },
      guestBusiness: {
        allTime:   { calls: guestBusinessAll._count,   costUsd: guestBusinessAll._sum.costUsd   ?? 0, costInr: guestBusinessAll._sum.costInr   ?? 0 },
        today:     { calls: guestBusinessToday._count, costUsd: guestBusinessToday._sum.costUsd ?? 0, costInr: guestBusinessToday._sum.costInr ?? 0 },
        thisMonth: { calls: guestBusinessMonth._count, costUsd: guestBusinessMonth._sum.costUsd ?? 0, costInr: guestBusinessMonth._sum.costInr ?? 0 },
      },
      personalAuth: {
        allTime:   { calls: personalAuthAll._count,   costUsd: personalAuthAll._sum.costUsd   ?? 0, costInr: personalAuthAll._sum.costInr   ?? 0 },
        thisMonth: { calls: personalAuthMonth._count, costUsd: personalAuthMonth._sum.costUsd ?? 0, costInr: personalAuthMonth._sum.costInr ?? 0 },
      },
      endpointBreakdown,
    },
  })
}
