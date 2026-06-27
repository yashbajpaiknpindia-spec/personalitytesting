import { NextRequest } from 'next/server'

function esc(v: string): string {
  return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function colour(v: string | null, fallback: string): string {
  const s = String(v || '').trim()
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s) ? s : fallback
}

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const label = esc(sp.get('label') || 'Website Template').slice(0, 90)
  const category = esc(sp.get('category') || 'Template').slice(0, 32)
  const color = colour(sp.get('color'), '#C9A84C')
  const bg = colour(sp.get('bg'), '#0A0A0E')
  const id = esc(sp.get('id') || '').slice(0, 72)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" width="1200" height="760">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="0.58" stop-color="#0B0906"/><stop offset="1" stop-color="${color}" stop-opacity="0.55"/></linearGradient>
    <radialGradient id="r" cx="24%" cy="22%" r="72%"><stop offset="0" stop-color="${color}" stop-opacity="0.34"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>
    <pattern id="p" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" fill="none" stroke="#ffffff" stroke-opacity="0.055"/></pattern>
  </defs>
  <rect width="1200" height="760" fill="url(#g)"/>
  <rect width="1200" height="760" fill="url(#r)"/>
  <rect width="1200" height="760" fill="url(#p)"/>
  <rect x="64" y="64" width="1072" height="632" rx="34" fill="#ffffff" fill-opacity="0.045" stroke="#ffffff" stroke-opacity="0.16"/>
  <text x="88" y="118" fill="${color}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="24" letter-spacing="8" font-weight="700">${category.toUpperCase()}</text>
  <text x="88" y="390" fill="#F8F1E6" font-family="Georgia, 'Times New Roman', serif" font-size="78" font-weight="700" letter-spacing="-3">${label}</text>
  <text x="92" y="452" fill="#F8F1E6" fill-opacity="0.62" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="24" letter-spacing="5">MOBILE READY • IMAGE SAFE • CONVERSION BUILT</text>
  <text x="92" y="626" fill="${color}" fill-opacity="0.78" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="20" letter-spacing="5">${id}</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
