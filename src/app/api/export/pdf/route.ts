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

    const generation = await db.generation.findFirst({
      where: { id: generationId, userId: session.user.id },
      include: { user: true },
    })
    if (!generation) return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    if (!generation.outputData) return NextResponse.json({ error: 'No output data' }, { status: 400 })

    const output = generation.outputData as unknown as BrandOutput
    const user = generation.user
    const isWatermarked = session.user.plan === 'FREE'

    const pdfBuffer = await generatePDF(
      output,
      format as 'portfolio' | 'resume' | 'card',
      user.name || 'Professional',
      user.accentColor || '#C9A84C',
      isWatermarked
    )

    // Upload to Cloudinary
    const publicId = `brand-syndicate/${session.user.id}/${generationId}-${format}-${Date.now()}`
    const { publicId: cloudId } = await uploadBuffer(pdfBuffer, publicId, 'raw')
    const url = signedUrl(cloudId)
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000)

    // Save export record
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

    // Track resume download analytics event (fire and forget)
    void trackEvent({ ownerId: session.user.id, type: 'RESUME_DOWNLOAD', request: req })

    // Email notification (fire and forget)
    if (user.email) {
      sendExportReadyEmail(user.email, user.name || 'there', url).catch(() => {})
    }

    return NextResponse.json({ url, expiresAt })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
