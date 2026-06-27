# Brand Syndicate Fix Report — My Work, Mobile Nav, Chips, Pricing

Applied on top of the full Razorpay checkout fixed app.

## Fixed

### 1. My Work generated-logo view bug
- Replaced the Brand Assets card `Preview` action with a real `View` modal inside My Work.
- The modal now renders saved generated content directly instead of relying only on the Generate page preview.
- Logo/image outputs saved as `imageDataUri`, `_logoImageUri`, `finalLogoUri`, `imageUrl`, `finalPosterUrl`, `previewImageUrl`, nested graphics arrays, or variation arrays are detected and displayed.
- Added full image open/download support and a full saved-data fallback.
- Updated the Generate page logo preview loader so older logo-only records using `imageDataUri` also appear correctly.

### 2. Logged-out Generate button visibility
- Changed logged-out homepage nav CTA from `Get Started` to `Generate Now`.
- Kept it visible on small mobile widths instead of hiding it under 380px.
- Mobile drawer signup CTA now says `Generate Now →`.

### 3. More chips loading below properly
- Added final mobile CSS overrides so `More` is not hidden by broad `nth-child` rules.
- On mobile, first important chips stay visible and the `More` panel expands below with all chip options in a clean grid.

### 4. Pricing mobile top spacing and typography
- Removed excess top spacing caused by stacked nav spacer + main padding + hero padding.
- Rebuilt pricing page styling with sharper Manrope/DM Sans typography matching the main page more closely.
- Plans now appear much sooner on mobile.
- Public nav drawer typography was sharpened.

### 5. Pricing names
- `AI Creator` renamed to `Creator`.
- `Unlimited Growth` renamed to `Growth Suite`.
- Billing defaults, Razorpay plan display names, footer labels, FAQ copy, and admin pricing defaults were updated.
- Existing DB pricing rows with old names self-heal to the new display names when `/api/admin/pricing` loads.

## Preserved
- All 1000 sample websites remain intact.
- Existing Razorpay plan IDs are preserved:
  - `AI_CREATOR_1000`
  - `BUSINESS_PRO_5000`
  - `UNLIMITED_GROWTH_10000`
- Existing mobile CSS/template fixes remain intact.
