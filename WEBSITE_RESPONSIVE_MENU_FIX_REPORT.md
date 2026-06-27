# Brand Syndicate Responsive Website Fix v2

## Files changed
- `src/lib/website/renderTemplateHtml.ts`
- `src/lib/website/generateTemplatePlan.ts`
- `src/app/w/[slug]/route.ts`
- `src/app/api/website-preview/[id]/route.ts`
- `src/app/(app)/my-work/page.tsx`

## Fixes added
1. Added a mobile navigation system for generated websites. On mobile, overflowing nav/menu links are moved into a hamburger-style drawer instead of spilling outside the viewport.
2. Added the same mobile drawer behavior to published websites (`/w/[slug]`) and dashboard website previews.
3. Enabled scripts in My Work website preview iframes so the responsive menu/image fixes can actually run inside the preview cards.
4. Strengthened mobile CSS for nav bars, hero sections, images, grids, fixed-width sections, buttons, headings, and wrappers across device sizes.
5. Added a sanitizer that removes user-visible wording like `template`, `placeholder`, `lorem ipsum`, `backend can replace`, and similar demo/template language from generated and previewed websites.
6. Updated the website planning prompt so future generations produce real business website copy with specific services/products and proof points, not template/demo wording.

## Validation
- Syntax checked with TypeScript `transpileModule` on every changed file.
- Full Next.js build was not run in this sandbox because project dependencies/node_modules are not installed here.
