import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Always-public paths ──────────────────────────────────────────────────
  const publicPrefixes = [
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth',
    '/api/register',
    '/api/razorpay/webhook',
    '/api/generate',
    '/api/image',
    '/api/public/',
    '/api/presentation/public/',
    '/api/projects/public/',
    '/api/seo',
    '/api/card/track-view',
    '/api/card/capture-lead',
    '/api/card/wallet-pass',
    '/api/contact',
  ]
  if (publicPrefixes.some(p => pathname.startsWith(p))) return NextResponse.next()

  // ── SEO / crawler files — always public ──────────────────────────────────
  if (pathname === '/sitemap.xml') return NextResponse.next()
  if (pathname === '/robots.txt')  return NextResponse.next()
  if (pathname === '/ads.txt')     return NextResponse.next()
  if (pathname === '/sw.js')       return NextResponse.next()

  // Public page routes (no login needed)
  if (pathname.startsWith('/u/'))            return NextResponse.next()
  if (pathname.startsWith('/presentation/')) return NextResponse.next()
  if (pathname.startsWith('/blog/'))         return NextResponse.next()
  if (pathname.startsWith('/p/'))            return NextResponse.next()

  // Homepage, generate, templates, and all public content pages are accessible without login
  if (pathname === '/' || pathname === '/generate' || pathname === '/templates') return NextResponse.next()
  if (pathname === '/about' || pathname === '/privacy' || pathname === '/terms' || pathname === '/contact') return NextResponse.next()
  if (pathname.startsWith('/resources') || pathname.startsWith('/guides') || pathname.startsWith('/articles')) return NextResponse.next()

  const session = await auth()

  // Not authenticated — redirect to login
  if (!session?.user) {
    const safeCallback =
      pathname === '/login' || pathname === '/signup' || pathname === '/register' ||
      pathname.startsWith('/login?') || pathname.startsWith('/signup?')
        ? '/generate'
        : pathname
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', safeCallback)
    return NextResponse.redirect(loginUrl)
  }

  // ── Admin: always allow /admin routes; redirect root/generate to /admin ──
  const isAdmin = session.user.email === ADMIN_EMAIL ||
    (session.user as unknown as Record<string, unknown>).role === 'ADMIN'

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAdmin) return NextResponse.redirect(new URL('/generate', req.url))
    return NextResponse.next()
  }

  // Redirect admin users away from regular app pages to /admin
  if (isAdmin && (pathname === '/' || pathname === '/generate')) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // Allow API routes and onboarding without further checks
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Only redirect to onboarding when onboarded is explicitly false
  if (session.user.onboarded === false) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)'],
}
