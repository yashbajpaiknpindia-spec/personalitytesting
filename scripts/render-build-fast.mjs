import { execSync } from 'child_process'

const startedAt = Date.now()

// ── Memory: give Node/webpack 4 GB on Render's 2-vCPU builder ──────────────
// Without this, webpack hits GC pressure on 90+ route projects and slows down.
const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096',
}

function run(label, command, options = {}) {
  const t0 = Date.now()
  console.log(`\n[build-fast] ${label}...`)
  execSync(command, { stdio: 'inherit', env, ...options })
  const sec = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`[build-fast] ✓ ${label} done in ${sec}s`)
}

function hasDatabaseUrl() {
  return Boolean(env.DATABASE_URL || env.POSTGRES_PRISMA_URL || env.POSTGRES_URL)
}

// ── Detect Turbopack support (Next 15.3+) ──────────────────────────────────
// next build --turbopack compiles with Rust instead of webpack — 60-80% faster.
// Set DISABLE_TURBOPACK=1 in Render env vars to fall back to webpack if needed.
function buildCommand() {
  if (env.DISABLE_TURBOPACK === '1') {
    console.log('[build-fast] DISABLE_TURBOPACK=1 — using webpack')
    return 'next build'
  }
  return 'next build --turbopack'
}

try {
  // 1. Prisma client generation — must happen before Next.js compile
  run('Prisma client generation', 'prisma generate')

  // 2. Next.js compile — fail fast on code errors before touching DB
  run('Next.js production build', buildCommand())

  // 3. DB steps — only run if a database is reachable
  if (env.SKIP_DB_STEPS === 'true') {
    console.log('\n[build-fast] SKIP_DB_STEPS=true — skipping migrations and seed.')
  } else if (!hasDatabaseUrl()) {
    console.log('\n[build-fast] No database URL found — skipping migrations and seed.')
  } else {
    // Run self-heal + migrate + seed + website-visibility fix in one pipeline.
    // fix-website-visibility is merged here (was a separate step in render.yaml)
    // so we only open one DB connection sequence instead of two.
    run('Self-healing migration checks', 'node scripts/fix-migrations.mjs')
    run('Prisma migrate deploy', 'prisma migrate deploy')
    run('Fast idempotent seed', 'tsx prisma/seed.ts')
    // Non-fatal — patches existing sites but should never block a deploy
    try {
      run('Website visibility fix', 'node scripts/fix-website-visibility.mjs')
    } catch {
      console.log('[build-fast] Website visibility fix failed (non-fatal) — continuing.')
    }
  }

  const total = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`\n[build-fast] ✅ Build pipeline complete in ${total}s`)
} catch (error) {
  console.error('\n[build-fast] Build failed.')
  process.exit(typeof error?.status === 'number' ? error.status : 1)
}
