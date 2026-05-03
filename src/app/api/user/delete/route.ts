import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Delete all user data (Prisma cascades handle relations)
    await db.user.delete({ where: { id: session.user.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
