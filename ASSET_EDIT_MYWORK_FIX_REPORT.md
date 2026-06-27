# Asset edit / My Work fix

Changes applied:

- Removed the visible Export action from generated asset cards in My Work.
- My Work asset Edit now opens the editor on the exact asset tab:
  - logo → logo editor
  - images/graphics → images editor
  - copy → copy editor
  - strategy → strategy editor
  - calendar → calendar editor
  - website → website editor
- Ask AI from My Work now sends the saved asset context, generation ID, asset type, brand, industry, copy/strategy/calendar/render-contract details where available, so the assistant can explain the exact asset and suggest relevant improvements.
- Added an asset-aware AI edit box inside the Business Assets editor.
- Logo AI edits use the existing `/api/generate-logo-image` pipeline with the user's edit instruction.
- Poster/image AI edits use the existing `/api/edit-poster` render-edit pipeline when a render contract exists.
- Copy, strategy, calendar, website, and brand text edits use the new `/api/asset-ai-edit` route and save changes back to the same generation.
- Added POST compatibility to `/api/generate/update` because the editor was already using POST for autosave.

Files changed:

- `src/app/(app)/my-work/page.tsx`
- `src/app/(app)/business/edit/BusinessAssetsEditClient.tsx`
- `src/app/api/generate-logo-image/route.ts`
- `src/app/api/generate/update/route.ts`
- `src/app/api/asset-ai-edit/route.ts`

Notes:

- Image/logo editing is regeneration-based unless the saved poster has a render contract. Poster images with render contracts are edited through the existing backend render pipeline.
- Browser build could not be run in the sandbox because dependencies are not installed in the extracted zip (`prisma: not found`).
