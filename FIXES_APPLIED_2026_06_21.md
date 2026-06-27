# Brand Syndicate Fixes Applied — 2026-06-21

## Corrections from latest feedback

- Removed the uploaded woman/fashion creator photo from branded graphics while keeping the previous campaign/portfolio visuals intact.
- Scoped the creamy legacy premium theme to light mode only. Dark mode keeps the original cinematic dark variables and styling.
- Removed the broken split-focus image variation from the graphic generation path. Legacy C/split-style requests are redirected to safe editorial/full-bleed layouts.
- Prevented raw/original stock images from being shown as user-facing generated graphics. If compositing fails, the API serves a safe text-only poster fallback or skips the variation.
- Strengthened the `/w/[slug]` public website renderer, the logged-in preview renderer, and the new template renderer with mobile layout protection.
- Added mobile nav protection for templates that already have their own hamburger menu so CTA/buttons do not keep squeezing the brand name.
- Added image fallback scripts so broken remote images become safe branded fallback SVGs instead of blank/broken boxes.

## Mobile smoke test

See `WEBSITE_MOBILE_SMOKE_TEST_REPORT.md` and representative HTML outputs in:

`public/generated/website-mobile-smoke/`
