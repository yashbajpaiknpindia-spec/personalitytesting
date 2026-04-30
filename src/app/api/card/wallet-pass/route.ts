// src/app/api/card/wallet-pass/route.ts
// GET — returns a lightweight wallet-pass JSON stub describing the user's digital card.
//
// Full Apple Wallet .pkpass signing requires a paid Apple Developer certificate.
// This endpoint returns the pass payload so the front-end can display fields or
// hand off to a signing service (e.g. PassKit API) when ready.
// The Google Wallet deep-link is also included in the response.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true, jobTitle: true, company: true,
        email: true, website: true, linkedin: true,
        accentColor: true, username: true,
        socialLinks: true,
        portfolio: { select: { slug: true, isPublished: true } },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
    const cardUrl = user.portfolio?.isPublished
      ? `${baseUrl}/p/${user.portfolio.slug}`
      : user.username
        ? `${baseUrl}/u/${user.username}`
        : baseUrl

    // Apple Wallet pass payload (unsigned — ready for PassKit signing)
    const applePassPayload = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.in.brandsyndicate.card',
      serialNumber: session.user.id,
      teamIdentifier: 'TEAM_ID_PLACEHOLDER',
      organizationName: 'Brand Syndicate',
      description: `${user.name ?? 'Digital'} Business Card`,
      backgroundColor: 'rgb(9,9,10)',
      foregroundColor: 'rgb(240,234,224)',
      labelColor: user.accentColor ?? '#C9A84C',
      generic: {
        primaryFields: [
          { key: 'name', label: 'NAME', value: user.name ?? '' },
        ],
        secondaryFields: [
          { key: 'title',   label: 'TITLE',   value: user.jobTitle ?? '' },
          { key: 'company', label: 'COMPANY', value: user.company  ?? '' },
        ],
        auxiliaryFields: [
          { key: 'email',   label: 'EMAIL',   value: user.email ?? '' },
          { key: 'website', label: 'WEB',     value: cardUrl       },
        ],
        backFields: [
          { key: 'linkedin',  label: 'LinkedIn',  value: user.linkedin  ?? user.socialLinks?.linkedin  ?? '' },
          { key: 'instagram', label: 'Instagram', value: user.socialLinks?.instagram ?? '' },
          { key: 'twitter',   label: 'Twitter',   value: user.socialLinks?.twitter   ?? '' },
        ],
      },
      barcode: {
        message: cardUrl,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
      },
    }

    // Google Wallet — generic pass JWT link (stub; swap with real JWT when integrating)
    const googleWalletUrl = `https://pay.google.com/gp/v/save/GOOGLE_JWT_PLACEHOLDER`

    return NextResponse.json({
      applePassPayload,
      googleWalletUrl,
      cardUrl,
      note: 'Apple pass requires server-side signing with a valid Apple Developer certificate. Use applePassPayload with a PassKit signing service.',
    })
  } catch (err) {
    console.error('[card/wallet-pass]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
