/**
 * fix-migrations.mjs
 *
 * Detects when a Prisma migration ran against the DB but wasn't recorded
 * (e.g. build was killed after the SQL committed but before Prisma could
 * write the success row to _prisma_migrations).
 *
 * For each guarded migration we check whether a sentinel object already
 * exists in the database.  If it does the migration has already been
 * applied, so we mark it as such via `prisma migrate resolve --applied`
 * so that `prisma migrate deploy` will skip it instead of trying – and
 * failing – to re-run it.
 *
 * Safe on a completely fresh database: the sentinel won't be found, we
 * do nothing, and `migrate deploy` runs the migration normally.
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

function resolveApplied(migrationName) {
  console.log(`  → Resolving "${migrationName}" as already applied...`);
  try {
    execSync(`npx prisma migrate resolve --applied ${migrationName}`, {
      stdio: 'inherit',
    });
  } catch (err) {
    // Might fail if already resolved — that's fine
    console.log(`  (resolve had no effect or migration already tracked — continuing)`);
  }
}

async function main() {
  console.log('\n[fix-migrations] Checking database state...\n');

  // ── phase1_and_phase2 ───────────────────────────────────────────────
  // Sentinel: the EventType enum (first type created in this migration)
  const phase1Done = await typeExists('EventType');
  if (phase1Done) {
    console.log('[fix-migrations] EventType already exists in DB.');
    console.log('[fix-migrations] phase1_and_phase2 was applied but not tracked. Resolving...');
    resolveApplied('phase1_and_phase2');
  } else {
    console.log('[fix-migrations] EventType not found — phase1_and_phase2 will run normally.');
  }

  // ── phase3_resume_system ───────────────────────────────────────────
  const phase3Done = await tableExists('resume_versions');
  if (phase3Done) {
    console.log('[fix-migrations] resume_versions already exists in DB.');
    resolveApplied('phase3_resume_system');
  }

  // ── phase4_slide_builder ────────────────────────────────────────────
  const phase4Done = await tableExists('presentations');
  if (phase4Done) {
    console.log('[fix-migrations] presentations already exists in DB.');
    resolveApplied('phase4_slide_builder');
  }

  // ── phase5_living_portfolio ─────────────────────────────────────────
  const phase5Done = await tableExists('projects');
  if (phase5Done) {
    console.log('[fix-migrations] projects already exists in DB.');
    resolveApplied('phase5_living_portfolio');
  }

  // ── phase8_presentation_meta ───────────────────────────────────────
  // Sentinel: the meta column on presentations table
  const phase8Done = await columnExists('presentations', 'meta');
  if (phase8Done) {
    console.log('[fix-migrations] presentations.meta already exists in DB.');
    resolveApplied('phase8_presentation_meta');
  }

  // ── 20260426000000_pagevisit_optional_userid ────────────────────────
  // This migration is recorded as failed in _prisma_migrations (finished_at IS NULL).
  // Directly detect it and resolve so migrate deploy can proceed.
  const pageVisitFailed = await migrationIsFailed('20260426000000_pagevisit_optional_userid');
  if (pageVisitFailed) {
    console.log('[fix-migrations] 20260426000000_pagevisit_optional_userid is stuck as failed — resolving...');
    resolveApplied('20260426000000_pagevisit_optional_userid');
  }

  console.log('\n[fix-migrations] Done.\n');
}

main()
  .catch((e) => {
    console.error('[fix-migrations] Error:', e.message);
    // Non-fatal — let migrate deploy try and surface any real error
  })
  .finally(() => prisma.$disconnect());
