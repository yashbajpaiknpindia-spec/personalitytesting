# Password Reset + Onboarding Notifications Fix

Applied changes:

1. Forgot password now accepts only a valid 10-digit Indian mobile number.
   - Client input is limited to 10 digits.
   - Server validation requires exactly 10 digits starting from 6–9.
   - Server checks that the number exists in the database.

2. Forgot password no longer lets users directly set a new password from only a phone number.
   - It sends a secure reset link to the email linked with that phone account.
   - Reset links expire after 30 minutes.
   - Reset links become invalid after the password is changed.

3. No linked email handling.
   - If the phone account has no email, the user sees:
     "We can't reset this account password because no email is linked with it. Please contact our support immediately."
   - The page provides a direct Contact Support link.

4. Added a dedicated /reset-password page.
   - Users open the emailed link and set their new password there.
   - Password requires at least 8 characters.

5. Added classy automated in-app notifications on signup.
   - Welcome notification.
   - Email setup reminder notification.

6. Email sender.
   - Password reset email uses the existing Resend mail system.
   - Default sender is brandsyndicateindia@gmail.com.
   - For production, keep RESEND_API_KEY configured and optionally set RESEND_FROM_EMAIL=brandsyndicateindia@gmail.com if your mail provider allows it.

Files changed:
- src/app/(auth)/forgot-password/page.tsx
- src/app/reset-password/page.tsx
- src/app/api/auth/request-password-reset/route.ts
- src/app/api/auth/reset-password/route.ts
- src/app/api/auth/register/route.ts
- src/lib/auth/password-reset.ts
- src/lib/email/index.ts
