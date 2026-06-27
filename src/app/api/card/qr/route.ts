import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { generateQR } from '@/lib/export/qr'

export const dynamic = 'force-dynamic'

// GET /api/card/qr?url=<optional> — generate QR PNG for user's portfolio URL
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const customUrl = req.nextUrl.searchParams.get('url')
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
  const username = (session.user as { username?: string }).username

  const targetUrl = customUrl
    ? decodeURIComponent(customUrl)
    : username
      ? `${APP_URL}/u/${username}`
      : `${APP_URL}/generate`

  try {
    const png = await generateQR(targetUrl)

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[GET /api/card/qr]', e)
    return NextResponse.json({ error: 'QR generation failed' }, { status: 500 })
  }
}
