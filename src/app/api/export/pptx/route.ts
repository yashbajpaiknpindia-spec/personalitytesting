import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { generatePPTX } from '@/lib/export/pptx'
import { uploadBuffer, signedUrl } from '@/lib/storage/cloudinary'
import { sendExportReadyEmail } from '@/lib/email'
import type { BrandOutput } from '@/lib/ai/generate'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { generationId } = await req.json()

    const generation = await db.generation.findFirst({
      where: { id: generationId, userId: session.user.id },
      include: { user: true },
    })
    if (!generation) return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    if (!generation.outputData) return NextResponse.json({ error: 'No output data' }, { status: 400 })

    const output = generation.outputData as unknown as BrandOutput
    const user = generation.user

    const buffer = await generatePPTX(output, user.name || 'Professional', user.accentColor || '#C9A84C')

    const publicId = `brand-syndicate/${session.user.id}/${generationId}-deck-${Date.now()}.pptx`
    const { publicId: cloudId } = await uploadBuffer(buffer, publicId, 'raw')
    const url = signedUrl(cloudId)
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000)

    await db.export.create({
      data: {
        userId: session.user.id,
        generationId,
        format: 'PPTX',
        cloudinaryId: cloudId,
        url,
        expiresAt,
      },
    })

    if (user.email) {
      sendExportReadyEmail(user.email, user.name || 'there', url).catch(() => {})
    }

    return NextResponse.json({ url, expiresAt })
  } catch (error) {
    console.error('PPTX export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
