// src/app/api/card/qr/route.ts
// GET  — returns a high-res QR code PNG for the authenticated user's public card URL.
// Query param ?url=<custom> overrides the default portfolio URL.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { generateQR } from '@/lib/export/qr'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const customUrl = searchParams.get('url')

    let targetUrl = customUrl

    if (!targetUrl) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

      // Prefer published portfolio slug, fall back to username route
      const portfolio = await db.portfolio.findUnique({
        where: { userId: session.user.id },
        select: { slug: true, isPublished: true },
      })

      if (portfolio?.isPublished) {
        targetUrl = `${baseUrl}/p/${portfolio.slug}`
      } else {
        const user = await db.user.findUnique({
          where: { id: session.user.id },
          select: { username: true },
        })
        targetUrl = user?.username
          ? `${baseUrl}/u/${user.username}`
          : `${baseUrl}/generate`
      }
    }

    const buffer = await generateQR(targetUrl!)
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="qr-code.png"',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (err) {
    console.error('[card/qr]', err)
    return NextResponse.json({ error: 'QR generation failed' }, { status: 500 })
  }
}
