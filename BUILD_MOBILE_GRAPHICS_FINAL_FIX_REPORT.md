# Build, Mobile Preview, Graphics and Security Fix Report

This pass fixes the deployment issue and the mobile/graphics issues reported after the existing-website smoothness deployment.

## Build fixes

- Fixed unterminated string in `src/app/api/user-websites/slug/[slug]/route.ts`.
- Replaced missing `businessName` references with `business_name` in `src/lib/website/renderTemplateHtml.ts`.
- Updated `scripts/fix-migrations.mjs` so legacy phase migrations that are not present in `prisma/migrations` are skipped instead of triggering noisy Prisma P3017 logs on Render.

## Vulnerability cleanup

- Upgraded `next` from `14.2.18` to `15.5.19`.
- Added package overrides for patched transitive dependencies:
  - `form-data` `^4.0.6`
  - `esbuild` `^0.28.1`
  - `postcss` `^8.5.10`
- `npm audit --omit=dev --json` was run after the lockfile update and returned `0 vulnerabilities`.

## Brand image / poster fixes

- Removed old `Split Focus`/half-panel labels and filters from displayed/persisted campaign image variations.
- Existing stored split-focus variations are no longer shown in the generated images slider.
- New generated variations remain safe layouts: Left Editorial, Editorial Focus, Bottom Impact, Centered Premium.
- Added stronger poster text fitting logic so headlines, subheadlines and CTA text scale down before rendering and do not overflow their text panel.
- CTA sizing now accounts for letter spacing so button text does not spill out.

## Mobile generate-page spacing fixes

- Reduced excessive bottom padding under image preview and instant style controls on mobile.
- Reduced dead space below the generated image panel while preserving enough safe padding for the bottom mobile tabs.
- Kept the website preview route free of bottom padding so website iframes use the full available height.

## Template mobile gallery

- Re-included `public/template-mobile-gallery.html` so all templates can still be inspected in mobile iframe view after deployment.
