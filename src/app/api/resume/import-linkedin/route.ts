import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { parseLinkedInText } from '@/lib/ai/resume'

// Max file size: 10 MB
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data with a "file" field' },
        { status: 400 },
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 })
    }
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 415 })
    }

    // ── Extract text from PDF ────────────────────────────────────────────────
    // We use pdf-parse which works in Node.js edge-compatible runtime
    let rawText = ''
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Dynamic import avoids Next.js bundling issues with pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
      const parsed = await pdfParse(buffer)
      rawText = parsed.text
    } catch {
      // Fallback: decode as UTF-8 and extract any visible text
      // This handles some PDF edge cases
      const text = await file.text()
      rawText = text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim()
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract readable text from PDF. Try a text-based LinkedIn export.' },
        { status: 422 },
      )
    }

    // ── Parse with AI ────────────────────────────────────────────────────────
    const resumeData = await parseLinkedInText(rawText)

    return NextResponse.json({ resumeData, rawTextLength: rawText.length })
  } catch (error) {
    console.error('LinkedIn import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 },
    )
  }
}


