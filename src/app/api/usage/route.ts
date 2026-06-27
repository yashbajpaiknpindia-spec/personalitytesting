// src/app/api/usage/route.ts
// Returns the current user's generation usage + limit for display in the UI.
// Lightweight — called on every load of the generate page.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getUserUsage } from '@/lib/rateLimit'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id as string | undefined

  if (!userId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  try {
    const usage = await getUserUsage(userId)
    return NextResponse.json(usage)
  } catch (err) {
    console.error('[/api/usage] error:', err)
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
