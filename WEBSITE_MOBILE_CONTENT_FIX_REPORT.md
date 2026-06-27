# Brand Syndicate Website Mobile + Content Fix

## Files changed
- `src/lib/website/renderTemplateHtml.ts`
- `src/app/w/[slug]/route.ts`
- `src/app/api/website-preview/[id]/route.ts`

## What was fixed
1. Added a stronger mobile safety layer to new generated websites so nav links, menu links, CTAs, hero sections, images, grids, and fixed-width blocks do not get cut on phone-sized screens.
2. Added the same responsive safety layer to published websites and dashboard preview iframes so older saved websites also display better without regeneration.
3. Added image hardening for existing and previewed websites: images are forced eager, async decoded, and remote image referrer policy is made safer to reduce blank image cases.
4. Replaced obvious placeholder copy like `Service One`, `Service Two`, `Service Three`, `Lorem ipsum`, and template-instruction text with generated business-specific copy.
5. Added an automatic real-content upgrade for thin/template-like HTML by injecting real services, why-us, and contact sections from the generated website plan.

## Validation
- TypeScript syntax was checked using TypeScript `transpileModule` for all changed files.
- Full Next.js build was not run because dependencies/node_modules are not present in this sandbox.
