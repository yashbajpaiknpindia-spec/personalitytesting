import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Always-public paths ──────────────────────────────────────────────────
  const publicPrefixes = [
    '/login',
    '/signup',
    '/register',
    '/api/auth',
    '/api/register',
    '/api/razorpay/webhook',
    '/api/generate',
    '/api/image',          // FIX: image proxy must be public — guest users on /generate fetch it
    '/api/public/',
    '/api/presentation/public/',
    '/api/projects/public/',
    '/api/seo',
    '/api/card/track-view',
    '/api/card/capture-lead',
    '/api/card/wallet-pass',
  ]
  if (publicPrefixes.some(p => pathname.startsWith(p))) return NextResponse.next()

  // Public page routes (no login needed)
  if (pathname.startsWith('/u/'))            return NextResponse.next()
  if (pathname.startsWith('/presentation/')) return NextResponse.next()
  if (pathname.startsWith('/blog/'))         return NextResponse.next()
  if (pathname.startsWith('/p/'))            return NextResponse.next()

  // Homepage, generate, and templates are public (guests can access)
  if (pathname === '/' || pathname === '/generate' || pathname === '/templates') return NextResponse.next()

  // FIX: Use NextAuth v5 auth() — the correct API for v5.
  // The old getToken() from 'next-auth/jwt' is a v4 API that reads the cookie
  // 'next-auth.session-token', but NextAuth v5 sets 'authjs.session-token'.
  // This mismatch meant getToken() ALWAYS returned null, causing every
  // authenticated user to be treated as logged-out and redirected to /login.
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

  // Allow onboarding, admin, and all API routes without onboarding check
  if (
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin')
  ) {
    return NextResponse.next()
  }

  // Only redirect to onboarding when onboarded is explicitly false (not undefined/null)
  if (session.user.onboarded === false) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)'],
}
