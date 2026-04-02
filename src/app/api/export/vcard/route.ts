import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { buildVCard } from '@/lib/export/vcard'
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

    const vcf = buildVCard(output, user.email, user.website || undefined)

    await db.export.create({
      data: {
        userId: session.user.id,
        generationId,
        format: 'VCARD',
      },
    })

    return new NextResponse(vcf, {
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="${(output.cardName || 'contact').replace(/\s+/g, '-')}.vcf"`,
      },
    })
  } catch (error) {
    console.error('vCard export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
