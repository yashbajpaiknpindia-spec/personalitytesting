# Generation Limit, Settings, Support, and Admin Fixes

Applied on top of `personalitytesting-main-generation-failures-fixed`.

## Fixed

1. **Generation limit now applies to external AI chat**
   - Chat route checks the same global/per-user generation quota before calling Claude/OpenAI.
   - Local/no-cost chat answers can still respond.
   - External chat calls increment the same usage counter after success.

2. **Cleaner user-facing limit messages**
   - Brand image/logo/strategy/calendar/content limit errors now show:
     `We could not generate content. Please upgrade your plan.`
   - Website limit errors show:
     `Please select a website from templates — you ran out of generations.`
   - The old detailed “Monthly generation limit of 5 reached…” message is no longer surfaced inside the generate UI.

3. **Website limit UI fixed**
   - The generate page pre-checks quota before switching the preview into website/template mode.
   - When users are out of generations, it does not dump the template selector in a broken way.

4. **Brand image limit UI fixed**
   - The generate page pre-checks quota before showing placeholder brand image cards.
   - `/api/generate-graphics/start` also checks quota to avoid creating pending rows after the user is already over limit.

5. **User Settings updated**
   - Added editable email field.
   - Removed Bio field from settings UI.
   - Account tab now shows used generations, limit, and period.

6. **Admin per-user generation controls improved**
   - Existing per-user daily/monthly/yearly limit editor now supports quick increase and decrease.
   - Added quick Set 5, Set 25, and Unlimited buttons.
   - Reset usage now resets daily and monthly counters.

7. **Support messages in Admin**
   - Settings → Help submissions already create admin notifications.
   - Public Contact form now also creates admin-visible support notifications.
   - Admin → Notifications now includes a Support Messages section.

8. **Admin panel scrollability**
   - Admin tab bar now uses visible horizontal scrolling instead of hiding overflow controls.
   - Root admin wrapper no longer clips vertical content accidentally.

9. **Logo preview tap**
   - Generated logo images can be tapped/clicked to open a full-screen preview.

## Touched files

- `src/app/api/chat/messages/route.ts`
- `src/app/api/generate-graphics/start/route.ts`
- `src/app/(app)/generate/page.tsx`
- `src/app/(app)/settings/page.tsx`
- `src/app/api/user/profile/route.ts`
- `src/app/api/contact/route.ts`
- `src/app/api/admin/user/route.ts`
- `src/app/admin/page.tsx`

## Validation

Changed TS/TSX files were syntax-checked using TypeScript `transpileModule`.
