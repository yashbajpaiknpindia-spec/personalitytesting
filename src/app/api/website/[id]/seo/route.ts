// src/app/api/website/[id]/seo/route.ts
// GET  /api/website/[id]/seo  → extract current SEO values from stored HTML
// PATCH /api/website/[id]/seo  → inject/replace SEO tags in stored HTML
//
// Handles: title, meta description, OG title, OG description,
//           OG image, canonical URL, GSC verification tag, GA4 id.
// All fields optional — only supplied fields are updated.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ── Tag extraction helpers ────────────────────────────────────────────────────

function extractMeta(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta\\s[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))
    ?? html.match(new RegExp(`<meta\\s[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'))
  return m?.[1] ?? ''
}
function extractOg(html: string, prop: string): string {
  const m = html.match(new RegExp(`<meta\\s[^>]*property=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i'))
    ?? html.match(new RegExp(`<meta\\s[^>]*content=["']([^"']*)["'][^>]*property=["']${prop}["']`, 'i'))
  return m?.[1] ?? ''
}
function extractTitle(html: string): string {
  return html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? ''
}
function extractCanonical(html: string): string {
  return html.match(/<link\s[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)?.[1] ?? ''
}

// ── Tag injection helpers ─────────────────────────────────────────────────────

// Replace or append a <meta name="..."> tag
function setMetaName(html: string, name: string, content: string): string {
  const escaped = content.replace(/"/g, '&quot;')
  const tag = `<meta name="${name}" content="${escaped}">`
  // Replace existing
  let next = html
    .replace(new RegExp(`<meta\\s[^>]*name=["']${name}["'][^>]*/?>`, 'gi'), '')
    .replace(new RegExp(`<meta\\s[^>]*content=["'][^"']*["'][^>]*name=["']${name}["'][^>]*/?>`, 'gi'), '')
  // Inject before </head>
  return next.replace(/<\/head>/i, `${tag}\n</head>`)
}

// Replace or append a <meta property="og:..."> tag
function setMetaOg(html: string, prop: string, content: string): string {
  const escaped = content.replace(/"/g, '&quot;')
  const tag = `<meta property="${prop}" content="${escaped}">`
  let next = html
    .replace(new RegExp(`<meta\\s[^>]*property=["']${prop}["'][^>]*/?>`, 'gi'), '')
    .replace(new RegExp(`<meta\\s[^>]*content=["'][^"']*["'][^>]*property=["']${prop}["'][^>]*/?>`, 'gi'), '')
  return next.replace(/<\/head>/i, `${tag}\n</head>`)
}

function setTitle(html: string, title: string): string {
  const escaped = title.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  if (/<title[^>]*>/i.test(html)) {
    return html.replace(/<title[^>]*>[^<]*<\/title>/i, `<title>${escaped}</title>`)
  }
  return html.replace(/<\/head>/i, `<title>${escaped}</title>\n</head>`)
}

function setCanonical(html: string, url: string): string {
  const tag = `<link rel="canonical" href="${url}">`
  let next = html.replace(/<link\s[^>]*rel=["']canonical["'][^>]*>/gi, '')
  return next.replace(/<\/head>/i, `${tag}\n</head>`)
}

function injectGa4(html: string, gaId: string): string {
  // Remove existing GA4 snippets first
  let next = html
    .replace(/<script[^>]*googletagmanager[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>\s*window\.dataLayer[\s\S]*?<\/script>/gi, '')
  const script = `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>` +
    `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
    `gtag('js',new Date());gtag('config','${gaId}');</script>`
  return next.replace(/<\/head>/i, `${script}\n</head>`)
}

function injectGsc(html: string, gscTag: string): string {
  let next = html.replace(/<meta\s[^>]*google-site-verification[^>]*>/gi, '')
  return next.replace(/<\/head>/i, `<meta name="google-site-verification" content="${gscTag}">\n</head>`)
}

// ── Ownership guard ───────────────────────────────────────────────────────────

async function getOwnedSite(id: string, userId: string, isAdmin: boolean) {
  return isAdmin
    ? db.userWebsite.findUnique({ where: { id } })
    : db.userWebsite.findFirst({ where: { id, userId } })
}

// ── GET: read current SEO values ──────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.email === 'yashbajpaiknpindia@gmail.com'
  const site = await getOwnedSite(params.id, session.user.id, isAdmin)
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const html = site.htmlContent ?? ''
  return NextResponse.json({
    title:          extractTitle(html),
    description:    extractMeta(html, 'description'),
    ogTitle:        extractOg(html, 'og:title'),
    ogDescription:  extractOg(html, 'og:description'),
    ogImage:        extractOg(html, 'og:image'),
    canonical:      extractCanonical(html),
    // Note: GSC and GA4 are write-only (don't expose them back)
  })
}

// ── PATCH: inject/replace SEO tags ───────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.email === 'yashbajpaiknpindia@gmail.com'
  const site = await getOwnedSite(params.id, session.user.id, isAdmin)
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const {
    title, description, ogTitle, ogDescription, ogImage,
    canonical, gaId, gscTag,
  } = body as {
    title?:         string
    description?:   string
    ogTitle?:       string
    ogDescription?: string
    ogImage?:       string
    canonical?:     string
    gaId?:          string
    gscTag?:        string
  }

  let html = site.htmlContent ?? ''
  if (!html.includes('</head>')) {
    return NextResponse.json({ error: 'Invalid HTML — no </head> tag found' }, { status: 422 })
  }

  if (title?.trim())          html = setTitle(html, title.trim())
  if (description?.trim())    html = setMetaName(html, 'description', description.trim())
  if (ogTitle?.trim())        html = setMetaOg(html, 'og:title', ogTitle.trim())
  if (ogDescription?.trim())  html = setMetaOg(html, 'og:description', ogDescription.trim())
  if (ogImage?.trim())        html = setMetaOg(html, 'og:image', ogImage.trim())
  if (canonical?.trim())      html = setCanonical(html, canonical.trim())
  if (gaId?.trim())           html = injectGa4(html, gaId.trim())
  if (gscTag?.trim())         html = injectGsc(html, gscTag.trim())

  // Always ensure og:type and og:url are present when og:title is set
  if ((ogTitle?.trim() || extractOg(html, 'og:title')) && !extractOg(html, 'og:type')) {
    html = setMetaOg(html, 'og:type', 'website')
  }

  await db.userWebsite.update({
    where: { id: params.id },
    data:  { htmlContent: html },
  })

  return NextResponse.json({ ok: true })
}
