// src/app/api/domain/verify/route.ts
// POST — attempt to verify that the user's domain has the correct DNS records.
//        Uses a DNS-over-HTTPS lookup (Cloudflare DoH) so no native DNS lib needed.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

async function lookupTXT(hostname: string): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=TXT`
  const res = await fetch(url, { headers: { Accept: 'application/dns-json' } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.Answer ?? [])
    .filter((r: { type: number }) => r.type === 16)
    .map((r: { data: string }) => r.data.replace(/"/g, ''))
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const record = await db.domain.findUnique({ where: { userId: session.user.id } })
    if (!record) return NextResponse.json({ error: 'No domain connected' }, { status: 404 })

    if (record.verified) {
      return NextResponse.json({ verified: true, domain: record.domain, message: 'Already verified' })
    }

    // Look up the TXT record: _brandsyndicate.<domain>
    const txtHostname = `_brandsyndicate.${record.domain}`
    const txtValues = await lookupTXT(txtHostname)
    const tokenFound = txtValues.some(v => v.includes(record.verificationToken))

    if (tokenFound) {
      await db.domain.update({
        where: { userId: session.user.id },
        data: { verified: true },
      })
      return NextResponse.json({ verified: true, domain: record.domain })
    }

    return NextResponse.json({
      verified: false,
      domain: record.domain,
      message: 'TXT record not found or DNS not propagated yet. Try again in a few minutes.',
      expected: { type: 'TXT', name: txtHostname, value: record.verificationToken },
    })
  } catch (err) {
    console.error('[domain/verify]', err)
    return NextResponse.json({ error: 'Verification check failed' }, { status: 500 })
  }
}
