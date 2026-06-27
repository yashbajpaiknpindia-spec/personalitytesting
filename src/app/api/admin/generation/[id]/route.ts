import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = params?.id
    if (!id) return NextResponse.json({ error: 'Generation id is required' }, { status: 400 })

    const existing = await db.generation.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'Generation not found' }, { status: 404 })

    await db.generation.delete({ where: { id } })
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('[admin/generation/delete]', error)
    return NextResponse.json({ error: 'Failed to delete generation' }, { status: 500 })
  }
}
