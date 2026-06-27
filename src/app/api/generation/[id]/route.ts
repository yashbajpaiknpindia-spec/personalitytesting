export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params

    // Verify ownership — user can only delete their own generations
    const gen = await db.generation.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    })

    if (!gen) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.generation.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[generation/delete]', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
