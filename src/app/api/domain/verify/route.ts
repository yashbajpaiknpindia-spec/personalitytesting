// src/app/api/domain/verify/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

async function lookupTXT(hostname: string): Promise<string[]> {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=TXT`
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.Answer ?? [])
      .filter((r: { type: number }) => r.type === 16)
      .map((r: { data: string }) => r.data.replace(/"/g, ''))
  } catch {
    return []
  }
}

// GET — fetch current domain record for the logged-in user (used on panel mount)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const record = await db.domain.findUnique({ where: { userId: session.user.id } })
    if (!record) {
      return NextResponse.json({ domain: null })
    }

    return NextResponse.json({
      domain: record.domain,
      verified: record.verified,
      cnameTarget: record.cnameTarget,
      verificationToken: record.verificationToken,
    })
  } catch (err) {
    console.error('[domain/verify GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — trigger DNS verification check
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const record = await db.domain.findUnique({ where: { userId: session.user.id } })
    if (!record) {
      return NextResponse.json({ error: 'No domain connected' }, { status: 404 })
    }

    if (record.verified) {
      return NextResponse.json({
        verified: true,
        domain: record.domain,
        cnameTarget: record.cnameTarget,
        verificationToken: record.verificationToken,
      })
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
      return NextResponse.json({
        verified: true,
        domain: record.domain,
        cnameTarget: record.cnameTarget,
        verificationToken: record.verificationToken,
      })
    }

    return NextResponse.json({
      verified: false,
      domain: record.domain,
      cnameTarget: record.cnameTarget,
      verificationToken: record.verificationToken,
      message: 'TXT record not found yet — DNS propagation can take up to 48 hours.',
    })
  } catch (err) {
    console.error('[domain/verify POST]', err)
    return NextResponse.json({ error: 'Verification check failed' }, { status: 500 })
  }
}
