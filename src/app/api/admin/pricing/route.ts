import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session.user
}

// Default public/service plans, seeded/migrated when the old 3-plan set is still present
const DEFAULT_PLANS = [
  {
    planId: 'FREE_STARTER',
    name: 'Free Starter',
    price: '₹0',
    period: '5 generations',
    features: JSON.stringify([
      '5 free generations',
      'Generate logo, strategy, website and images',
      'Preview and download basic outputs',
      'Access public templates',
      'Saved generation history',
      'Upgrade when more generations are needed',
    ]),
    isVisible: true,
    highlight: false,
    sortOrder: 0,
  },
  {
    planId: 'AI_CREATOR_1000',
    name: 'Creator',
    price: '₹1,000',
    period: '50 generations',
    features: JSON.stringify([
      '50 edits or generations',
      'Repeat and refine past generations',
      'Logo, website, strategy and image generation',
      'Lead capture/contact form integration',
      'Basic SEO, speed and mobile optimisation',
      'Best for testing multiple brand ideas',
    ]),
    isVisible: true,
    highlight: true,
    sortOrder: 1,
  },
  {
    planId: 'BUSINESS_PRO_5000',
    name: 'Business Pro',
    price: '₹5,000',
    period: '100 generations',
    features: JSON.stringify([
      '100 edits or generations',
      'Custom domain support',
      'Priority support',
      'Lead capture/contact form integration',
      'SEO, speed and mobile optimisation',
      'Better for real business launch work',
    ]),
    isVisible: true,
    highlight: false,
    sortOrder: 2,
  },
  {
    planId: 'UNLIMITED_GROWTH_10000',
    name: 'Growth Suite',
    price: '₹10,000',
    period: 'fair-use unlimited',
    features: JSON.stringify([
      'Unlimited generations under fair-use policy',
      'Unlimited means manual business use while plan is active; automated abuse/reselling excluded',
      'Priority support',
      'Theme modification and style control',
      'Custom domain and lead capture support',
      'Best for serious brands and agencies',
    ]),
    isVisible: true,
    highlight: false,
    sortOrder: 3,
  },
]

const NEW_DEFAULT_IDS = DEFAULT_PLANS.map(p => p.planId)
const OLD_DEFAULT_IDS = ['STARTER_DIGITAL_LAUNCH', 'BUSINESS_WEBSITE', 'BRAND_LAUNCH_KIT', 'APP_WEBSITE_PACKAGE', 'GROWTH_RETAINER', 'STARTUP_LAUNCH', 'GROWTH_KIT', 'FREE', 'PRO', 'TEAM']

async function seedCurrentPricingPlans(plans: Record<string, unknown>[]) {
  const existingIds = new Set(plans.map(p => String(p.planId || '')))
  const hasAllNewPlans = NEW_DEFAULT_IDS.every(id => existingIds.has(id))
  const hasLegacyPlans = OLD_DEFAULT_IDS.some(id => existingIds.has(id))

  // Replace old plan sets and self-heal incomplete new sets. If the current
  // 4-plan set already exists, only migrate the old public display names once.
  if (plans.length > 0 && hasAllNewPlans && !hasLegacyPlans) {
    await db.$executeRaw`UPDATE pricing_plans SET name = 'Creator', "updatedAt" = NOW() WHERE "planId" = 'AI_CREATOR_1000' AND name = 'AI Creator'`
    await db.$executeRaw`UPDATE pricing_plans SET name = 'Growth Suite', "updatedAt" = NOW() WHERE "planId" = 'UNLIMITED_GROWTH_10000' AND name = 'Unlimited Growth'`
    return await db.$queryRaw`SELECT * FROM pricing_plans ORDER BY "sortOrder" ASC` as Record<string, unknown>[]
  }

  for (const oldId of OLD_DEFAULT_IDS) {
    await db.$executeRaw`DELETE FROM pricing_plans WHERE "planId" = ${oldId}`
  }

  for (const plan of DEFAULT_PLANS) {
    await db.$executeRaw`
      INSERT INTO pricing_plans (id, "planId", name, price, period, features, "isVisible", "sortOrder", highlight, "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${plan.planId},
        ${plan.name},
        ${plan.price},
        ${plan.period},
        ${plan.features},
        ${plan.isVisible},
        ${plan.sortOrder},
        ${plan.highlight},
        NOW()
      )
      ON CONFLICT ("planId") DO UPDATE SET
        name       = EXCLUDED.name,
        price      = EXCLUDED.price,
        period     = EXCLUDED.period,
        features   = EXCLUDED.features,
        "isVisible" = EXCLUDED."isVisible",
        "sortOrder" = EXCLUDED."sortOrder",
        highlight  = EXCLUDED.highlight,
        "updatedAt" = NOW()
    `
  }

  return await db.$queryRaw`
    SELECT * FROM pricing_plans ORDER BY "sortOrder" ASC
  ` as Record<string, unknown>[]
}

// GET /api/admin/pricing, get all pricing plans
export async function GET() {
  let plans = await db.$queryRaw`
    SELECT * FROM pricing_plans ORDER BY "sortOrder" ASC
  ` as Record<string, unknown>[]

  plans = await seedCurrentPricingPlans(plans)

  return NextResponse.json({ plans })
}

// POST /api/admin/pricing, update a plan
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
      ${period || ''},
      ${featuresJson},
      ${isVisible !== false},
      ${sortOrder || 0},
      ${highlight || false},
      NOW()
    )
    ON CONFLICT ("planId") DO UPDATE SET
      name       = EXCLUDED.name,
      price      = EXCLUDED.price,
      period     = EXCLUDED.period,
      features   = EXCLUDED.features,
      "isVisible" = EXCLUDED."isVisible",
      "sortOrder" = EXCLUDED."sortOrder",
      highlight  = EXCLUDED.highlight,
      "updatedAt" = NOW()
  `

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/pricing?planId=..., delete a pricing plan
export async function DELETE(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  let planId = url.searchParams.get('planId') || ''
  if (!planId) {
    const body = await req.json().catch(() => ({})) as { planId?: string }
    planId = body.planId || ''
  }
  planId = planId.trim()
  if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 })

  await db.$executeRaw`DELETE FROM pricing_plans WHERE "planId" = ${planId}`
  return NextResponse.json({ success: true })
}
