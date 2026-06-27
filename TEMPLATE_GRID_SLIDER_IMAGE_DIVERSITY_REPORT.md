# Template Grid + Slider + Static Image Diversity Update

- Kept all static sample websites intact: **1000 HTML files** remain in `public/samples`.
- Updated `/templates` to show both:
  - A horizontal slider preview.
  - A responsive grid gallery below it.
- Added lazy loading to the grid through the existing Load More button.
- Improved thumbnail diversity for BSX/repeated template families through `src/lib/website/thumbnail-resolver.ts`.
- Diversified Unsplash image URLs inside all `public/samples/*.html` files so related templates no longer reuse the same static image everywhere.

## Image diversification check

- Sample HTML files updated: **1000**
- Unsplash image occurrences checked: **5661**
- Unique Unsplash URLs after update: **1681**
- Average unique image URLs per sample website: **5.63**

This keeps the full website library while reducing the repeated-image feel across same-category templates.
