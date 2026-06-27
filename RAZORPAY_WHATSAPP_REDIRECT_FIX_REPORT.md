# Razorpay WhatsApp Redirect Fix

## Issue

Paid plan buttons were opening WhatsApp even when Razorpay environment variables were configured.

## Cause

The billing UI treated the current package plan IDs as WhatsApp/manual-sale plans:

- `AI_CREATOR_1000`
- `BUSINESS_PRO_5000`
- `UNLIMITED_GROWTH_10000`

The Razorpay order route also only accepted legacy ids `PRO` and `TEAM`, so the UI avoided Razorpay for the new package ids.

## Fix

- Paid billing buttons now call Razorpay checkout directly.
- Public pricing page paid CTAs now go to `/billing` instead of WhatsApp.
- Razorpay order API now accepts the current package ids.
- Razorpay verify API maps package ids back to the existing Prisma account plans: `PRO` or `TEAM`.
- WhatsApp remains only as a payment-support fallback link when an error appears.

## Required env vars

```env
RAZORPAY_KEY_ID=rzp_live_or_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

Webhook is still optional for basic checkout, but recommended for production.
