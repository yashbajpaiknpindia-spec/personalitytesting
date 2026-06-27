# Template Image + Mobile Deep Fix Report

This pass focuses on the exact issue shown in the screenshots: templates and generated websites looking correct on desktop but breaking on mobile, and images/thumbnails failing or appearing irrelevant.

## What changed

- Hardened every static website sample HTML file in `public/samples` with a mobile safety layer, mobile drawer repair, fluid image rules, and broken-image fallback script.
- Replaced deprecated `source.unsplash.com` template/sample images with stable curated `images.unsplash.com` URLs mapped by industry keywords.
- Added missing static preview HTML files for all video-production / AI-video templates so every library template has a real `/samples/<id>.html` preview.
- Added server-side thumbnail resolving so `/templates`, template detail pages, and home template cards get relevant industry images first and a local SVG fallback if a remote image fails.
- Added `/api/template-thumbnail` as a local no-network fallback for template images.
- Strengthened public `/w/[slug]`, saved website preview, and new template-renderer paths so existing and newly generated websites get mobile/nav/image repair at render time.
- Added replacement logic for old stored/generated `source.unsplash.com` URLs so existing websites do not keep broken image URLs.
- Made template detail pages responsive instead of forcing a desktop two-column layout on phones.

## Audit result

- Website template metadata IDs: 1000
- Static sample HTML files present: 1000
- Missing `/samples/<id>.html` previews: 0
- Static sample image tags protected: 4861
- Deprecated `source.unsplash.com` remaining in static samples: 0
- Deprecated `source.unsplash.com` remaining in `src/lib/website/thumbnails.ts`: 0
- Malformed image tag patterns remaining: 0
- Unsafe `width:100vw` / `min-width:100vw` patterns remaining in samples: 0
- Missing viewport meta tags in samples: 0
- Public `/w` route responsive/image fallback injection: yes
- Preview route image fallback injection: yes
- New generated renderer image fallback injection: yes

## Files added / updated

- `scripts/harden-static-website-samples.mjs`
- `STATIC_TEMPLATE_DEEP_AUDIT_REPORT.md`
- `WEBSITE_MOBILE_SMOKE_TEST_REPORT.md`
- `src/lib/website/thumbnail-resolver.ts`
- `src/app/api/template-thumbnail/route.ts`
- `src/app/(app)/templates/page.tsx`
- `src/app/(app)/templates/TemplatesClient.tsx`
- `src/app/templates/[id]/page.tsx`
- `src/app/templates/[id]/TemplatePreviewImage.tsx`
- `src/app/w/[slug]/route.ts`
- `src/app/api/website-preview/[id]/route.ts`
- `src/lib/website/renderTemplateHtml.ts`
- `src/lib/website/thumbnails.ts`
- Missing video-related sample HTML files in `public/samples/`
