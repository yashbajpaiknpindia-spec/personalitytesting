import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ url: null }, { status: 400 })

  const key = process.env.PEXELS_API_KEY
  if (!key) {
    console.error('[/api/image] PEXELS_API_KEY is not set in environment')
    // Return 200 with null so the client .ok check doesn't silently drop the response
    return NextResponse.json({ url: null })
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: key } }
    )
    if (!res.ok) {
      console.error('[/api/image] Pexels API error', res.status)
      return NextResponse.json({ url: null })
    }
    const data = await res.json() as {
      photos?: Array<{ src: { large: string; medium: string } }>
    }
    // Use 'large' for better quality in presentations (was incorrectly 'medium')
    const url = data.photos?.[0]?.src?.large ?? data.photos?.[0]?.src?.medium ?? null
    return NextResponse.json({ url }, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (err) {
    console.error('[/api/image] fetch error', err)
    return NextResponse.json({ url: null })
  }
}
