import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always-public paths — no auth check needed
  const publicPaths = ['/login', '/api/auth', '/api/razorpay/webhook', '/api/generate']
  if (publicPaths.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith('/u/')) return NextResponse.next()

  // Homepage, generate, and templates are public (guests can access)
  if (pathname === '/' || pathname === '/generate' || pathname === '/templates') return NextResponse.next()

  // Read JWT token directly — no bcryptjs, works in Edge Runtime
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET!,
  })

  // Not authenticated — redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
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

  // Redirect to onboarding if not yet completed
  if (!token.onboarded) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
