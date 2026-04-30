// src/app/api/domain/connect/route.ts

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

// POST — register / update a custom domain
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { domain } = body ?? {}

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 })
    }

    const normalised = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')

    if (!isValidDomain(normalised)) {
      return NextResponse.json({ error: 'Invalid domain format. Enter just the hostname, e.g. portfolio.yourname.com' }, { status: 400 })
    }

    // Check if domain is already claimed by ANOTHER user
    const existingOther = await db.domain.findFirst({
      where: { domain: normalised, NOT: { userId: session.user.id } },
    })
    if (existingOther) {
      return NextResponse.json({ error: 'Domain already registered to another account' }, { status: 409 })
    }

    const token = generateToken()
    const cnameTarget = process.env.CNAME_TARGET ?? 'cname.brandsyndicate.in'

    // Safely upsert: find by userId (unique), then create or update
    // This avoids the dual-unique collision that causes 500 errors
    const existing = await db.domain.findUnique({ where: { userId: session.user.id } })

    let record
    if (existing) {
      record = await db.domain.update({
        where: { userId: session.user.id },
        data: {
          domain: normalised,
          verified: false,
          verificationToken: token,
          cnameTarget,
        },
      })
    } else {
      record = await db.domain.create({
        data: {
          userId: session.user.id,
          domain: normalised,
          verified: false,
          verificationToken: token,
          cnameTarget,
        },
      })
    }

    return NextResponse.json({
      success: true,
      domain: record.domain,
      verified: record.verified,
      cnameTarget: record.cnameTarget,
      verificationToken: record.verificationToken,
    })
  } catch (err) {
    console.error('[domain/connect POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — disconnect domain
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.domain.deleteMany({ where: { userId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[domain/connect DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
