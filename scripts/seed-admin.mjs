#!/usr/bin/env node
// scripts/seed-admin.mjs
// Run: node scripts/seed-admin.mjs
// Creates/updates the hardcoded admin account

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'
const ADMIN_PASSWORD = 'Jaysiyaram@12'
const ADMIN_NAME = 'Admin'

async function main() {
  console.log('🔐 Seeding admin account...')

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      password: hash,
      name: ADMIN_NAME,
      role: 'ADMIN',
      plan: 'TEAM',
      onboarded: true,
    },
    update: {
      role: 'ADMIN',
      plan: 'TEAM',
    },
  })

  // Upsert AdminSettings singleton
  await prisma.adminSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', usdToInr: 84.0 },
    update: {},
  })

  console.log(`✅ Admin account ready: ${admin.email} (role: ${admin.role})`)
  console.log(`   Default password: ${ADMIN_PASSWORD}`)
  console.log(`   Login at: /login → redirects to /admin`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
