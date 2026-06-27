# Website Generation Mobile Layout Audit

This update focuses on the exact website generation path and the saved preview path so generated websites do not overlap, cut off, or break on mobile.

## What was fixed

- Added a universal mobile safety layer to template-rendered websites.
- Added the same safety layer to saved/raw website previews so existing generated websites are repaired when opened.
- Added the safety layer to full-code generation mode as a final post-process.
- Hid direct nav CTA buttons on mobile so logos and hamburger menus do not squeeze and stack vertically.
- Kept hero background images full-cover without stretching or pushing content outside the viewport.
- Forced grids, split layouts, cards, metrics, pricing blocks, tables, forms, and long copy to fit inside mobile width.
- Repaired malformed imported image tags such as `<img ... / loading="lazy">` across the sample template library.
- Replaced `100vw` width patterns that can create horizontal overflow with safer `100%` sizing.
- Tightened template-plan copy lengths so generated business names, hero headlines, CTAs, and section titles stay mobile-safe.

## Static template audit

- Sample HTML files checked: 991
- Malformed image slash attributes remaining: 0
- `width:100vw` / `min-width:100vw` overflow patterns remaining: 0
- Missing viewport meta tags: 0

## Key files changed

- `src/lib/website/renderTemplateHtml.ts`
- `src/app/api/website-preview/[id]/route.ts`
- `src/app/api/generate-website/stream/route.ts`
- `src/lib/website/generateTemplatePlan.ts`
- `public/samples/*.html`
