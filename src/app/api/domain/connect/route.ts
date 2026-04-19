// src/app/api/domain/connect/route.ts
// POST — register a custom domain for the user's portfolio.
//        Returns CNAME instructions and a verification token.
// DELETE — remove the connected domain.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

function generateToken(): string {
  return `bsv_${randomBytes(16).toString('hex')}`
}

function isValidDomain(domain: string): boolean {
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain)
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { domain } = await req.json()
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 })
    }

    const normalised = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')

    if (!isValidDomain(normalised)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    // Check if domain is already claimed by another user
    const existingOther = await db.domain.findFirst({
      where: { domain: normalised, NOT: { userId: session.user.id } },
    })
    if (existingOther) {
      return NextResponse.json({ error: 'Domain already registered' }, { status: 409 })
    }

    const token = generateToken()
    const cnameTarget = 'cname.brandsyndicate.co'

    const record = await db.domain.upsert({
      where:  { userId: session.user.id },
      create: {
        userId: session.user.id,
        domain: normalised,
        verified: false,
        verificationToken: token,
        cnameTarget,
      },
      update: {
        domain: normalised,
        verified: false,
        verificationToken: token,
        cnameTarget,
      },
    })

    return NextResponse.json({
      success: true,
      domain: record.domain,
      verified: record.verified,
      instructions: {
        step1: `Log in to your DNS provider (GoDaddy, Cloudflare, Namecheap, etc.)`,
        step2: `Add a CNAME record:`,
        cname: {
          type: 'CNAME',
          name: normalised.startsWith('www.') ? 'www' : '@',
          value: cnameTarget,
          ttl: 3600,
        },
        step3: `Add a TXT record for verification:`,
        txt: {
          type: 'TXT',
          name: `_brandsyndicate.${normalised}`,
          value: token,
          ttl: 3600,
        },
        step4: `DNS changes may take up to 48 hours to propagate.`,
        step5: `Once propagated, call POST /api/domain/verify to confirm.`,
      },
    })
  } catch (err) {
    console.error('[domain/connect]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.domain.deleteMany({ where: { userId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[domain/connect DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
