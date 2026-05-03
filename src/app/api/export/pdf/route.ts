import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { generatePDF } from '@/lib/export/pdf'
import { uploadBuffer, signedUrl } from '@/lib/storage/cloudinary'
import { sendExportReadyEmail } from '@/lib/email'
import type { BrandOutput } from '@/lib/ai/generate'
import { trackEvent } from '@/lib/analytics/track'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { generationId, format = 'portfolio' } = await req.json()

    if (!generationId) return NextResponse.json({ error: 'generationId required' }, { status: 400 })

    const generation = await db.generation.findFirst({
      where: { id: generationId, userId: session.user.id },
      include: { user: true },
    })
    if (!generation) return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    if (!generation.outputData) return NextResponse.json({ error: 'No output data' }, { status: 400 })

    const output = generation.outputData as unknown as BrandOutput
    const user = generation.user
    const isWatermarked = session.user.plan === 'FREE'

    // Generate PDF — throws a real error if Chromium unavailable (no more silent empty buffer)
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await generatePDF(
        output,
        format as 'portfolio' | 'resume' | 'card',
        user.name || 'Professional',
        user.accentColor || '#C9A84C',
        isWatermarked
      )
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr)
      return NextResponse.json(
        { error: 'PDF generation failed. Please try again.' },
        { status: 500 }
      )
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json({ error: 'PDF generation produced an empty file.' }, { status: 500 })
    }

    // Try Cloudinary upload — if it fails, stream the PDF directly to the client
    try {
      const publicId = `brand-syndicate/${session.user.id}/${generationId}-${format}-${Date.now()}`
      const { publicId: cloudId } = await uploadBuffer(pdfBuffer, publicId, 'raw')
      const url = signedUrl(cloudId)
      const expiresAt = new Date(Date.now() + 72 * 3600 * 1000)

      await db.export.create({
        data: {
          userId: session.user.id,
          generationId,
          format: 'PDF',
          cloudinaryId: cloudId,
          url,
          expiresAt,
        },
      })

      void trackEvent({ ownerId: session.user.id, type: 'RESUME_DOWNLOAD', request: req })

      if (user.email) {
        sendExportReadyEmail(user.email, user.name || 'there', url).catch(() => {})
      }

      return NextResponse.json({ url, expiresAt })
    } catch (cloudErr) {
      // Cloudinary unavailable — stream the PDF directly as a download
      console.warn('Cloudinary upload failed, streaming PDF directly:', cloudErr)

      const safeName = (output.cardName || user.name || 'portfolio')
        .replace(/[^a-z0-9]/gi, '-').toLowerCase()
      const filename = `${safeName}-${format}.pdf`

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
