import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)

  // ── Single generation lookup (for log detail viewer) ──
  const generationId = searchParams.get('generationId')
  if (generationId) {
    const generation = await db.generation.findUnique({
      where: { id: generationId },
      select: { id: true, inputData: true, outputData: true, status: true, createdAt: true, modelUsed: true, costUsd: true },
    }).catch(() => null)
    return NextResponse.json({ generation })
  }

  // ── Single user history lookup ──
  const userId = searchParams.get('userId')
  const wantHistory = searchParams.get('history') === '1'
  if (userId && wantHistory) {
    const [history, websites] = await Promise.all([
      db.generation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          status: true, createdAt: true,
          templateId: true, modelUsed: true,
          enrichedData: true,
          inputData: true,
          outputData: true,
        },
      }).catch(() => []),
      db.userWebsite.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, slug: true, templateId: true, templateLabel: true, isPublished: true, isGenerated: true, createdAt: true },
      }).catch(() => []),
    ])

    // Merge website entries as history items with type='website'
    const websiteItems = websites.map((w: any) => ({
      id: w.id,
      type: 'website',
      templateId: w.templateId || w.templateLabel,
      businessName: w.name,
      mode: w.isGenerated ? 'ai-generated' : 'template',
      status: w.isPublished ? 'published' : 'draft',
      createdAt: w.createdAt,
    }))

    // Enrich generation records with genType + companyName from stored data
    const enrichedHistory = history.map((gen: any) => {
      const enriched = (gen.enrichedData as Record<string, unknown>) ?? {}
      const input = (gen.inputData as Record<string, unknown>) ?? {}
      return {
        ...gen,
        type: (enriched.genType as string) || 'gen',
        businessName: (enriched.companyName as string) || (input.companyName as string) || null,
      }
    })

    const combined = [...enrichedHistory, ...websiteItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 40)

    return NextResponse.json({ history: combined })
  }

  // ── Paginated user list ──
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50
  const search = searchParams.get('search') ?? ''

  const where = search ? {
    OR: [
      { email: { contains: search, mode: 'insensitive' as const } },
      { name:  { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search, mode: 'insensitive' as const } },
    ]
  } : {}

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, email: true, phone: true, name: true, plan: true, role: true,
        usageCount: true, usageResetAt: true, isSuspended: true, suspendReason: true,
        dailyGenLimit: true, monthlyGenLimit: true, yearlyGenLimit: true,
        createdAt: true, onboarded: true, location: true,
        _count: { select: { generations: true, userWebsites: true } },
      },
    }),
    db.user.count({ where }),
  ])

  // Attach last template used from their most recent website
  const usersWithTemplate = await Promise.all(
    users.map(async (u: any) => {
      const lastSite = await db.userWebsite.findFirst({
        where: { userId: u.id },
        orderBy: { createdAt: 'desc' },
        select: { templateId: true, templateLabel: true },
      }).catch(() => null)
      return {
        ...u,
        lastTemplate: lastSite?.templateLabel || lastSite?.templateId || null,
      }
    })
  )

  return NextResponse.json({ users: usersWithTemplate, total, page, pages: Math.ceil(total / limit) })
}
