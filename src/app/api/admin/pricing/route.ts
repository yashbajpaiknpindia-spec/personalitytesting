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

// GET /api/admin/pricing — get all pricing plans
export async function GET() {
  const plans = await db.$queryRaw`
    SELECT * FROM pricing_plans ORDER BY "sortOrder" ASC
  ` as Record<string, unknown>[]

  return NextResponse.json({ plans })
}

// POST /api/admin/pricing — update a plan
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { planId, name, price, period, features, isVisible, sortOrder, highlight } = body

  if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 })

  const featuresJson = typeof features === 'string' ? features : JSON.stringify(features)

  await db.$executeRaw`
    INSERT INTO pricing_plans (id, "planId", name, price, period, features, "isVisible", "sortOrder", highlight, "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      ${planId},
      ${name},
      ${price},
      ${period || '/month'},
      ${featuresJson},
      ${isVisible !== false},
      ${sortOrder || 0},
      ${highlight || false},
      NOW()
    )
    ON CONFLICT ("planId") DO UPDATE SET
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      period = EXCLUDED.period,
      features = EXCLUDED.features,
      "isVisible" = EXCLUDED."isVisible",
      "sortOrder" = EXCLUDED."sortOrder",
      highlight = EXCLUDED.highlight,
      "updatedAt" = NOW()
  `

  return NextResponse.json({ success: true })
}
