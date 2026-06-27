import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { edgeAuth } from '@/lib/auth/edge-config'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Keep auth cookies stable by forcing one production domain.
  // If users log in on brandsyndicate.in but OAuth returns to www.brandsyndicate.in,
  // the browser treats them as different hosts and the session looks logged out.
  if (req.nextUrl.hostname === 'brandsyndicate.in') {
    const canonicalUrl = req.nextUrl.clone()
    canonicalUrl.hostname = 'www.brandsyndicate.in'
    canonicalUrl.protocol = 'https:'
    return NextResponse.redirect(canonicalUrl, 308)
  }

  // ── Always-public path prefixes ──────────────────────────────────────────
  const publicPrefixes = [
    '/login',
    '/signup',
    '/register',
    '/onboarding',
    '/forgot-password',
    '/reset-password',
    '/api/auth',
    '/api/register',
    '/api/user/profile',
    '/api/razorpay/webhook',
    // generate/* sub-routes that are public (read-only or intentional guest paths)
    '/api/generate',               // main generate — has intentional guest path for demo
    '/api/generate/load',          // load saved generation by id (read)
    '/api/generate/list',          // list user's own generations (read)
    '/api/generate/load-business', // load business data (read)
    '/api/generate/latest',        // latest generation (read)
    '/api/generate/update',        // update generation (guarded internally)
    '/api/generate-graphics',      // campaign poster generation (auth checked internally)
    '/api/edit-poster',            // AI poster edit (auth checked internally)
    '/api/image',                  // image proxy / Pexels fetch
    '/api/public/',
    '/api/projects/public/',
    '/api/user-websites/slug/',
    '/api/seo',
    '/api/website/',          // public: track, contact, book, blog, sitemap
    '/api/card/',
    '/api/contact',
    '/samples',
    '/w/',
  ]
  if (publicPrefixes.some(p => pathname.startsWith(p))) return NextResponse.next()

  // ── SEO / static files ────────────────────────────────────────────────────
  const staticFiles = ['/sitemap.xml','/robots.txt','/ads.txt','/sw.js',
    '/site.webmanifest','/manifest.json','/browserconfig.xml']
  if (staticFiles.includes(pathname)) return NextResponse.next()

  // ── Public page routes ───────────────────────────────────────────────────
  if (pathname === '/')            return NextResponse.next()
  if (pathname === '/templates')   return NextResponse.next()   // ← templates public
  if (pathname === '/about')       return NextResponse.next()
  if (pathname === '/privacy')     return NextResponse.next()
  if (pathname === '/terms')       return NextResponse.next()
  if (pathname === '/contact')     return NextResponse.next()
  if (pathname === '/pricing')     return NextResponse.next()
  if (pathname === '/faq')         return NextResponse.next()
  if (pathname === '/blog')        return NextResponse.next()   // blog listing page

  if (pathname.startsWith('/u/'))            return NextResponse.next()
  if (pathname.startsWith('/blog/'))         return NextResponse.next()
  if (pathname.startsWith('/p/'))            return NextResponse.next()
  if (pathname.startsWith('/resources'))     return NextResponse.next()
  if (pathname.startsWith('/guides'))        return NextResponse.next()
  if (pathname.startsWith('/articles'))      return NextResponse.next()

  // ── Auth check (Edge-safe via edge-config) ───────────────────────────────
  let session = null
  try {
    session = await edgeAuth()
  } catch (e) {
    console.error('[middleware] edgeAuth threw:', e)
    return NextResponse.next()   // fail open, pages re-validate
  }

  if (!session?.user) {
    // Preserve full path + query string (e.g. /generate?prompt=...) so prompt survives login redirect
    const fullPath = pathname + (req.nextUrl.search || '')
    const safeCallback =
      ['/login','/signup','/register'].includes(pathname) ? '/dashboard' : fullPath
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', safeCallback)
    return NextResponse.redirect(loginUrl)
  }

  // ── Admin gate ────────────────────────────────────────────────────────────
  const isAdmin = session.user.role === 'ADMIN'

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAdmin) return NextResponse.redirect(new URL('/generate', req.url))
    return NextResponse.next()
  }

  // Admin can freely use the app, no redirect away from /generate
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // ── Onboarding gate ───────────────────────────────────────────────────────
  if (session.user.onboarded === false && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|samples|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.webp$|.*\\.avif$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.html$|.*\\.webmanifest$|.*\\.json$|.*\\.xml$|.*\\.txt$|.*\\.css$|.*\\.js$|.*\\.woff$|.*\\.woff2$|.*\\.ttf$).*)'],
}
