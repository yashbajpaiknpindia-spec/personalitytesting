import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// Helper to detect Indian states/regions from IP or location metadata
function getRegionFromLocation(location: string | null): string {
  if (!location) return 'Unknown'
  const loc = location.toLowerCase()
  const regionMap: Record<string, string> = {
    'delhi': 'Delhi', 'new delhi': 'Delhi',
    'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra',
    'bangalore': 'Karnataka', 'bengaluru': 'Karnataka',
    'hyderabad': 'Telangana', 'secunderabad': 'Telangana',
    'chennai': 'Tamil Nadu',
    'kolkata': 'West Bengal',
    'ahmedabad': 'Gujarat', 'surat': 'Gujarat',
    'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan',
    'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'agra': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh',
    'patna': 'Bihar',
    'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh',
    'chandigarh': 'Punjab', 'amritsar': 'Punjab',
    'gurgaon': 'Haryana', 'faridabad': 'Haryana',
    'bhubaneswar': 'Odisha',
    'kochi': 'Kerala', 'thiruvananthapuram': 'Kerala',
    'goa': 'Goa',
    'dehradun': 'Uttarakhand',
    'ranchi': 'Jharkhand',
    'raipur': 'Chhattisgarh',
    'panaji': 'Goa',
  }
  for (const [city, region] of Object.entries(regionMap)) {
    if (loc.includes(city)) return region
  }
  return location
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse optional ?days= filter for the overview range selector
  const { searchParams } = new URL(request.url)
  const daysParam = parseInt(searchParams.get('days') || '0', 10)
  const rangeDays = [1, 7, 30, 90, 180, 365].includes(daysParam) ? daysParam : 0
  const rangeStart = rangeDays > 0 ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000) : null

  const now = new Date()
  const startOfDay   = new Date(now); startOfDay.setHours(0,0,0,0)
  const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
  const startOfYear  = new Date(now.getFullYear(), 0, 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalUsers, totalGenerations, failedGenerations, flaggedGenerations,
    claudeAll, claudeToday, claudeMonth, claudeYear,
    pexelsAll, pexelsToday, pexelsMonth,
    recentGenerations, planCounts, modelBreakdown,
    pexelsCached, pexelsReal,
    // Business-mode cost breakdowns
    businessAll, businessToday, businessMonth,
    // Guest (no userId) breakdowns, personal + business
    guestAll, guestToday, guestMonth,
    // Guest business specifically
    guestBusinessAll, guestBusinessToday, guestBusinessMonth,
    // Authenticated personal (endpoint = 'claude', no business endpoint)
    personalAuthAll, personalAuthMonth,
    // Monthly cost rollup per endpoint for the cost breakdown table
    endpointBreakdown,
    // OpenAI image generation (DALL-E 3)
    openaiAll, openaiToday, openaiMonth,
    openaiEndpointBreakdown,
    // Per-endpoint generation-type counts (success + failed per type)
    genByEndpoint,
    // Pexels images injected into websites
    pexelsWebsiteAll, pexelsWebsiteToday, pexelsWebsiteMonth,
    // Generation counts by genType (logo / brand-images / strategy / calendar)
    genByType,
    // New: new users in last 30 days
    newUsersLast30,
    // Per-user API cost totals
    userCostBreakdown,
  ] = await Promise.all([
    db.user.count({ where: rangeStart ? { createdAt: { gte: rangeStart } } : {} }),
    db.generation.count({ where: { status: 'COMPLETE', ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}) } }),
    db.generation.count({ where: { status: 'FAILED', ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}) } }),
    db.generation.count({ where: { status: 'FLAGGED', ...(rangeStart ? { createdAt: { gte: rangeStart } } : {}) } }),

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

    db.apiCallLog.aggregate({ where: { service: 'openai' }, _count: true }),
    db.apiCallLog.aggregate({ where: { service: 'openai', createdAt: { gte: startOfDay } }, _count: true }),
    db.apiCallLog.aggregate({ where: { service: 'openai', createdAt: { gte: startOfMonth } }, _count: true }),

    db.generation.findMany({
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
    db.apiCallLog.count({ where: { service: 'openai', cached: true } }),
    db.apiCallLog.count({ where: { service: 'openai', cached: false } }),

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

    // OpenAI image generation
    db.apiCallLog.aggregate({
      where: { service: 'openai' },
      _sum: { costUsd: true, costInr: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'openai', createdAt: { gte: startOfDay } },
      _sum: { costUsd: true, costInr: true },
      _count: true,
    }),
    db.apiCallLog.aggregate({
      where: { service: 'openai', createdAt: { gte: startOfMonth } },
      _sum: { costUsd: true, costInr: true },
      _count: true,
    }),
    db.apiCallLog.groupBy({
      by: ['endpoint'],
      where: { service: 'openai' },
      _sum: { costUsd: true, costInr: true },
      _count: true,
      orderBy: { _sum: { costUsd: 'desc' } },
    }),

    // Per-endpoint success + failure counts
    Promise.all([
      'generate', 'generate-website-stream', 'generate-website-template-json',
      'generate-graphics', 'generate-logo-image',
      'generate-strategy', 'generate-calendar',
      'generate-business', 'generate-business-guest', 'website-ai-edit', 'image-route',
    ].map(async (ep) => {
      const [success, failed] = await Promise.all([
        db.apiCallLog.count({ where: { endpoint: ep, success: true } }),
        db.apiCallLog.count({ where: { endpoint: ep, success: false } }),
      ])
      return { endpoint: ep, success, failed, total: success + failed }
    })),

    // Pexels injected into website generations
    db.apiCallLog.count({ where: { service: 'pexels-website' } }),
    db.apiCallLog.count({ where: { service: 'pexels-website', createdAt: { gte: startOfDay } } }),
    db.apiCallLog.count({ where: { service: 'pexels-website', createdAt: { gte: startOfMonth } } }),

    // Generation counts by genType — fetch all and group in JS.
    // Prisma JSON path filtering silently returns 0 on many PostgreSQL setups.
    db.generation.findMany({
      select: { status: true, enrichedData: true, inputData: true, createdAt: true },
    }).then(rows => {
      const types = ['logo', 'brand-images', 'strategy', 'calendar']
      return types.map(genType => {
        const matching = rows.filter(r => {
          const ed = r.enrichedData as Record<string, unknown> | null
          const inp = r.inputData as Record<string, unknown> | null
          return ed?.genType === genType
        })
        const complete   = matching.filter(r => r.status === 'COMPLETE').length
        const failed     = matching.filter(r => r.status === 'FAILED').length
        const today      = matching.filter(r => r.status === 'COMPLETE' && new Date(r.createdAt) >= startOfDay).length
        const thisMonth  = matching.filter(r => r.status === 'COMPLETE' && new Date(r.createdAt) >= startOfMonth).length
        return { genType, complete, failed, today, thisMonth, total: complete + failed }
      })
    }),

    // New users in selected range (falls back to 30d when no rangeStart)
    db.user.count({ where: { createdAt: { gte: rangeStart ?? thirtyDaysAgo } } }),

    // Per-user cost breakdown (top 50 by cost)
    db.apiCallLog.groupBy({
      by: ['userId'],
      where: { userId: { not: null } },
      _sum: { costUsd: true, costInr: true, totalTokens: true },
      _count: true,
      orderBy: { _sum: { costUsd: 'desc' } },
      take: 50,
    }),
  ])

  const adminSettings = await db.adminSettings.findUnique({ where: { id: 'singleton' } })
  const usdToInr = adminSettings?.usdToInr ?? 84.0

  const [overallAll, overallToday, overallMonth] = await Promise.all([
    db.apiCallLog.aggregate({ _sum: { costUsd: true, costInr: true, totalTokens: true }, _count: true }),
    db.apiCallLog.aggregate({ where: { createdAt: { gte: startOfDay } }, _sum: { costUsd: true, costInr: true, totalTokens: true }, _count: true }),
    db.apiCallLog.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { costUsd: true, costInr: true, totalTokens: true }, _count: true }),
  ])

  // Enrich user cost breakdown with user info
  const userIds = userCostBreakdown.map((u: any) => u.userId).filter(Boolean) as string[]
  const usersForCost = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true, plan: true, location: true, createdAt: true },
  })
  const userMap = Object.fromEntries(usersForCost.map((u: any) => [u.id, u]))

  const enrichedUserCosts = userCostBreakdown.map((row: any) => {
    const user = userMap[row.userId] ?? null
    return {
      userId: row.userId,
      email: user?.email ?? '—',
      name: user?.name ?? null,
      plan: user?.plan ?? 'FREE',
      location: user?.location ?? null,
      region: getRegionFromLocation(user?.location ?? null),
      joinedAt: user?.createdAt ?? null,
      calls: row._count,
      costUsd: row._sum?.costUsd ?? 0,
      costInr: row._sum?.costInr ?? 0,
      totalTokens: row._sum?.totalTokens ?? 0,
    }
  })

  // Region breakdown for all users
  const allUsersForRegion = await db.user.findMany({
    select: { id: true, location: true, createdAt: true },
  })
  const regionCounts: Record<string, { total: number; new30d: number }> = {}
  const thirtyDaysAgoTs = thirtyDaysAgo.getTime()
  for (const u of allUsersForRegion) {
    const region = getRegionFromLocation(u.location ?? null)
    if (!regionCounts[region]) regionCounts[region] = { total: 0, new30d: 0 }
    regionCounts[region].total++
    if (new Date(u.createdAt).getTime() >= thirtyDaysAgoTs) regionCounts[region].new30d++
  }
  const regionBreakdown = Object.entries(regionCounts)
    .map(([region, counts]) => ({ region, ...counts }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)

  return NextResponse.json({
    overview: { totalUsers, totalGenerations, failedGenerations, flaggedGenerations, planCounts, newUsersLast30 },
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
    pexelsWebsite: { allTime: pexelsWebsiteAll, today: pexelsWebsiteToday, thisMonth: pexelsWebsiteMonth },
    recentGenerations,
    usdToInr,
    overallSpend: {
      allTime:   { calls: overallAll._count,   costUsd: overallAll._sum.costUsd   ?? 0, costInr: overallAll._sum.costInr   ?? 0, totalTokens: overallAll._sum.totalTokens   ?? 0 },
      today:     { calls: overallToday._count, costUsd: overallToday._sum.costUsd ?? 0, costInr: overallToday._sum.costInr ?? 0, totalTokens: overallToday._sum.totalTokens ?? 0 },
      thisMonth: { calls: overallMonth._count, costUsd: overallMonth._sum.costUsd ?? 0, costInr: overallMonth._sum.costInr ?? 0, totalTokens: overallMonth._sum.totalTokens ?? 0 },
    },
    userCosts: enrichedUserCosts,
    regionBreakdown,

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
    openai: {
      allTime:   { calls: openaiAll._count,   costUsd: openaiAll._sum.costUsd   ?? 0, costInr: openaiAll._sum.costInr   ?? 0 },
      today:     { calls: openaiToday._count, costUsd: openaiToday._sum.costUsd ?? 0, costInr: openaiToday._sum.costInr ?? 0 },
      thisMonth: { calls: openaiMonth._count, costUsd: openaiMonth._sum.costUsd ?? 0, costInr: openaiMonth._sum.costInr ?? 0 },
      endpointBreakdown: openaiEndpointBreakdown,
    },
    genByEndpoint,
    genByType,
    recentImageGenerations: await db.generation.findMany({
      where: { status: 'COMPLETE' },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { user: { select: { email: true, name: true, phone: true } } },
    }).then(rows => rows.filter(g => {
      const ed  = g.enrichedData as any
      const out = g.outputData   as any
      const hasGraphicUrl = !!(out?.finalPosterUrl || out?.imageUrl || out?.previewImageUrl || (Array.isArray(out?.graphics) && out.graphics.length > 0) || (Array.isArray(out?.variations) && out.variations.length > 0))
      return ed?.genType === 'brand-images' || out?.genType === 'campaign-image' || out?.genType === 'logo-image' || hasGraphicUrl
    }).slice(0, 100)),
  })
}
