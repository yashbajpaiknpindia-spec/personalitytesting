// src/app/api/download-image/route.ts
// Proxy route that fetches an image (e.g. a Cloudinary URL) server-side and
// streams it back with Content-Disposition: attachment so the browser
// downloads it instead of navigating to the cross-origin URL.
//
// GET /api/download-image?url=<encoded-image-url>&filename=<filename>

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'

// Allowed CDN hostnames — only proxy images we generated ourselves.
const ALLOWED_HOSTS = [
  'res.cloudinary.com',
  'images.pexels.com',
  'images.unsplash.com',
  'brandsyndicate.in',
  'app.brandsyndicate.io',
  'localhost',
]

export async function GET(req: NextRequest) {
  // Must be logged in
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const rawUrl    = searchParams.get('url')
  const filename  = searchParams.get('filename') ?? 'poster.png'

  if (!rawUrl) {
    return new NextResponse('Missing ?url param', { status: 400 })
  }

  // Validate the URL
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  // Only allow our known image hosts
  const host = parsed.hostname
  if (!ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h))) {
    return new NextResponse('Forbidden host', { status: 403 })
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: { 'User-Agent': 'BrandSyndicate/2.0 (image-proxy)' },
      signal: AbortSignal.timeout(15_000),
    })

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, {
        status: 502,
      })
    }

    const contentType = upstream.headers.get('Content-Type') ?? 'image/png'
    const buffer      = await upstream.arrayBuffer()

    // Sanitize filename — strip path separators and quotes
    const safeFilename = filename.replace(/[/\\'"]/g, '_').replace(/\s+/g, '-')

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length':      String(buffer.byteLength),
        // Don't cache — every download should be fresh
        'Cache-Control':       'no-store',
      },
    })
  } catch (err) {
    console.error('[download-image] Proxy error:', err)
    return new NextResponse('Failed to fetch image', { status: 502 })
  }
}
