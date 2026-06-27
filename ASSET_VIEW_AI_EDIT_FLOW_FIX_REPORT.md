# Asset View + AI Edit Flow Fix

- My Work **View** now opens the actual generated content in `/generate?gen=...&tab=...` instead of opening a modal with saved JSON/data.
- My Work **AI Edit** now opens the same generated content page with the AI edit panel open.
- Removed links into the irrelevant Business Assets editor. `/business/edit` now redirects to the generated content page.
- Added an AI edit panel below generated Logo, Copy, Strategy, Calendar, and Website content.
- Logo AI edits use the existing `/api/generate-logo-image` system and save the revised image back into the same generation.
- Content AI edits use `/api/asset-ai-edit` and save back into the same generation.
- Improved the old “New Logo Image” wording to “Regenerate Logo”.
