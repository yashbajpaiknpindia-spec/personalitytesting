// src/app/api/admin/websites/route.ts
// Admin-only: list all UserWebsite rows with user info.
// GET /api/admin/websites?page=1&search=acme&filter=all|published|unpublished|generated|sample

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

const PAGE_SIZE = 24   // divisible by 3-col grid

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sp     = req.nextUrl.searchParams
  const page   = Math.max(1, parseInt(sp.get('page')   ?? '1'))
  const search = sp.get('search')?.trim() ?? ''
  const filter = sp.get('filter') ?? 'all'   // all | published | unpublished | generated | sample

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name:          { contains: search, mode: 'insensitive' } },
      { templateLabel: { contains: search, mode: 'insensitive' } },
      { templateId:    { contains: search, mode: 'insensitive' } },
      { customDomain:  { contains: search, mode: 'insensitive' } },
      { slug:          { contains: search, mode: 'insensitive' } },
      { prompt:        { contains: search, mode: 'insensitive' } },
      { user: { name:  { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (filter === 'published')   where.isPublished = true
  if (filter === 'unpublished') where.isPublished = false
  if (filter === 'generated')   where.isGenerated = true
  if (filter === 'sample')      where.isGenerated = false

  const [total, websites] = await Promise.all([
    db.userWebsite.count({ where }),
    db.userWebsite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * PAGE_SIZE,
      take:    PAGE_SIZE,
      select: {
        id: true, name: true, templateId: true, templateLabel: true,
        isGenerated: true, isPublished: true, slug: true,
        customDomain: true, domainVerified: true, adminNote: true, prompt: true,
        createdAt: true, updatedAt: true,
        // htmlContent intentionally excluded here (large) — fetched per-card on edit
        user: {
          select: { id: true, name: true, email: true, plan: true, createdAt: true },
        },
      },
    }),
  ])

  return NextResponse.json({
    websites,
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
    pageSize: PAGE_SIZE,
  })
}
