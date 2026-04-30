import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'

type ImportResult = {
  table: string
  attempted: number
  inserted: number
  skipped: number
  errors: string[]
}

// Safely upsert a batch of rows, returning counts
async function upsertBatch<T extends Record<string, unknown>>(
  rows: T[],
  table: string,
  upsertFn: (row: T) => Promise<unknown>
): Promise<ImportResult> {
  const result: ImportResult = { table, attempted: rows.length, inserted: 0, skipped: 0, errors: [] }
  for (const row of rows) {
    try {
      await upsertFn(row)
      result.inserted++
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      // P2002 = unique constraint — row already exists, skip gracefully
      if (msg.includes('P2002') || msg.includes('unique constraint')) {
        result.skipped++
      } else {
        result.errors.push(`${(row as { id?: string }).id ?? '?'}: ${msg.slice(0, 120)}`)
        result.skipped++
      }
    }
  }
  return result
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user.email !== ADMIN_EMAIL && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // Accept either the full export envelope { _meta, data } or just { data }
  const raw = (body.data ?? body) as Record<string, unknown>
  if (!raw || typeof raw !== 'object') {
    return NextResponse.json({ error: 'Missing data object' }, { status: 400 })
  }

  const results: ImportResult[] = []

  function arr<T>(key: string): T[] {
    const v = raw[key]
    return Array.isArray(v) ? (v as T[]) : []
  }

  // ── 1. Templates (no user FK, safe to go first) ─────────────────────────
  const templates = arr<Record<string, unknown>>('templates')
  if (templates.length > 0) {
    results.push(await upsertBatch(templates, 'templates', (t) =>
      db.template.upsert({
        where: { slug: String(t.slug) },
        create: {
          id:          String(t.id),
          name:        String(t.name ?? ''),
          slug:        String(t.slug ?? ''),
          category:    String(t.category ?? 'portfolio'),
          tier:        String(t.tier ?? 'free'),
          description: t.description ? String(t.description) : null,
          accentColor: String(t.accentColor ?? '#C9A84C'),
          preview:     t.preview ? String(t.preview) : null,
          sortOrder:   Number(t.sortOrder ?? 0),
          createdAt:   t.createdAt ? new Date(String(t.createdAt)) : new Date(),
        },
        update: {
          name:        String(t.name ?? ''),
          category:    String(t.category ?? 'portfolio'),
          tier:        String(t.tier ?? 'free'),
          description: t.description ? String(t.description) : null,
          accentColor: String(t.accentColor ?? '#C9A84C'),
          sortOrder:   Number(t.sortOrder ?? 0),
        },
      })
    ))
  }

  // ── 2. Admin settings ────────────────────────────────────────────────────
  const adminSettings = arr<Record<string, unknown>>('admin_settings')
  if (adminSettings.length > 0) {
    results.push(await upsertBatch(adminSettings, 'admin_settings', (s) =>
      db.adminSettings.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', usdToInr: Number(s.usdToInr ?? 84) },
        update: { usdToInr: Number(s.usdToInr ?? 84) },
      })
    ))
  }

  // ── 3. Pricing plans ─────────────────────────────────────────────────────
  const pricingPlans = arr<Record<string, unknown>>('pricing_plans')
  if (pricingPlans.length > 0) {
    results.push(await upsertBatch(pricingPlans, 'pricing_plans', (p) =>
      db.pricingPlan.upsert({
        where: { planId: String(p.planId) },
        create: {
          id:        String(p.id),
          planId:    String(p.planId),
          name:      String(p.name ?? ''),
          price:     String(p.price ?? '0'),
          period:    String(p.period ?? '/month'),
          features:  String(p.features ?? '[]'),
          isVisible: Boolean(p.isVisible ?? true),
          sortOrder: Number(p.sortOrder ?? 0),
          highlight: Boolean(p.highlight ?? false),
        },
        update: {
          name:      String(p.name ?? ''),
          price:     String(p.price ?? '0'),
          features:  String(p.features ?? '[]'),
          isVisible: Boolean(p.isVisible ?? true),
          sortOrder: Number(p.sortOrder ?? 0),
          highlight: Boolean(p.highlight ?? false),
        },
      })
    ))
  }

  // ── 4. Users (password excluded from export — set placeholder) ───────────
  const users = arr<Record<string, unknown>>('users')
  if (users.length > 0) {
    results.push(await upsertBatch(users, 'users', (u) =>
      db.user.upsert({
        where: { id: String(u.id) },
        create: {
          id:           String(u.id),
          email:        String(u.email),
          password:     null, // no password in export — user must reset
          name:         u.name ? String(u.name) : null,
          username:     u.username ? String(u.username) : null,
          image:        u.image ? String(u.image) : null,
          role:         (u.role as 'USER' | 'ADMIN') ?? 'USER',
          plan:         (u.plan as 'FREE' | 'PRO' | 'TEAM') ?? 'FREE',
          jobTitle:     u.jobTitle ? String(u.jobTitle) : null,
          company:      u.company ? String(u.company) : null,
          location:     u.location ? String(u.location) : null,
          website:      u.website ? String(u.website) : null,
          linkedin:     u.linkedin ? String(u.linkedin) : null,
          bio:          u.bio ? String(u.bio) : null,
          accentColor:  u.accentColor ? String(u.accentColor) : '#C9A84C',
          usageCount:   Number(u.usageCount ?? 0),
          usageResetAt: u.usageResetAt ? new Date(String(u.usageResetAt)) : new Date(),
          isSuspended:  Boolean(u.isSuspended ?? false),
          suspendReason:u.suspendReason ? String(u.suspendReason) : null,
          onboarded:    Boolean(u.onboarded ?? false),
          referralCode: u.referralCode ? String(u.referralCode) : null,
          referredBy:     u.referredBy ? String(u.referredBy) : null,
          dailyGenLimit:  u.dailyGenLimit ? Number(u.dailyGenLimit) : null,
          monthlyGenLimit:u.monthlyGenLimit ? Number(u.monthlyGenLimit) : null,
          yearlyGenLimit: u.yearlyGenLimit ? Number(u.yearlyGenLimit) : null,
          razorpayId:     u.razorpayId ? String(u.razorpayId) : null,
          razorpaySubId:  u.razorpaySubId ? String(u.razorpaySubId) : null,
          createdAt:      u.createdAt ? new Date(String(u.createdAt)) : new Date(),
          updatedAt:    u.updatedAt ? new Date(String(u.updatedAt)) : new Date(),
        },
        update: {
          email:        String(u.email),
          name:         u.name ? String(u.name) : null,
          role:         (u.role as 'USER' | 'ADMIN') ?? 'USER',
          plan:         (u.plan as 'FREE' | 'PRO' | 'TEAM') ?? 'FREE',
          jobTitle:     u.jobTitle ? String(u.jobTitle) : null,
          company:      u.company ? String(u.company) : null,
          location:     u.location ? String(u.location) : null,
          website:      u.website ? String(u.website) : null,
          linkedin:     u.linkedin ? String(u.linkedin) : null,
          bio:          u.bio ? String(u.bio) : null,
          accentColor:  u.accentColor ? String(u.accentColor) : '#C9A84C',
          usageCount:   Number(u.usageCount ?? 0),
          isSuspended:  Boolean(u.isSuspended ?? false),
          onboarded:    Boolean(u.onboarded ?? false),
        },
      })
    ))
  }

  // ── 5. Generations ───────────────────────────────────────────────────────
  const generations = arr<Record<string, unknown>>('generations')
  if (generations.length > 0) {
    results.push(await upsertBatch(generations, 'generations', (g) =>
      db.generation.upsert({
        where: { id: String(g.id) },
        create: {
          id:           String(g.id),
          userId:       String(g.userId),
          templateId:   String(g.templateId),
          status:       (g.status as 'PENDING' | 'COMPLETE' | 'FAILED' | 'FLAGGED') ?? 'COMPLETE',
          inputData:    (g.inputData ?? {}) as object,
          enrichedData: g.enrichedData as object ?? undefined,
          outputData:   g.outputData as object ?? undefined,
          tokenCount:   g.tokenCount ? Number(g.tokenCount) : null,
          inputTokens:  g.inputTokens ? Number(g.inputTokens) : null,
          outputTokens: g.outputTokens ? Number(g.outputTokens) : null,
          modelUsed:    g.modelUsed ? String(g.modelUsed) : null,
          costUsd:      g.costUsd ? Number(g.costUsd) : null,
          flagReason:   g.flagReason ? String(g.flagReason) : null,
          version:      Number(g.version ?? 1),
          parentId:     g.parentId ? String(g.parentId) : null,
          createdAt:    g.createdAt ? new Date(String(g.createdAt)) : new Date(),
        },
        update: {
          status:      (g.status as 'PENDING' | 'COMPLETE' | 'FAILED' | 'FLAGGED') ?? 'COMPLETE',
          outputData:  g.outputData as object ?? undefined,
          inputData:   (g.inputData ?? {}) as object,
          tokenCount:  g.tokenCount ? Number(g.tokenCount) : null,
          costUsd:     g.costUsd ? Number(g.costUsd) : null,
        },
      })
    ))
  }

  // ── 6. Exports ───────────────────────────────────────────────────────────
  const exports_ = arr<Record<string, unknown>>('exports')
  if (exports_.length > 0) {
    results.push(await upsertBatch(exports_, 'exports', (e) =>
      db.export.upsert({
        where: { id: String(e.id) },
        create: {
          id:           String(e.id),
          userId:       String(e.userId),
          generationId: String(e.generationId),
          format:       String(e.format) as 'PDF' | 'PPTX' | 'HTML' | 'VCARD' | 'QR',
          cloudinaryId: e.cloudinaryId ? String(e.cloudinaryId) : null,
          url:          e.url ? String(e.url) : null,
          expiresAt:    e.expiresAt ? new Date(String(e.expiresAt)) : null,
          downloadCount:Number(e.downloadCount ?? 0),
          createdAt:    e.createdAt ? new Date(String(e.createdAt)) : new Date(),
        },
        update: {
          url:          e.url ? String(e.url) : null,
          downloadCount:Number(e.downloadCount ?? 0),
        },
      })
    ))
  }

  // ── 7. Portfolios ────────────────────────────────────────────────────────
  const portfolios = arr<Record<string, unknown>>('portfolios')
  if (portfolios.length > 0) {
    results.push(await upsertBatch(portfolios, 'portfolios', (p) =>
      db.portfolio.upsert({
        where: { id: String(p.id) },
        create: {
          id:             String(p.id),
          userId:         String(p.userId),
          generationId:   String(p.generationId),
          slug:           String(p.slug),
          isPublished:    Boolean(p.isPublished ?? true),
          customDomain:   p.customDomain ? String(p.customDomain) : null,
          websiteTheme:   p.websiteTheme ? String(p.websiteTheme) : 'the-manifesto',
          seoTitle:       p.seoTitle ? String(p.seoTitle) : null,
          seoDescription: p.seoDescription ? String(p.seoDescription) : null,
          ogImageUrl:     p.ogImageUrl ? String(p.ogImageUrl) : null,
          viewCount:      Number(p.viewCount ?? 0),
          publishedAt:    p.publishedAt ? new Date(String(p.publishedAt)) : new Date(),
          updatedAt:      p.updatedAt ? new Date(String(p.updatedAt)) : new Date(),
        },
        update: {
          isPublished:  Boolean(p.isPublished ?? true),
          customDomain: p.customDomain ? String(p.customDomain) : null,
          websiteTheme: p.websiteTheme ? String(p.websiteTheme) : 'the-manifesto',
          viewCount:    Number(p.viewCount ?? 0),
        },
      })
    ))
  }

  // ── 8. Contacts ──────────────────────────────────────────────────────────
  const contacts = arr<Record<string, unknown>>('contacts')
  if (contacts.length > 0) {
    results.push(await upsertBatch(contacts, 'contacts', (c) =>
      db.contact.upsert({
        where: { id: String(c.id) },
        create: {
          id:         String(c.id),
          ownerId:    String(c.ownerId),
          name:       String(c.name ?? ''),
          email:      String(c.email ?? ''),
          phone:      c.phone ? String(c.phone) : null,
          company:    c.company ? String(c.company) : null,
          sourceSlug: c.sourceSlug ? String(c.sourceSlug) : null,
          createdAt:  c.createdAt ? new Date(String(c.createdAt)) : new Date(),
        },
        update: {
          name:    String(c.name ?? ''),
          email:   String(c.email ?? ''),
          phone:   c.phone ? String(c.phone) : null,
          company: c.company ? String(c.company) : null,
        },
      })
    ))
  }

  // ── 9. Social links ──────────────────────────────────────────────────────
  const socialLinks = arr<Record<string, unknown>>('social_links')
  if (socialLinks.length > 0) {
    results.push(await upsertBatch(socialLinks, 'social_links', (s) =>
      db.socialLinks.upsert({
        where: { id: String(s.id) },
        create: {
          id:        String(s.id),
          userId:    String(s.userId),
          linkedin:  s.linkedin ? String(s.linkedin) : null,
          whatsapp:  s.whatsapp ? String(s.whatsapp) : null,
          instagram: s.instagram ? String(s.instagram) : null,
          website:   s.website ? String(s.website) : null,
          portfolio: s.portfolio ? String(s.portfolio) : null,
          twitter:   s.twitter ? String(s.twitter) : null,
          github:    s.github ? String(s.github) : null,
          createdAt: s.createdAt ? new Date(String(s.createdAt)) : new Date(),
          updatedAt: s.updatedAt ? new Date(String(s.updatedAt)) : new Date(),
        },
        update: {
          linkedin:  s.linkedin ? String(s.linkedin) : null,
          whatsapp:  s.whatsapp ? String(s.whatsapp) : null,
          instagram: s.instagram ? String(s.instagram) : null,
          website:   s.website ? String(s.website) : null,
          portfolio: s.portfolio ? String(s.portfolio) : null,
          twitter:   s.twitter ? String(s.twitter) : null,
          github:    s.github ? String(s.github) : null,
        },
      })
    ))
  }

  // ── 10. Domains ──────────────────────────────────────────────────────────
  const domains = arr<Record<string, unknown>>('domains')
  if (domains.length > 0) {
    results.push(await upsertBatch(domains, 'domains', (d) =>
      db.domain.upsert({
        where: { id: String(d.id) },
        create: {
          id:                String(d.id),
          userId:            String(d.userId),
          domain:            String(d.domain),
          verified:          Boolean(d.verified ?? false),
          verificationToken: String(d.verificationToken ?? ''),
          cnameTarget:       String(d.cnameTarget ?? 'cname.brandsyndicate.in'),
          createdAt:         d.createdAt ? new Date(String(d.createdAt)) : new Date(),
          updatedAt:         d.updatedAt ? new Date(String(d.updatedAt)) : new Date(),
        },
        update: {
          verified:          Boolean(d.verified ?? false),
          verificationToken: String(d.verificationToken ?? ''),
        },
      })
    ))
  }

  // ── 11. Projects ─────────────────────────────────────────────────────────
  const projects = arr<Record<string, unknown>>('projects')
  if (projects.length > 0) {
    results.push(await upsertBatch(projects, 'projects', (p) =>
      db.project.upsert({
        where: { id: String(p.id) },
        create: {
          id:          String(p.id),
          userId:      String(p.userId),
          title:       String(p.title ?? ''),
          description: p.description ? String(p.description) : null,
          url:         p.url ? String(p.url) : null,
          imageUrl:    p.imageUrl ? String(p.imageUrl) : null,
          tags:        Array.isArray(p.tags) ? (p.tags as string[]) : [],
          featured:    Boolean(p.featured ?? false),
          order:       Number(p.order ?? 0),
          publishedAt: p.publishedAt ? new Date(String(p.publishedAt)) : null,
          createdAt:   p.createdAt ? new Date(String(p.createdAt)) : new Date(),
          updatedAt:   p.updatedAt ? new Date(String(p.updatedAt)) : new Date(),
        },
        update: {
          title:       String(p.title ?? ''),
          description: p.description ? String(p.description) : null,
          url:         p.url ? String(p.url) : null,
          imageUrl:    p.imageUrl ? String(p.imageUrl) : null,
          tags:        Array.isArray(p.tags) ? (p.tags as string[]) : [],
          featured:    Boolean(p.featured ?? false),
          order:       Number(p.order ?? 0),
        },
      })
    ))
  }

  // ── 12. SEO settings ─────────────────────────────────────────────────────
  const seoSettings = arr<Record<string, unknown>>('seo_settings')
  if (seoSettings.length > 0) {
    results.push(await upsertBatch(seoSettings, 'seo_settings', (s) =>
      db.seoSettings.upsert({
        where: { id: String(s.id) },
        create: {
          id:              String(s.id),
          userId:          String(s.userId),
          pageTitle:       s.pageTitle ? String(s.pageTitle) : null,
          metaDescription: s.metaDescription ? String(s.metaDescription) : null,
          ogImageUrl:      s.ogImageUrl ? String(s.ogImageUrl) : null,
          twitterHandle:   s.twitterHandle ? String(s.twitterHandle) : null,
          canonicalUrl:    s.canonicalUrl ? String(s.canonicalUrl) : null,
          noIndex:         Boolean(s.noIndex ?? false),
          createdAt:       s.createdAt ? new Date(String(s.createdAt)) : new Date(),
          updatedAt:       s.updatedAt ? new Date(String(s.updatedAt)) : new Date(),
        },
        update: {
          pageTitle:       s.pageTitle ? String(s.pageTitle) : null,
          metaDescription: s.metaDescription ? String(s.metaDescription) : null,
          ogImageUrl:      s.ogImageUrl ? String(s.ogImageUrl) : null,
          noIndex:         Boolean(s.noIndex ?? false),
        },
      })
    ))
  }

  // ── 13. Blog posts ───────────────────────────────────────────────────────
  const blogPosts = arr<Record<string, unknown>>('blog_posts')
  if (blogPosts.length > 0) {
    results.push(await upsertBatch(blogPosts, 'blog_posts', (p) =>
      db.blogPost.upsert({
        where: { id: String(p.id) },
        create: {
          id:             String(p.id),
          userId:         String(p.userId),
          title:          String(p.title ?? ''),
          slug:           String(p.slug ?? ''),
          excerpt:        p.excerpt ? String(p.excerpt) : null,
          content:        String(p.content ?? ''),
          coverImageUrl:  p.coverImageUrl ? String(p.coverImageUrl) : null,
          tags:           Array.isArray(p.tags) ? (p.tags as string[]) : [],
          published:      Boolean(p.published ?? false),
          publishedAt:    p.publishedAt ? new Date(String(p.publishedAt)) : null,
          seoTitle:       p.seoTitle ? String(p.seoTitle) : null,
          seoDescription: p.seoDescription ? String(p.seoDescription) : null,
          readingMinutes: p.readingMinutes ? Number(p.readingMinutes) : 1,
          viewCount:      Number(p.viewCount ?? 0),
          createdAt:      p.createdAt ? new Date(String(p.createdAt)) : new Date(),
          updatedAt:      p.updatedAt ? new Date(String(p.updatedAt)) : new Date(),
        },
        update: {
          title:     String(p.title ?? ''),
          content:   String(p.content ?? ''),
          published: Boolean(p.published ?? false),
          viewCount: Number(p.viewCount ?? 0),
          tags:      Array.isArray(p.tags) ? (p.tags as string[]) : [],
        },
      })
    ))
  }

  // ── 14. Presentations + Slides ───────────────────────────────────────────
  const presentations = arr<Record<string, unknown>>('presentations')
  if (presentations.length > 0) {
    const presResult: ImportResult = { table: 'presentations', attempted: presentations.length, inserted: 0, skipped: 0, errors: [] }
    const slideResult: ImportResult = { table: 'slides (nested)', attempted: 0, inserted: 0, skipped: 0, errors: [] }

    for (const p of presentations) {
      try {
        await db.presentation.upsert({
          where: { id: String(p.id) },
          create: {
            id:          String(p.id),
            userId:      String(p.userId),
            title:       String(p.title ?? 'Untitled Presentation'),
            slug:        String(p.slug ?? String(p.id)),
            accentColor: String(p.accentColor ?? '#C9A84C'),
            meta:        p.meta as object ?? undefined,
            createdAt:   p.createdAt ? new Date(String(p.createdAt)) : new Date(),
            updatedAt:   p.updatedAt ? new Date(String(p.updatedAt)) : new Date(),
          },
          update: {
            title:       String(p.title ?? 'Untitled'),
            accentColor: String(p.accentColor ?? '#C9A84C'),
            meta:        p.meta as object ?? undefined,
          },
        })
        presResult.inserted++

        // Upsert nested slides if present
        const nestedSlides = Array.isArray(p.slides) ? (p.slides as Record<string, unknown>[]) : []
        slideResult.attempted += nestedSlides.length
        for (const s of nestedSlides) {
          try {
            await db.slide.upsert({
              where: { id: String(s.id) },
              create: {
                id:             String(s.id),
                presentationId: String(p.id),
                order:          Number(s.order ?? 0),
                content:        (s.content ?? {}) as object,
                createdAt:      s.createdAt ? new Date(String(s.createdAt)) : new Date(),
                updatedAt:      s.updatedAt ? new Date(String(s.updatedAt)) : new Date(),
              },
              update: {
                order:   Number(s.order ?? 0),
                content: (s.content ?? {}) as object,
              },
            })
            slideResult.inserted++
          } catch (e) {
            slideResult.skipped++
            slideResult.errors.push(String(e).slice(0, 80))
          }
        }
      } catch (e) {
        presResult.skipped++
        presResult.errors.push(String(e).slice(0, 80))
      }
    }
    results.push(presResult)
    if (slideResult.attempted > 0) results.push(slideResult)
  }

  // ── 15. Resume versions ──────────────────────────────────────────────────
  const resumeVersions = arr<Record<string, unknown>>('resume_versions')
  if (resumeVersions.length > 0) {
    results.push(await upsertBatch(resumeVersions, 'resume_versions', (r) =>
      db.resumeVersion.upsert({
        where: { id: String(r.id) },
        create: {
          id:             String(r.id),
          userId:         String(r.userId),
          originalResume: (r.originalResume ?? {}) as object,
          tailoredResume: r.tailoredResume as object ?? undefined,
          jobDescription: r.jobDescription ? String(r.jobDescription) : null,
          coverLetter:    r.coverLetter ? String(r.coverLetter) : null,
          atsScore:       r.atsScore ? Number(r.atsScore) : null,
          atsBreakdown:   r.atsBreakdown as object ?? undefined,
          atsSuggestions: r.atsSuggestions as object ?? undefined,
          tone:           r.tone ? String(r.tone) : 'professional',
          label:          r.label ? String(r.label) : null,
          createdAt:      r.createdAt ? new Date(String(r.createdAt)) : new Date(),
        },
        update: {
          tailoredResume: r.tailoredResume as object ?? undefined,
          coverLetter:    r.coverLetter ? String(r.coverLetter) : null,
          atsScore:       r.atsScore ? Number(r.atsScore) : null,
          label:          r.label ? String(r.label) : null,
        },
      })
    ))
  }

  // ── 16. Notifications + reads ────────────────────────────────────────────
  const notifications = arr<Record<string, unknown>>('notifications')
  if (notifications.length > 0) {
    results.push(await upsertBatch(notifications, 'notifications', (n) =>
      db.notification.upsert({
        where: { id: String(n.id) },
        create: {
          id:           String(n.id),
          title:        String(n.title ?? ''),
          body:         String(n.body ?? ''),
          imageUrl:     n.imageUrl ? String(n.imageUrl) : null,
          type:         String(n.type ?? 'broadcast'),
          targetUserId: n.targetUserId ? String(n.targetUserId) : null,
          sentBy:       String(n.sentBy ?? 'admin'),
          createdAt:    n.createdAt ? new Date(String(n.createdAt)) : new Date(),
        },
        update: {
          title: String(n.title ?? ''),
          body:  String(n.body ?? ''),
        },
      })
    ))
  }

  // ── 17. API call logs (optional — can be large) ──────────────────────────
  const apiCallLogs = arr<Record<string, unknown>>('api_call_logs')
  if (apiCallLogs.length > 0) {
    results.push(await upsertBatch(apiCallLogs, 'api_call_logs', (l) =>
      db.apiCallLog.upsert({
        where: { id: String(l.id) },
        create: {
          id:           String(l.id),
          service:      String(l.service ?? 'claude'),
          userId:       l.userId ? String(l.userId) : null,
          endpoint:     l.endpoint ? String(l.endpoint) : null,
          model:        l.model ? String(l.model) : null,
          inputTokens:  l.inputTokens ? Number(l.inputTokens) : null,
          outputTokens: l.outputTokens ? Number(l.outputTokens) : null,
          totalTokens:  l.totalTokens ? Number(l.totalTokens) : null,
          costUsd:      l.costUsd ? Number(l.costUsd) : null,
          costInr:      l.costInr ? Number(l.costInr) : null,
          query:        l.query ? String(l.query) : null,
          success:      Boolean(l.success ?? true),
          cached:       Boolean(l.cached ?? false),
          generationId: l.generationId ? String(l.generationId) : null,
          createdAt:    l.createdAt ? new Date(String(l.createdAt)) : new Date(),
        },
        update: {
          success: Boolean(l.success ?? true),
          cached:  Boolean(l.cached ?? false),
        },
      })
    ))
  }

  // ── 18. Card views ───────────────────────────────────────────────────────
  const cardViews = arr<Record<string, unknown>>('card_views')
  if (cardViews.length > 0) {
    results.push(await upsertBatch(cardViews, 'card_views', (c) =>
      db.cardView.upsert({
        where: { id: String(c.id) },
        create: {
          id:        String(c.id),
          ownerId:   String(c.ownerId),
          visitorIp: c.visitorIp ? String(c.visitorIp) : null,
          userAgent: c.userAgent ? String(c.userAgent) : null,
          referer:   c.referer ? String(c.referer) : null,
          createdAt: c.createdAt ? new Date(String(c.createdAt)) : new Date(),
        },
        update: {},
      })
    ))
  }

  // ── 19. Analytics events ─────────────────────────────────────────────────
  const analyticsEvents = arr<Record<string, unknown>>('analytics_events')
  if (analyticsEvents.length > 0) {
    results.push(await upsertBatch(analyticsEvents, 'analytics_events', (e) =>
      db.analyticsEvent.upsert({
        where: { id: String(e.id) },
        create: {
          id:        String(e.id),
          ownerId:   String(e.ownerId),
          type:      String(e.type) as 'PORTFOLIO_VIEW' | 'CARD_VIEW' | 'RESUME_DOWNLOAD' | 'PRESENTATION_VIEW' | 'LEAD_CAPTURED',
          metadata:  e.metadata as object ?? undefined,
          visitorIp: e.visitorIp ? String(e.visitorIp) : null,
          userAgent: e.userAgent ? String(e.userAgent) : null,
          referer:   e.referer ? String(e.referer) : null,
          createdAt: e.createdAt ? new Date(String(e.createdAt)) : new Date(),
        },
        update: {},
      })
    ))
  }

  // ── 20. Notification reads ───────────────────────────────────────────────
  const notificationReads = arr<Record<string, unknown>>('notification_reads')
  if (notificationReads.length > 0) {
    results.push(await upsertBatch(notificationReads, 'notification_reads', (r) =>
      db.notificationRead.upsert({
        where: { notificationId_userId: { notificationId: String(r.notificationId), userId: String(r.userId) } },
        create: {
          id:             String(r.id),
          notificationId: String(r.notificationId),
          userId:         String(r.userId),
          readAt:         r.readAt ? new Date(String(r.readAt)) : new Date(),
        },
        update: {},
      })
    ))
  }

  // ── 21. Page visits ──────────────────────────────────────────────────────
  const pageVisits = arr<Record<string, unknown>>('page_visits')
  if (pageVisits.length > 0) {
    results.push(await upsertBatch(pageVisits, 'page_visits', (v) =>
      db.pageVisit.upsert({
        where: { id: String(v.id) },
        create: {
          id:         String(v.id),
          userId:     String(v.userId),
          page:       String(v.page ?? ''),
          durationMs: v.durationMs ? Number(v.durationMs) : null,
          sessionId:  v.sessionId ? String(v.sessionId) : null,
          userAgent:  v.userAgent ? String(v.userAgent) : null,
          createdAt:  v.createdAt ? new Date(String(v.createdAt)) : new Date(),
        },
        update: {},
      })
    ))
  }

  const totalInserted = results.reduce((a, r) => a + r.inserted, 0)
  const totalSkipped  = results.reduce((a, r) => a + r.skipped, 0)
  const totalErrors   = results.flatMap(r => r.errors)

  return NextResponse.json({
    success: true,
    summary: {
      totalInserted,
      totalSkipped,
      errorCount: totalErrors.length,
    },
    results,
    errors: totalErrors.slice(0, 50), // cap output
  })
}
