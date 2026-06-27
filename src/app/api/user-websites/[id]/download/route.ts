// src/app/api/user-websites/[id]/download/route.ts
// GET /api/user-websites/[id]/download
// Returns a zip archive containing: index.html + assets manifest.
// Works for both the website owner and admin.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// Minimal in-process ZIP builder, no extra npm package required.
// Produces a valid ZIP with a single STORED (no compression) entry.
function buildZip(entries: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const enc = new TextEncoder()
  const localHeaders: Uint8Array[] = []
  const centralHeaders: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length

    // Local file header
    const lh = new DataView(new ArrayBuffer(30 + nameBytes.length))
    lh.setUint32(0, 0x04034b50, true) // signature
    lh.setUint16(4, 20, true)          // version needed
    lh.setUint16(6, 0, true)           // flags
    lh.setUint16(8, 0, true)           // compression: STORED
    lh.setUint16(10, 0, true)          // mod time
    lh.setUint16(12, 0, true)          // mod date
    lh.setUint32(14, crc, true)        // crc-32
    lh.setUint32(18, size, true)       // compressed size
    lh.setUint32(22, size, true)       // uncompressed size
    lh.setUint16(26, nameBytes.length, true)
    lh.setUint16(28, 0, true)          // extra field length
    const lhBytes = new Uint8Array(lh.buffer)
    nameBytes.forEach((b, i) => (lhBytes[30 + i] = b))

    localHeaders.push(lhBytes)
    localHeaders.push(entry.data)

    // Central directory header
    const ch = new DataView(new ArrayBuffer(46 + nameBytes.length))
    ch.setUint32(0, 0x02014b50, true)  // signature
    ch.setUint16(4, 20, true)          // version made by
    ch.setUint16(6, 20, true)          // version needed
    ch.setUint16(8, 0, true)           // flags
    ch.setUint16(10, 0, true)          // compression
    ch.setUint16(12, 0, true)
    ch.setUint16(14, 0, true)
    ch.setUint32(16, crc, true)
    ch.setUint32(20, size, true)
    ch.setUint32(24, size, true)
    ch.setUint16(28, nameBytes.length, true)
    ch.setUint16(30, 0, true)
    ch.setUint16(32, 0, true)
    ch.setUint16(34, 0, true)
    ch.setUint16(36, 0, true)
    ch.setUint32(38, 0, true)          // external attrs
    ch.setUint32(42, offset, true)     // local header offset
    const chBytes = new Uint8Array(ch.buffer)
    nameBytes.forEach((b, i) => (chBytes[46 + i] = b))

    centralHeaders.push(chBytes)
    offset += lhBytes.length + size
  }

  const cdStart = offset
  const cdSize = centralHeaders.reduce((s, c) => s + c.length, 0)

  // End of central directory record
  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)
  eocd.setUint16(4, 0, true)
  eocd.setUint16(6, 0, true)
  eocd.setUint16(8, entries.length, true)
  eocd.setUint16(10, entries.length, true)
  eocd.setUint32(12, cdSize, true)
  eocd.setUint32(16, cdStart, true)
  eocd.setUint16(20, 0, true)

  const parts = [...localHeaders, ...centralHeaders, new Uint8Array(eocd.buffer)]
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of parts) { out.set(p, pos); pos += p.length }
  return out
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.email === 'yashbajpaiknpindia@gmail.com'

  const website = isAdmin
    ? await db.userWebsite.findUnique({ where: { id: params.id } })
    : await db.userWebsite.findFirst({ where: { id: params.id, userId: session.user.id } })

  if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const enc = new TextEncoder()
  const htmlBytes = enc.encode(website.htmlContent)

  // README.txt with basic instructions
  const readme = `Brand Syndicate, Website Export
================================
Site name : ${website.name}
Exported  : ${new Date().toISOString()}
Slug      : ${website.slug ?? '(not published)'}

To use:
  1. Open index.html in a browser, or
  2. Upload to any static hosting (Netlify, Vercel, GitHub Pages, etc.)

Built with Brand Syndicate, https://brandsyndicate.in
`
  const readmeBytes = enc.encode(readme)

  const zip = buildZip([
    { name: 'index.html', data: htmlBytes },
    { name: 'README.txt', data: readmeBytes },
  ])

  const safeName = website.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  return new NextResponse(zip.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName}_website.zip"`,
      'Content-Length': String(zip.length),
    },
  })
}
