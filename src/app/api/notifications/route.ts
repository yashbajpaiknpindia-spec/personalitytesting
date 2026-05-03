import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

// GET /api/notifications — get notifications for current user
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ notifications: [], unreadCount: 0 })

  const userId = session.user.id

  // Get broadcast + targeted notifications for this user
  const notifications = await db.$queryRaw`
    SELECT 
      n.*,
      CASE WHEN nr.id IS NOT NULL THEN true ELSE false END as "isRead"
    FROM notifications n
    LEFT JOIN notification_reads nr ON nr."notificationId" = n.id AND nr."userId" = ${userId}
    WHERE n.type = 'broadcast' OR n."targetUserId" = ${userId}
    ORDER BY n."createdAt" DESC
    LIMIT 50
  ` as Record<string, unknown>[]

  const unreadCount = notifications.filter(n => !n.isRead).length

  return NextResponse.json({ notifications, unreadCount })
}

// POST /api/notifications/read — mark notifications as read
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const body = await req.json()
  const { notificationIds } = body

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return NextResponse.json({ error: 'notificationIds required' }, { status: 400 })
  }

  for (const nid of notificationIds) {
    await db.$executeRaw`
      INSERT INTO notification_reads (id, "notificationId", "userId", "readAt")
      VALUES (gen_random_uuid()::text, ${nid}, ${userId}, NOW())
      ON CONFLICT ("notificationId", "userId") DO NOTHING
    `
  }

  return NextResponse.json({ success: true })
}
