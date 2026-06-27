# Build Speed Optimization Report

This pass keeps the application features intact and optimizes the Render build pipeline.

## Main cause found

The previous build command did everything in this order:

```bash
prisma generate && node scripts/fix-migrations.mjs && prisma migrate deploy && tsx prisma/seed.ts && next build
```

That meant every deploy waited for remote database checks, migration repair, migration deploy, and seeding before Next.js even started compiling. If there was a TypeScript/syntax error, Render discovered it only after all DB work had already run.

The project also contains a large static template library under `public/samples`, so Next output tracing needed tighter exclusions to avoid unnecessary tracing work.

## Changes made

### 1. Faster build command

`package.json` now uses:

```bash
node scripts/render-build-fast.mjs
```

The new script runs:

1. Prisma client generation
2. Next.js production build
3. Database self-heal/migrate/seed only after the app compiles

This makes code failures appear much earlier and avoids wasting time on DB steps when the build itself is broken.

The old command is preserved as:

```bash
npm run build:legacy
```

### 2. Fast idempotent seed

`prisma/seed.ts` now checks whether templates, admin account, and AdminSettings already exist. On normal deploys it skips unnecessary template upserts and bcrypt hashing.

Use `FORCE_SEED=true` only when you intentionally want to refresh seed data.

### 3. Next tracing exclusions

`next.config.mjs` now excludes large static/runtime-only folders from server output tracing:

- `public/samples/**`
- `public/generated/**`
- `public/portfolio/**`
- report/audit markdown/json files
- old non-Next client/server/shared folders
- heavy native binaries/packages that should stay external

This keeps the server trace lighter without removing files from the app.

### 4. Install noise/speed

`.npmrc` disables npm audit/fund/progress during Render install:

```ini
audit=false
fund=false
prefer-offline=true
progress=false
loglevel=warn
```

This reduces install noise and avoids repeating audit output during every deploy. Dependency vulnerability fixes from the previous package remain in place.

## How to deploy

Keep your Render build command as:

```bash
npm install && npm run build
```

For even cleaner/faster installs, you can change Render build command to:

```bash
npm ci --prefer-offline --no-audit --no-fund && npm run build
```

## Safety notes

- No app feature was removed.
- The old full build command remains available as `npm run build:legacy`.
- TypeScript checking is still done by Next build.
- Only the separate ESLint build pass is skipped; lint can still be run separately if needed.
