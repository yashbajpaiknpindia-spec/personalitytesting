# Brand Syndicate

**AI-powered personal branding studio.** Generate portfolios, resumes, business cards, and pitch decks in one prompt — powered by Claude AI.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL (Render managed) + Prisma ORM |
| Auth | NextAuth v5 — Google OAuth + magic-link email |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Billing | Stripe (subscription) |
| Storage | Cloudinary (72hr signed URLs) |
| Email | Resend (transactional + drip) |
| PDF | Puppeteer + @sparticuz/chromium |
| PPTX | pptxgenjs |
| QR | qrcode |
| Images | Pexels API |
| Deploy | Render (web service + managed PostgreSQL) |

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
# Fill in all values — see section below
```

### 3. Database

```bash
# Start a local Postgres instance (Docker example)
docker run -d -p 5432:5432 -e POSTGRES_DB=brandsyndicate -e POSTGRES_PASSWORD=dev postgres:16

# Run migrations
npm run db:migrate

# Seed 48 templates
npm run db:seed
```

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

All required variables are documented in `.env.example`. Here's what each service needs:

### Google OAuth
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret

### Anthropic
1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Set `ANTHROPIC_API_KEY`

### Stripe
1. Create account at [stripe.com](https://stripe.com)
2. Create two recurring products: **Pro** ($19/mo) and **Team** ($49/mo)
3. Copy price IDs to `STRIPE_PRO_PRICE_ID` and `STRIPE_TEAM_PRICE_ID`
4. For local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
5. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Cloudinary
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, API Secret from dashboard

### Resend
1. Create account at [resend.com](https://resend.com)
2. Verify your sending domain
3. Copy API key and set `RESEND_FROM_EMAIL` to a verified address

### Pexels
1. Get free API key at [pexels.com/api](https://www.pexels.com/api/)
2. Set `PEXELS_API_KEY`

---

## Deployment (Render)

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Create Render Web Service

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Render auto-detects `render.yaml` and provisions PostgreSQL
4. Click **Deploy**

### 3. Set environment variables

In Render Dashboard → Your Service → Environment, add all variables from `.env.example`.

`DATABASE_URL` is automatically set from the managed database.

### 4. Seed templates (first deploy only)

In Render Dashboard → Your Service → Shell:

```bash
npm run db:seed
```

### 5. Configure Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-app.onrender.com/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy signing secret → set `STRIPE_WEBHOOK_SECRET` in Render env vars

### 6. Configure Google OAuth redirect

In Google Cloud Console, add to Authorised Redirect URIs:
```
https://your-app.onrender.com/api/auth/callback/google
```

### 7. Create Render Cron Job (monthly usage reset)

1. Render Dashboard → New → Cron Job
2. Command: `curl -X POST https://your-app.onrender.com/api/cron/reset-usage -H "Authorization: Bearer $CRON_SECRET"`
3. Schedule: `0 0 1 * *` (midnight on the 1st of each month)

### 8. Test end-to-end

- Sign up → onboarding → generate → export → billing (use Stripe test card `4242 4242 4242 4242`)

---

## Project Structure

```
brand-syndicate/
├── prisma/
│   ├── schema.prisma        # Full data model
│   └── seed.ts              # 48 template seed
├── src/
│   ├── app/
│   │   ├── (auth)/login/    # Google OAuth + magic link
│   │   ├── (app)/
│   │   │   ├── generate/    # Main AI generation studio
│   │   │   ├── my-work/     # Generation history
│   │   │   ├── templates/   # 48-template gallery
│   │   │   ├── settings/    # Profile, account, danger
│   │   │   ├── billing/     # Plan comparison + Stripe
│   │   │   ├── analytics/   # Usage charts (Pro only)
│   │   │   ├── referrals/   # Referral program
│   │   │   └── onboarding/  # Multi-step wizard
│   │   ├── u/[username]/    # Public portfolio (no auth)
│   │   ├── admin/           # Admin panel (ADMIN role)
│   │   └── api/             # All API routes
│   └── lib/
│       ├── auth/            # NextAuth config
│       ├── ai/              # Claude API + Pexels cache
│       ├── qc/              # Input validation pipeline
│       ├── export/          # PDF, PPTX, QR, vCard
│       ├── storage/         # Cloudinary upload
│       ├── email/           # Resend templates
│       ├── stripe/          # Stripe client
│       └── rateLimit.ts     # IP + concurrency guards
└── render.yaml              # Infrastructure as code
```

---

## Key Features

- **AI Generation Pipeline**: QC validation → prompt enrichment → Claude API → structured JSON output
- **QC Pipeline**: Validates, sanitises, classifies tone/industry, estimates tokens, checks policy
- **Export Pipeline**: PDF (Puppeteer), PPTX (pptxgenjs with Pexels slide images), vCard (.vcf), QR code
- **Rate Limiting**: FREE plan 3/month, PRO/TEAM unlimited, max 5 concurrent per user
- **Watermarking**: FREE plan exports include "FREE PLAN" watermark on PDF
- **Public Portfolio**: `/u/[username]` — shareable, no auth required
- **Email Drip**: Welcome, week-1 check-in, limit-hit nudge, win-back, export-ready
- **Version History**: Generations are versioned; parentId chain tracks lineage
- **48 Templates**: 12 each for Portfolio, Resume, Card, Presentation — free + pro tiers

---

## Design System

| Token | Value |
|---|---|
| `--bg` | `#09090A` |
| `--surface` | `#111113` |
| `--surface2` | `#18181B` |
| `--gold` | `#C9A84C` |
| `--cream` | `#F0EAE0` |
| `--muted` | `#5C564E` |

Fonts: **Playfair Display** (headings) · **DM Sans** (body) · **DM Mono** (labels/mono)

---

## Making Someone an Admin

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Or via Prisma Studio:
```bash
npm run db:studio
```
