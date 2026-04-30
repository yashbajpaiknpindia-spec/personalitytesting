import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  const isAdmin = session.user.email === ADMIN_EMAIL || (session.user as unknown as Record<string, unknown>).role === 'ADMIN'
  return isAdmin ? session.user : null
}

// GET /api/admin/notifications — list all sent notifications
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await db.$queryRaw`
    SELECT n.*, 
      (SELECT COUNT(*) FROM notification_reads nr WHERE nr."notificationId" = n.id) as "readCount",
      (SELECT COUNT(*) FROM users) as "totalUsers"
    FROM notifications n
    ORDER BY n."createdAt" DESC
    LIMIT 100
  ` as Record<string, unknown>[]

  return NextResponse.json({ notifications })
}

// POST /api/admin/notifications — send a notification
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, body: msgBody, imageUrl, targetUserId } = body

  if (!title?.trim() || !msgBody?.trim()) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
  }

  const notification = await db.$executeRaw`
    INSERT INTO notifications (id, title, body, "imageUrl", type, "targetUserId", "sentBy", "createdAt")
    VALUES (
      gen_random_uuid()::text,
      ${title.trim()},
      ${msgBody.trim()},
      ${imageUrl || null},
      ${targetUserId ? 'targeted' : 'broadcast'},
      ${targetUserId || null},
      ${admin.email || 'admin'},
      NOW()
    )
  `

  return NextResponse.json({ success: true, notification })
}

// DELETE /api/admin/notifications?id=xxx
export async function DELETE(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await db.$executeRaw`DELETE FROM notifications WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
