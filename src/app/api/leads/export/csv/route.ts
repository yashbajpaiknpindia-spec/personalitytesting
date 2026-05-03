// src/app/api/leads/export/csv/route.ts
// GET — stream all leads for the authenticated user as a CSV download.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

function escapeCSV(val: string | null | undefined): string {
  if (val == null) return ''
  const str = String(val)
  // Wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const contacts = await db.contact.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Date']
    const rows = contacts.map((c: typeof contacts[0]) => [
      escapeCSV(c.name),
      escapeCSV(c.email),
      escapeCSV(c.phone),
      escapeCSV(c.company),
      escapeCSV(c.sourceSlug),
      escapeCSV(c.createdAt.toISOString().split('T')[0]),
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const filename = `leads-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[leads/export/csv]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
