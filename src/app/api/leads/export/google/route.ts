// src/app/api/leads/export/google/route.ts
// POST — export leads to a Google Sheet.
//
// Requires: GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY env vars.
// The service account must have Editor access to the target spreadsheet, OR
// the endpoint creates a new spreadsheet and returns its URL.
//
// Body: { spreadsheetId?: string }
//   If spreadsheetId is provided, data is appended to the first sheet.
//   If omitted, a new spreadsheet is created via the Sheets API.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

interface SheetsCredentials {
  serviceAccountEmail: string
  privateKey: string
}

function getCredentials(): SheetsCredentials | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key   = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!email || !key) return null
  return { serviceAccountEmail: email, privateKey: key.replace(/\\n/g, '\n') }
}

async function getAccessToken(creds: SheetsCredentials): Promise<string> {
  // Build a minimal JWT for Google's OAuth2 token endpoint
  const now = Math.floor(Date.now() / 1000)
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: creds.serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url')

  // Sign with the private key using Web Crypto
  const pemBody = creds.privateKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const keyData = Uint8Array.from(Buffer.from(pemBody, 'base64'))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )
  const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, Buffer.from(`${header}.${payload}`))
  const sig = Buffer.from(sigBuf).toString('base64url')
  const jwt = `${header}.${payload}.${sig}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error('Failed to obtain Google access token')
  return tokenData.access_token
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const creds = getCredentials()
    if (!creds) {
      return NextResponse.json({
        error: 'Google Sheets integration not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY in your environment.',
      }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    const { spreadsheetId: providedId } = body

    const contacts = await db.contact.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    const headerRow  = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Date']
    const dataRows   = contacts.map((c: typeof contacts[0]) => [
      c.name,
      c.email,
      c.phone    ?? '',
      c.company  ?? '',
      c.sourceSlug ?? '',
      c.createdAt.toISOString().split('T')[0],
    ])
    const values = [headerRow, ...dataRows]

    const token = await getAccessToken(creds)

    let sheetId = providedId
    let sheetUrl: string

    if (!sheetId) {
      // Create a new spreadsheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: { title: `Brand Syndicate Leads – ${new Date().toLocaleDateString()}` } }),
      })
      const created = await createRes.json()
      sheetId  = created.spreadsheetId
      sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`
    } else {
      sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`
    }

    // Append data
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:F${values.length}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ range: 'A1', majorDimension: 'ROWS', values }),
      }
    )

    return NextResponse.json({ success: true, spreadsheetUrl: sheetUrl, rowsExported: contacts.length })
  } catch (err) {
    console.error('[leads/export/google]', err)
    return NextResponse.json({ error: 'Google Sheets export failed' }, { status: 500 })
  }
}
