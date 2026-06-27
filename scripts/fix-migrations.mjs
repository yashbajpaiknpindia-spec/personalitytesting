/**
 * fix-migrations.mjs
 *
 * Handles four scenarios before `prisma migrate deploy` runs:
 *
 * 1. P3005 — Database schema is not empty but _prisma_migrations table
 *    doesn't exist. We baseline all known migrations so Prisma treats
 *    them as already applied, then run self-healing DDL to patch any
 *    columns that were baselined without the SQL running.
 *
 * 2. Stuck migrations — A migration ran (SQL committed) but Prisma
 *    crashed before writing the success row, leaving finished_at = NULL.
 *    We resolve those as applied so migrate deploy can continue.
 *
 * 3. P3009 — A migration is recorded as errored (finished_at IS NULL,
 *    logs has error text). We DELETE the row from _prisma_migrations so
 *    that `migrate deploy` re-applies the migration. All affected
 *    migrations use IF NOT EXISTS / DO-EXCEPTION guards, making them
 *    safe to re-run on an existing schema.
 *
 * 4. Self-healing DDL — Regardless of migration tracking state, we
 *    directly ADD any columns/tables that should exist but don't. This
 *    is idempotent and covers the case where a migration was baselined
 *    as "applied" without its SQL actually running.
 *
 * Safe on a fresh empty database: the _prisma_migrations table won't
 * exist and no other tables will exist — we do nothing and let
 * migrate deploy run all migrations normally.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All migrations that currently exist in prisma/migrations/
// Keep this list in chronological order.
const ALL_MIGRATIONS = [
  '20260424000000_initial_schema',
  '20260425000000_add_domain_table',
  '20260425000001_add_website_theme',
  '20260425000002_admin_gen_limits',
  '20260425000003_add_page_visits',
  '20260426000000_pagevisit_optional_userid',
  '20260523_seo_ga_gsc',
  '20260523_phone_auth',
  '20260525000000_add_user_websites',
  '20260603000000_nullable_generation_templateid',
  '20260605000000_fix_stuck_pending_generations',
  '20260608000000_poster_edit_limit',
  '20260611000000_global_gen_limit',
  '20260616000000_brand_chat_history_costs',
  '20260620000000_add_prompt_to_user_websites',
];

async function tableExists(tableName) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
      tableName
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function typeExists(typeName) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM pg_type WHERE typname = $1 LIMIT 1`,
      typeName
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function columnExists(tableName, columnName) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2 LIMIT 1`,
      tableName,
      columnName
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function indexExists(indexName) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = $1 LIMIT 1`,
      indexName
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function migrationIsFailed(migrationName) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NULL LIMIT 1`,
      migrationName
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

// P3009: migration ran but Prisma recorded it as errored (finished_at IS NULL, logs has error).
// We DELETE the row so migrate deploy re-applies the migration from scratch.
async function migrationHasFailed(migrationName) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT 1 FROM "_prisma_migrations"
       WHERE migration_name = $1
         AND finished_at IS NULL
         AND logs IS NOT NULL
       LIMIT 1`,
      migrationName
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Delete a failed migration row from _prisma_migrations.
 * This causes `migrate deploy` to see the migration as unapplied and re-run it.
 */
