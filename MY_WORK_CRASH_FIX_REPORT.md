# My Work Crash Fix

Fixed the crash caused by the asset edit patch referencing helper functions that were not present in `src/app/(app)/my-work/page.tsx`.

## Fixed
- Added `editTabForAsset()` so the Edit button routes each saved asset to the correct editor tab.
- Added `buildAssetAIQuestion()` so Ask AI can generate an asset-aware prompt from the exact saved generation.
- Kept Export removed from visible asset cards.
- Did not touch homepage chips, templates, pricing, APIs, or styling outside My Work crash recovery.

## Validation
- My Work page TSX transpiles with zero syntax diagnostics.
- Full app structure preserved with `package.json`, `src`, `public`, `prisma`, and root config files.
