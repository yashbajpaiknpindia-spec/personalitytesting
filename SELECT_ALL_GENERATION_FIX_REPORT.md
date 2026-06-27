# Select All Generation Fix Report

Implemented from the current app base.

## What changed

- Renamed the homepage chip from **Full Brand Kit** to **Select All**.
- Added **Select All** support in `/generate` URL routing.
- Added a **Select All** chip in the Generate page.
- Select All generates exactly these 5 assets, sequentially:
  1. Website
  2. Brand Image
  3. Logo
  4. Business Strategy
  5. Content Calendar
- Select All pre-checks that the user has at least 5 generations remaining.
- Each asset uses its existing generation API, so each successful asset consumes its own generation.
- Brand Image generation in Select All mode renders only 1 image variation to keep cost lower.
- Generated assets are added to the Generate page asset switcher, so users can move between Website, Brand Image, Logo, Strategy, and Calendar previews.

## Files changed

- `src/app/HomeClient.tsx`
- `src/app/(app)/generate/page.tsx`
- `src/app/api/generate-graphics/route.ts`

## Quota behavior

Select All requires 5 available generations before it starts. If the user has fewer than 5 remaining, it blocks the flow before calling paid APIs.

Because each existing route already calls the global usage counter after success, a complete Select All run consumes 5 generations.
