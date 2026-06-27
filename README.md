# Brand Syndicate

**Where AI meets human creativity.** A premium brand launch studio for startups, creators, and businesses — generating websites, logos, graphics, and brand strategy from a single prompt.

AI drafts the direction instantly. Our team refines and delivers the final product.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL (Render managed) + Prisma ORM 5.x |
| Auth | NextAuth v5 — Google OAuth + credentials |
| AI — Website & Strategy | Anthropic Claude (`claude-sonnet-4-20250514`) |
| AI — Logo & Graphics | OpenAI `gpt-image-1` (optional — degrades gracefully) |
| AI — Logo SVG concept | Anthropic Claude (`claude-haiku-4-5-20251001`) |
| Images | Pexels API (sector-matched photography) |
| Storage | Cloudinary (signed uploads + 72hr URLs) |
| Payments | Razorpay (INR, one-time kits) |
| Email | Resend (transactional) |
| PDF export | Puppeteer + @sparticuz/chromium |
| PPTX export | pptxgenjs |
| QR codes | qrcode |
| Deploy | Render (web service + managed PostgreSQL) |

---

## What Gets Generated

| Output | Model | Route |
|---|---|---|
| Website (streaming) | Claude Sonnet | `POST /api/generate-website/stream` |
| Business brand brief | Claude Haiku | `POST /api/generate-business` |
| Business strategy | Claude Sonnet | `POST /api/generate-strategy` |
| Content calendar | Claude Sonnet | `POST /api/generate-calendar` |
| Logo image | OpenAI gpt-image-1 | `POST /api/generate-logo-image` |
| Brand graphics | OpenAI gpt-image-1 | `POST /api/generate-graphics` |

> **Note:** Logo and Brand Images require `OPENAI_API_KEY`. Without it, the app shows a clear error message and all other generation routes continue working normally.

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/your-org/brand-syndicate.git
cd brand-syndicate
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
# Fill in all values — see Environment Variables section below
```

### 3. Database

```bash
# Start a local Postgres instance
docker run -d -p 5432:5432 \
  -e POSTGRES_DB=brandsyndicate \
  -e POSTGRES_PASSWORD=dev \
  postgres:16

# Apply migrations
npx prisma migrate deploy

# Seed 48 templates + admin account
npm run db:seed
```

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

### Required — Core

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth v5 secret (generate with `openssl rand -base64 32`) |
| `AUTH_URL` | Full deploy URL, no trailing slash (e.g. `https://www.brandsyndicate.in`) |
| `NEXTAUTH_SECRET` | Same value as `AUTH_SECRET` (v4 compat alias) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (used in og tags, sitemaps, QR codes) |

### Required — AI

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Powers website generation, strategy, calendar, logo SVG concept |
| `OPENAI_API_KEY` | Powers logo image rendering and brand graphics via gpt-image-1. **Optional** — app functions without it but logo/image tabs will show an error. |

### Required — Payments

| Variable | Description |
|---|---|
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret |

### Required — Storage

| Variable | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (server-side) |
| `CLOUDINARY_API_KEY` | Cloudinary API key (server-side) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (server-side) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Same value (client-side, for DigitalCardPanel uploads) |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Same value (client-side) |
| `NEXT_PUBLIC_CLOUDINARY_PRESET` | Cloudinary unsigned upload preset name |

### Required — Email

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `RESEND_FROM_EMAIL` | Verified sender address (e.g. `noreply@brandsyndicate.in`) |

### Optional

| Variable | Default | Description |
|---|---|---|
| `PEXELS_API_KEY` | — | Pexels API for sector-matched photography in website generation. Without it, CSS gradients are used instead. |
| `CRON_SECRET` | — | Bearer token for `/api/cron/reset-usage` (set in Render cron job) |
| `ADMIN_PHONE` | `917897671348` | Phone number used for admin account seeding |
| `ADMIN_PASSWORD` | — | Admin panel password |
| `CONTACT_EMAIL` | `brandsyndicateindia@gmail.com` | Where contact form emails are sent |
| `CNAME_TARGET` | `cname.brandsyndicate.in` | CNAME target for custom domain connections |
| `CHROMIUM_EXECUTABLE_PATH` | — | Path to Chromium binary for PDF export (set automatically on Render) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | — | Google service account for Sheets lead export |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | — | Google service account private key (JSON escaped) |

---

## Admin Panel

Access at `/admin` with the phone number and password set via seed + `ADMIN_PASSWORD`.

Features: cost tracking by model/mode, user management, website moderation, push notifications, live INR/USD rate, page analytics.

---

## Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply pending migrations (production)
npx prisma migrate deploy

# Reset and reseed (dev only)
npx prisma migrate reset
npm run db:seed
```

The app includes a self-healing migration script (`fix-migrations`) that runs on every Render deploy, ensuring any missing columns are added even if a migration is skipped.

---

## Deployment (Render)

1. Push to GitHub
2. Connect repo in Render → New Web Service
3. Set all environment variables in the Render dashboard
4. `render.yaml` handles build command, start command, and database provisioning automatically

Render build command: `node scripts/fix-migrations.js && npx prisma migrate deploy && npm run build`
Render start command: `npm start`

---

## Key Routes

| Route | Description |
|---|---|
| `/` | Public homepage with live iframe template previews |
| `/generate` | Main generation studio (Website, Logo, Images, Strategy, Calendar) |
| `/my-work` | User's saved generations and brand assets |
| `/my-websites` | User's saved generated websites |
| `/templates` | 48 sample templates with live preview |
| `/pricing` | Plan comparison (Free, Startup Launch ₹5k, Growth Kit ₹10k) |
| `/about`, `/contact`, `/faq` | Public pages |
| `/admin` | Admin dashboard |
| `/p/[username]` | Public portfolio pages |
| `/w/[slug]` | Published user websites |

---

## Contact

Email: brandsyndicateindia@gmail.com  
WhatsApp: +91 78976 71348  
Built in India 🇮🇳