async function deleteMigrationRow(migrationName) {
  console.log(`  → Deleting failed row for "${migrationName}" so deploy will re-apply it...`);
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = $1`,
      migrationName
    );
    console.log(`  ✓ Row deleted — migrate deploy will re-apply "${migrationName}"`);
  } catch (e) {
    console.log(`  (delete had no effect — ${e.message})`);
  }
}

function resolveApplied(migrationName) {
  // Avoid noisy Prisma P3017 errors on Render for legacy phase migrations that
  // no longer exist in prisma/migrations. They were already covered by the
  // self-healing DDL below, so resolving a missing directory adds noise only.
  if (!existsSync(`prisma/migrations/${migrationName}`)) {
    console.log(`  → Skipping resolve for legacy migration "${migrationName}" (directory not present).`);
    return;
  }
  console.log(`  → Resolving "${migrationName}" as already applied...`);
  try {
    execSync(`npx prisma migrate resolve --applied ${migrationName}`, {
      stdio: 'inherit',
    });
  } catch {
    console.log(`  (resolve had no effect or migration already tracked — continuing)`);
  }
}

// ── SCENARIO 4: Self-healing DDL ─────────────────────────────────────────────
// Directly add any tables/columns that should exist but don't, regardless of
// what Prisma's migration tracking says. All statements use IF NOT EXISTS so
// they are fully idempotent.
async function selfHealColumns() {
  console.log('\n[fix-migrations] Running self-healing DDL checks...\n');

  // ── admin_settings: generation limit columns (20260425000002_admin_gen_limits) ──
  const adminSettingsExists = await tableExists('admin_settings');
  if (adminSettingsExists) {
    const freeDailyLimitExists = await columnExists('admin_settings', 'freeDailyLimit');
    if (!freeDailyLimitExists) {
      console.log('[fix-migrations] admin_settings.freeDailyLimit missing — patching...');
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "admin_settings"
            ADD COLUMN IF NOT EXISTS "freeDailyLimit"   INTEGER DEFAULT 3,
            ADD COLUMN IF NOT EXISTS "freeWeeklyLimit"  INTEGER,
            ADD COLUMN IF NOT EXISTS "freeMonthlyLimit" INTEGER DEFAULT 30,
            ADD COLUMN IF NOT EXISTS "proDailyLimit"    INTEGER,
            ADD COLUMN IF NOT EXISTS "proWeeklyLimit"   INTEGER,
            ADD COLUMN IF NOT EXISTS "proMonthlyLimit"  INTEGER,
            ADD COLUMN IF NOT EXISTS "teamDailyLimit"   INTEGER,
            ADD COLUMN IF NOT EXISTS "teamWeeklyLimit"  INTEGER,
            ADD COLUMN IF NOT EXISTS "teamMonthlyLimit" INTEGER
        `);
        console.log('[fix-migrations] ✓ admin_settings generation-limit columns added.');
      } catch (e) {
        console.error('[fix-migrations] ✗ Failed to patch admin_settings:', e.message);
      }
    } else {
      console.log('[fix-migrations] admin_settings.freeDailyLimit OK');
    }

    // ── admin_settings: posterEditLimit (20260608000000_poster_edit_limit) ──
    const posterEditLimitExists = await columnExists('admin_settings', 'posterEditLimit');
    if (!posterEditLimitExists) {
      console.log('[fix-migrations] admin_settings.posterEditLimit missing — patching...');
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "posterEditLimit" INTEGER NOT NULL DEFAULT 2`
        );
        console.log('[fix-migrations] ✓ admin_settings.posterEditLimit added.');
      } catch (e) {
        console.error('[fix-migrations] ✗ Failed to patch admin_settings.posterEditLimit:', e.message);
      }
    } else {
      console.log('[fix-migrations] admin_settings.posterEditLimit OK');
    }

    // ── admin_settings: globalGenLimit + globalLimitPeriod (20260611000000_global_gen_limit) ──
    const globalGenLimitExists = await columnExists('admin_settings', 'globalGenLimit');
    if (!globalGenLimitExists) {
      console.log('[fix-migrations] admin_settings.globalGenLimit missing — patching...');
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "admin_settings"
            ADD COLUMN IF NOT EXISTS "globalGenLimit"    INTEGER NOT NULL DEFAULT 5,
            ADD COLUMN IF NOT EXISTS "globalLimitPeriod" TEXT    NOT NULL DEFAULT 'daily'
        `);
        console.log('[fix-migrations] ✓ admin_settings global gen limit columns added.');
      } catch (e) {
        console.error('[fix-migrations] ✗ Failed to patch admin_settings global limits:', e.message);
      }
    } else {
      console.log('[fix-migrations] admin_settings.globalGenLimit OK');
    }
  }

  // ── User: phone column (20260523_phone_auth) ──────────────────────────────
  const userTableExists = await tableExists('User');
  if (userTableExists) {
    const phoneExists = await columnExists('User', 'phone');
    if (!phoneExists) {
      console.log('[fix-migrations] User.phone missing — patching...');
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone")`);
        console.log('[fix-migrations] ✓ User.phone column added.');
      } catch (e) {
        console.error('[fix-migrations] ✗ Failed to patch User.phone:', e.message);
      }
    } else {
      console.log('[fix-migrations] User.phone OK');
    }

    // ── User: dailyUsageCount + dailyUsageDate (20260611000000_global_gen_limit) ──
    const dailyUsageExists = await columnExists('User', 'dailyUsageCount');
    if (!dailyUsageExists) {
      console.log('[fix-migrations] User.dailyUsageCount missing — patching...');
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "User"
            ADD COLUMN IF NOT EXISTS "dailyUsageCount" INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "dailyUsageDate"  TEXT    NOT NULL DEFAULT ''
        `);
        console.log('[fix-migrations] ✓ User daily usage columns added.');
      } catch (e) {
        console.error('[fix-migrations] ✗ Failed to patch User daily usage:', e.message);
      }
    } else {
      console.log('[fix-migrations] User.dailyUsageCount OK');
    }
  }

  // ── Domain table (20260425000000_add_domain_table) ──────────────────────
  // The initial migration also includes Domain for fresh databases. This keeps
  // older/baselined databases safe if Domain was marked applied but not created.
  const domainExists = await tableExists('Domain');
  if (!domainExists) {
    console.log('[fix-migrations] Domain table missing — creating...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Domain" (
          "id"                TEXT NOT NULL,
          "userId"            TEXT NOT NULL,
          "domain"            TEXT NOT NULL,
          "verified"          BOOLEAN NOT NULL DEFAULT false,
          "verificationToken" TEXT NOT NULL,
          "cnameTarget"       TEXT NOT NULL DEFAULT 'cname.brandsyndicate.co',
          "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Domain_userId_key" ON "Domain"("userId")`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Domain_domain_key" ON "Domain"("domain")`);
      if (userTableExists) {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            ALTER TABLE "Domain" ADD CONSTRAINT "Domain_userId_fkey"
              FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          EXCEPTION WHEN duplicate_object THEN NULL; END $$
        `);
      }
      console.log('[fix-migrations] ✓ Domain table created.');
    } catch (e) {
      console.error('[fix-migrations] ✗ Failed to create Domain:', e.message);
    }
  } else {
    console.log('[fix-migrations] Domain table OK');
  }

  // ── portfolios: GA4 / GSC columns (20260523_seo_ga_gsc) ──────────────────
  const portfoliosExists = await tableExists('portfolios');
  if (portfoliosExists) {
    const gaExists  = await columnExists('portfolios', 'googleAnalyticsId');
    const gscExists = await columnExists('portfolios', 'gscVerificationToken');
    if (!gaExists || !gscExists) {
      console.log('[fix-migrations] portfolios SEO columns missing — patching...');
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "googleAnalyticsId" TEXT`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "gscVerificationToken" TEXT`);
        console.log('[fix-migrations] ✓ portfolios SEO columns added.');
      } catch (e) {
        console.error('[fix-migrations] ✗ Failed to patch portfolios SEO:', e.message);
      }
    } else {
      console.log('[fix-migrations] portfolios SEO columns OK');
    }

    // ── portfolios: websiteTheme (20260425000001_add_website_theme) ──────────
    const themeExists = await columnExists('portfolios', 'websiteTheme');
    if (!themeExists) {
      console.log('[fix-migrations] portfolios.websiteTheme missing — patching...');
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "websiteTheme" TEXT DEFAULT 'the-manifesto'`
        );
        console.log('[fix-migrations] ✓ portfolios.websiteTheme added.');
      } catch (e) {
        console.error('[fix-migrations] ✗ Failed to patch portfolios.websiteTheme:', e.message);
      }
    } else {
      console.log('[fix-migrations] portfolios.websiteTheme OK');
    }
  }

  // ── Generation: nullable templateId (20260603000000_nullable_generation_templateid) ──
  const generationExists = await tableExists('Generation');
  if (generationExists) {
    // Check if templateId is nullable by querying column IS_NULLABLE
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT is_nullable FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'Generation' AND column_name = 'templateId' LIMIT 1`
      );
      if (rows.length > 0 && rows[0].is_nullable === 'NO') {
        console.log('[fix-migrations] Generation.templateId is NOT NULL — dropping constraint...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Generation" ALTER COLUMN "templateId" DROP NOT NULL`);
        console.log('[fix-migrations] ✓ Generation.templateId now nullable.');
      } else {
        console.log('[fix-migrations] Generation.templateId nullable OK');
      }
    } catch (e) {
      console.error('[fix-migrations] ✗ Failed to patch Generation.templateId:', e.message);
    }
  }

  // ── user_websites table (20260525000000_add_user_websites) ───────────────
  const userWebsitesExists = await tableExists('user_websites');
  if (!userWebsitesExists) {
    console.log('[fix-migrations] user_websites table missing — creating...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "user_websites" (
          "id"               TEXT        NOT NULL,
          "userId"           TEXT        NOT NULL,
          "name"             TEXT        NOT NULL,
          "templateId"       TEXT,
          "templateLabel"    TEXT,
          "htmlContent"      TEXT        NOT NULL,
          "isGenerated"      BOOLEAN     NOT NULL DEFAULT false,
          "isPublished"      BOOLEAN     NOT NULL DEFAULT false,
          "slug"             TEXT,
          "customDomain"     TEXT,
          "domainVerified"   BOOLEAN     NOT NULL DEFAULT false,
          "adminNote"        TEXT,
          "prompt"           TEXT,
          "visitCount"       INTEGER     NOT NULL DEFAULT 0,
          "generationId"     TEXT,
          "metaTitle"        TEXT,
          "metaDescription"  TEXT,
          "canonicalUrl"     TEXT,
          "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "user_websites_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "user_websites_slug_key"         ON "user_websites"("slug")`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "user_websites_customDomain_key"  ON "user_websites"("customDomain")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX        IF NOT EXISTS "user_websites_userId_idx"        ON "user_websites"("userId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX        IF NOT EXISTS "user_websites_slug_idx"          ON "user_websites"("slug")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX        IF NOT EXISTS "user_websites_createdAt_idx"     ON "user_websites"("createdAt")`);
      // FK — only add if User table exists
      if (userTableExists) {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            ALTER TABLE "user_websites" ADD CONSTRAINT "user_websites_userId_fkey"
              FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          EXCEPTION WHEN duplicate_object THEN NULL; END $$
        `);
      }
      console.log('[fix-migrations] ✓ user_websites table created.');
    } catch (e) {
      console.error('[fix-migrations] ✗ Failed to create user_websites:', e.message);
    }
  } else {
    console.log('[fix-migrations] user_websites table OK');

    // Ensure any columns added in later patches on user_websites exist
    const visitCountExists = await columnExists('user_websites', 'visitCount');
    if (!visitCountExists) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "user_websites" ADD COLUMN IF NOT EXISTS "visitCount" INTEGER NOT NULL DEFAULT 0`);
        console.log('[fix-migrations] ✓ user_websites.visitCount added.');
      } catch (e) {
        console.error('[fix-migrations] ✗ Failed to patch user_websites.visitCount:', e.message);
      }
    }
    const promptExists = await columnExists('user_websites', 'prompt');
    if (!promptExists) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "user_websites" ADD COLUMN IF NOT EXISTS "prompt" TEXT`);
        console.log('[fix-migrations] ✓ user_websites.prompt added.');
      } catch (e) {
        console.error('[fix-migrations] ✗ Failed to patch user_websites.prompt:', e.message);
      }
    }
    const metaTitleExists = await columnExists('user_websites', 'metaTitle');
    if (!metaTitleExists) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "user_websites"
            ADD COLUMN IF NOT EXISTS "metaTitle"       TEXT,
            ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
            ADD COLUMN IF NOT EXISTS "canonicalUrl"    TEXT
        `);
        console.log('[fix-migrations] ✓ user_websites SEO columns added.');
      } catch (e) {
        console.error('[fix-migrations] ✗ Failed to patch user_websites SEO cols:', e.message);
      }
    }
  }

  // ── chat_threads + chat_messages (20260616000000_brand_chat_history_costs) ─
  const chatThreadsExists = await tableExists('chat_threads');
  if (!chatThreadsExists) {
    console.log('[fix-migrations] chat_threads table missing — creating...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "chat_threads" (
          "id"             TEXT             NOT NULL,
          "userId"         TEXT             NOT NULL,
          "title"          TEXT             NOT NULL DEFAULT 'New chat',
          "mode"           TEXT             NOT NULL DEFAULT 'brand_studio',
          "totalCostUsd"   DOUBLE PRECISION NOT NULL DEFAULT 0,
          "totalCostInr"   DOUBLE PRECISION NOT NULL DEFAULT 0,
          "messageCount"   INTEGER          NOT NULL DEFAULT 0,
          "lastMessageAt"  TIMESTAMP(3),
          "createdAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "chat_threads_userId_idx"       ON "chat_threads"("userId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "chat_threads_lastMessageAt_idx" ON "chat_threads"("lastMessageAt")`);
      if (userTableExists) {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_userId_fkey"
              FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          EXCEPTION WHEN duplicate_object THEN NULL; END $$
        `);
      }
      console.log('[fix-migrations] ✓ chat_threads table created.');
    } catch (e) {
      console.error('[fix-migrations] ✗ Failed to create chat_threads:', e.message);
    }
  } else {
    console.log('[fix-migrations] chat_threads table OK');
  }

  const chatMessagesExists = await tableExists('chat_messages');
  if (!chatMessagesExists) {
    console.log('[fix-migrations] chat_messages table missing — creating...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "chat_messages" (
          "id"              TEXT             NOT NULL,
          "threadId"        TEXT             NOT NULL,
          "userId"          TEXT,
          "role"            TEXT             NOT NULL,
          "content"         TEXT             NOT NULL,
          "provider"        TEXT,
          "model"           TEXT,
          "inputTokens"     INTEGER,
          "outputTokens"    INTEGER,
          "totalTokens"     INTEGER,
          "costUsd"         DOUBLE PRECISION,
          "costInr"         DOUBLE PRECISION,
          "usedExternalApi" BOOLEAN          NOT NULL DEFAULT false,
          "confidence"      DOUBLE PRECISION,
          "metadata"        JSONB,
          "createdAt"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "chat_messages_threadId_idx"  ON "chat_messages"("threadId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "chat_messages_userId_idx"    ON "chat_messages"("userId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "chat_messages_createdAt_idx" ON "chat_messages"("createdAt")`);
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_threadId_fkey"
            FOREIGN KEY ("threadId") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
      `);
      if (userTableExists) {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey"
              FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          EXCEPTION WHEN duplicate_object THEN NULL; END $$
        `);
      }
      console.log('[fix-migrations] ✓ chat_messages table created.');
    } catch (e) {
      console.error('[fix-migrations] ✗ Failed to create chat_messages:', e.message);
    }
  } else {
    console.log('[fix-migrations] chat_messages table OK');
  }

  console.log('\n[fix-migrations] Self-healing DDL complete.\n');
}

async function main() {
  console.log('\n[fix-migrations] Checking database state...\n');

  // ── SCENARIO 1: P3005 baseline ──────────────────────────────────────
  const migrationTableExists = await tableExists('_prisma_migrations');

  if (!migrationTableExists) {
    let anyTableExists = false;
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
      );
      anyTableExists = Number(rows[0].count) > 0;
    } catch {
      anyTableExists = false;
    }

    if (anyTableExists) {
      console.log('[fix-migrations] P3005 detected: DB has tables but no _prisma_migrations.');
      console.log('[fix-migrations] Baselining all migrations...\n');
      for (const migration of ALL_MIGRATIONS) {
        resolveApplied(migration);
      }
      console.log('\n[fix-migrations] Baseline complete.');
      // After baselining, self-heal any columns that weren't in the original schema
      await selfHealColumns();
    } else {
      console.log('[fix-migrations] Fresh empty database — migrate deploy will run all migrations normally.');
    }

    return;
  }

  // ── SCENARIO 2: Stuck / failed migrations ───────────────────────────
  // Legacy phase migrations (kept for old DBs still in the field)
  const phase1Done = await typeExists('EventType');
  if (phase1Done) {
    console.log('[fix-migrations] EventType already exists — resolving phase1_and_phase2...');
    resolveApplied('phase1_and_phase2');
  }

  const phase3Done = await tableExists('resume_versions');
  if (phase3Done) {
    console.log('[fix-migrations] resume_versions already exists — resolving phase3_resume_system...');
    resolveApplied('phase3_resume_system');
  }

  const phase4Done = await tableExists('presentations');
  if (phase4Done) {
    console.log('[fix-migrations] presentations already exists — resolving phase4_slide_builder...');
    resolveApplied('phase4_slide_builder');
  }

  const phase5Done = await tableExists('projects');
  if (phase5Done) {
    console.log('[fix-migrations] projects already exists — resolving phase5_living_portfolio...');
    resolveApplied('phase5_living_portfolio');
  }

  const phase8Done = await columnExists('presentations', 'meta');
  if (phase8Done) {
    console.log('[fix-migrations] presentations.meta already exists — resolving phase8_presentation_meta...');
    resolveApplied('phase8_presentation_meta');
  }

  const pageVisitFailed = await migrationIsFailed('20260426000000_pagevisit_optional_userid');
  if (pageVisitFailed) {
    console.log('[fix-migrations] 20260426000000_pagevisit_optional_userid is stuck — resolving...');
    resolveApplied('20260426000000_pagevisit_optional_userid');
  }

  // ── SCENARIO 3: P3009 — DELETE failed rows so deploy re-applies them ─
  const p3009Candidates = [
    '20260424000000_initial_schema',
    '20260425000000_add_domain_table',
    '20260425000001_add_website_theme',
    '20260425000002_admin_gen_limits',
    '20260425000003_add_page_visits',
    '20260426000000_pagevisit_optional_userid',
    '20260523_phone_auth',
    '20260523_seo_ga_gsc',
    '20260525000000_add_user_websites',
    '20260603000000_nullable_generation_templateid',
    '20260605000000_fix_stuck_pending_generations',
    '20260608000000_poster_edit_limit',
    '20260611000000_global_gen_limit',
    '20260616000000_brand_chat_history_costs',
    '20260620000000_add_prompt_to_user_websites',
  ];
  for (const name of p3009Candidates) {
    const hasFailed = await migrationHasFailed(name);
    if (hasFailed) {
      console.log(`[fix-migrations] P3009 detected: "${name}" failed on previous deploy — deleting for re-application...`);
      await deleteMigrationRow(name);
    }
  }

  // ── SCENARIO 4: Self-healing DDL ────────────────────────────────────
  // Always run column checks as the final safety net. Covers the case where
  // migrations were baselined/resolved without the SQL running.
  await selfHealColumns();

  console.log('[fix-migrations] Done.\n');
}

main()
  .catch((e) => {
    console.error('[fix-migrations] Error:', e.message);
    // Non-fatal — let migrate deploy surface any real errors
  })
  .finally(() => prisma.$disconnect());
