# Admin analytics, uploads, limits and footer links fix

## Applied fixes

- Analytics now tracks logged-in users from the global app provider, not only inside the app shell.
- Admin analytics now shows signup count and visit-to-signup rate for the selected range.
- Active user and recent visit tables now include better user identity fields: name, email, phone, plan and location when available.
- Page visit API now updates last known location more aggressively and supports more proxy/edge IP/city headers.
- Admin user limit modal now has quick buttons to add +25, +100, +500 monthly generations and an Unlimited shortcut.
- Articles can now upload cover images directly from the admin panel.
- Notifications can now upload images directly from the admin panel.
- Added `/api/admin/upload-image` for admin-only image uploads. It uses Cloudinary when configured and falls back to small data URLs.
- Footer social links were reduced to only Instagram, Facebook and WhatsApp.
- Homepage footer also now only shows Instagram, Facebook and WhatsApp.
- API routes now get no-index/no-cache/security headers and production source maps are disabled.

## Important note about hiding API endpoints

Browser-called API routes cannot be truly hidden from the Network tab. The safe fix is to protect those endpoints with authentication, admin checks, rate limits and server-side secrets. This update removes source maps, adds API security headers, avoids exposing secrets, and keeps admin routes gated. Public frontend requests can still be seen by a browser because that is how web apps work.

## Environment note for upload

For persistent uploaded article/notification images, configure Cloudinary:

- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

Without Cloudinary, small images under 900KB can still be stored as data URLs as a fallback.
