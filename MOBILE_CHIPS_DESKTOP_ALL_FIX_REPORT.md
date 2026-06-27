# Mobile/Desktop Chip Behavior Fix

## What changed

- Desktop/tablet now shows all generation chips directly.
- Mobile now shows only the first 4 chips by default:
  - Chat
  - Website
  - Logo Design
  - Brand Images
- Mobile shows a single `More` button under those 4 chips.
- After tapping `More`, all remaining chips appear in the same chip grid and the `More` button disappears.
- Removed duplicate secondary chip panel rendering from the component.
- Kept the lighter homepage behavior: no heavy Sample Prompt / What You’ll Get panel.

## Files changed

- `src/app/HomeClient.tsx`
- `src/app/globals.css`

## Safety

- No sample websites removed.
- `package.json` remains present.
- All 1000 sample HTML websites remain in `public/samples`.
