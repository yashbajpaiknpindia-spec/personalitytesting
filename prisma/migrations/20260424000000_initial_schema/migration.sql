-- ============================================================
-- Complete initial schema.
-- Every table is created in its FINAL state so incremental
-- migrations that are already marked "applied" don't leave
-- columns missing.  All DDL is idempotent (IF NOT EXISTS /
-- DO $$ EXCEPTION duplicate_object) so re-running is safe.
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE "Plan" AS ENUM ('FREE','PRO','TEAM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('USER','ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "ExportFormat" AS ENUM ('PDF','PPTX','HTML','VCARD','QR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "GenStatus" AS ENUM ('PENDING','COMPLETE','FAILED','FLAGGED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "EventType" AS ENUM ('PORTFOLIO_VIEW','CARD_VIEW','RESUME_DOWNLOAD','PRESENTATION_VIEW','LEAD_CAPTURED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── User ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "User" (
    "id"              TEXT NOT NULL,
    "email"           TEXT,
    "phone"           TEXT,
    "password"        TEXT,
    "name"            TEXT,
    "username"        TEXT,
    "image"           TEXT,
    "role"            "Role"    NOT NULL DEFAULT 'USER',
    "plan"            "Plan"    NOT NULL DEFAULT 'FREE',
    "jobTitle"        TEXT,
    "company"         TEXT,
    "location"        TEXT,
    "website"         TEXT,
    "linkedin"        TEXT,
    "bio"             TEXT,
    "accentColor"     TEXT      DEFAULT '#C9A84C',
    "usageCount"      INTEGER   NOT NULL DEFAULT 0,
    "usageResetAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyGenLimit"   INTEGER,
    "monthlyGenLimit" INTEGER,
    "yearlyGenLimit"  INTEGER,
    "isSuspended"     BOOLEAN   NOT NULL DEFAULT false,
    "suspendReason"   TEXT,
    "razorpayId"      TEXT,
    "razorpaySubId"   TEXT,
    "onboarded"       BOOLEAN   NOT NULL DEFAULT false,
    "referralCode"    TEXT,
    "referredBy"      TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"        ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key"        ON "User"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key"     ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_razorpayId_key"   ON "User"("razorpayId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

-- Ensure email/phone nullable even if table pre-existed with NOT NULL email
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN "phone" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Template ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Template" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "category"    TEXT NOT NULL,
    "tier"        TEXT NOT NULL,
    "description" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#C9A84C',
    "preview"     TEXT,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Template_slug_key" ON "Template"("slug");

-- ── Generation ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Generation" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "templateId"   TEXT NOT NULL,
    "status"       "GenStatus" NOT NULL DEFAULT 'PENDING',
    "inputData"    JSONB NOT NULL,
    "enrichedData" JSONB,
    "outputData"   JSONB,
    "tokenCount"   INTEGER,
    "inputTokens"  INTEGER,
    "outputTokens" INTEGER,
    "modelUsed"    TEXT,
    "costUsd"      DOUBLE PRECISION,
    "flagReason"   TEXT,
    "version"      INTEGER NOT NULL DEFAULT 1,
    "parentId"     TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Generation" ADD CONSTRAINT "Generation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Generation" ADD CONSTRAINT "Generation_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Export ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Export" (
    "id"            TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "generationId"  TEXT NOT NULL,
    "format"        "ExportFormat" NOT NULL,
    "cloudinaryId"  TEXT,
    "url"           TEXT,
    "expiresAt"     TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Export" ADD CONSTRAINT "Export_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Export" ADD CONSTRAINT "Export_generationId_fkey"
    FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── portfolios ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "portfolios" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "generationId"   TEXT NOT NULL,
    "slug"           TEXT NOT NULL,
    "isPublished"    BOOLEAN NOT NULL DEFAULT true,
    "customDomain"   TEXT,
    "websiteTheme"   TEXT DEFAULT 'the-manifesto',
    "seoTitle"       TEXT,
    "seoDescription" TEXT,
    "ogImageUrl"     TEXT,
    "googleAnalyticsId"    TEXT,
    "gscVerificationToken" TEXT,
    "viewCount"      INTEGER NOT NULL DEFAULT 0,
    "publishedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- Ensure columns exist even if table pre-existed without them
DO $$ BEGIN ALTER TABLE "portfolios" ADD COLUMN "websiteTheme"   TEXT DEFAULT 'the-manifesto'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "portfolios" ADD COLUMN "googleAnalyticsId"    TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "portfolios" ADD COLUMN "gscVerificationToken" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "portfolios_userId_key"       ON "portfolios"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "portfolios_generationId_key" ON "portfolios"("generationId");
CREATE UNIQUE INDEX IF NOT EXISTS "portfolios_slug_key"         ON "portfolios"("slug");

DO $$ BEGIN
  ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_generationId_fkey"
    FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Contact ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Contact" (
    "id"         TEXT NOT NULL,
    "ownerId"    TEXT NOT NULL,
    "name"       TEXT NOT NULL,
    "email"      TEXT NOT NULL,
    "phone"      TEXT,
    "company"    TEXT,
    "sourceSlug" TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── CardView ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CardView" (
    "id"        TEXT NOT NULL,
    "ownerId"   TEXT NOT NULL,
    "visitorIp" TEXT,
    "userAgent" TEXT,
    "referer"   TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardView_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "CardView" ADD CONSTRAINT "CardView_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── analytics_events ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id"        TEXT NOT NULL,
    "ownerId"   TEXT NOT NULL,
    "type"      "EventType" NOT NULL,
    "metadata"  JSONB,
    "visitorIp" TEXT,
    "userAgent" TEXT,
    "referer"   TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── SocialLinks ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SocialLinks" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "linkedin"  TEXT,
    "whatsapp"  TEXT,
    "instagram" TEXT,
    "website"   TEXT,
    "portfolio" TEXT,
    "twitter"   TEXT,
    "github"    TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialLinks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SocialLinks_userId_key" ON "SocialLinks"("userId");

DO $$ BEGIN
  ALTER TABLE "SocialLinks" ADD CONSTRAINT "SocialLinks_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Domain ───────────────────────────────────────────────────────────────
-- Owned by 20260425000000_add_domain_table but included here so a fresh DB
-- gets it even if that migration is already marked applied.

CREATE TABLE IF NOT EXISTS "Domain" (
    "id"                TEXT NOT NULL,
    "userId"            TEXT NOT NULL,
    "domain"            TEXT NOT NULL,
    "verified"          BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT NOT NULL,
    "cnameTarget"       TEXT NOT NULL DEFAULT 'cname.brandsyndicate.co',
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Domain_userId_key" ON "Domain"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Domain_domain_key" ON "Domain"("domain");

DO $$ BEGIN
  ALTER TABLE "Domain" ADD CONSTRAINT "Domain_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── projects ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "projects" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "url"         TEXT,
    "imageUrl"    TEXT,
    "tags"        TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured"    BOOLEAN NOT NULL DEFAULT false,
    "order"       INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "projects_userId_idx"          ON "projects"("userId");
CREATE INDEX IF NOT EXISTS "projects_userId_featured_idx" ON "projects"("userId", "featured");
CREATE INDEX IF NOT EXISTS "projects_userId_order_idx"    ON "projects"("userId", "order");

DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── seo_settings ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "seo_settings" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "pageTitle"       TEXT,
    "metaDescription" TEXT,
    "ogImageUrl"      TEXT,
    "twitterHandle"   TEXT,
    "canonicalUrl"    TEXT,
    "noIndex"         BOOLEAN NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seo_settings_userId_key" ON "seo_settings"("userId");

DO $$ BEGIN
  ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── blog_posts ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "title"          TEXT NOT NULL,
    "slug"           TEXT NOT NULL,
    "excerpt"        TEXT,
    "content"        TEXT NOT NULL DEFAULT '',
    "coverImageUrl"  TEXT,
    "tags"           TEXT[] DEFAULT ARRAY[]::TEXT[],
    "published"      BOOLEAN NOT NULL DEFAULT false,
    "publishedAt"    TIMESTAMP(3),
    "seoTitle"       TEXT,
    "seoDescription" TEXT,
    "readingMinutes" INTEGER DEFAULT 1,
    "viewCount"      INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_userId_slug_key" ON "blog_posts"("userId", "slug");
CREATE INDEX        IF NOT EXISTS "blog_posts_userId_idx"      ON "blog_posts"("userId");
CREATE INDEX        IF NOT EXISTS "blog_posts_published_idx"   ON "blog_posts"("userId", "published");
CREATE INDEX        IF NOT EXISTS "blog_posts_publishedAt_idx" ON "blog_posts"("publishedAt" DESC);

DO $$ BEGIN
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── presentations ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "presentations" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "title"       TEXT NOT NULL DEFAULT 'Untitled Presentation',
    "slug"        TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT '#C9A84C',
    "meta"        JSONB,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "presentations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "presentations_slug_key"   ON "presentations"("slug");
CREATE INDEX        IF NOT EXISTS "presentations_userId_idx" ON "presentations"("userId");

DO $$ BEGIN
  ALTER TABLE "presentations" ADD CONSTRAINT "presentations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── slides ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "slides" (
    "id"             TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "order"          INTEGER NOT NULL DEFAULT 0,
    "content"        JSONB NOT NULL DEFAULT '{}',
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "slides_presentationId_idx"       ON "slides"("presentationId");
CREATE INDEX IF NOT EXISTS "slides_presentationId_order_idx" ON "slides"("presentationId", "order");

DO $$ BEGIN
  ALTER TABLE "slides" ADD CONSTRAINT "slides_presentationId_fkey"
    FOREIGN KEY ("presentationId") REFERENCES "presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── ResumeVersion ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ResumeVersion" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "originalResume" JSONB NOT NULL,
    "tailoredResume" JSONB,
    "jobDescription" TEXT,
    "coverLetter"    TEXT,
    "atsScore"       INTEGER,
    "atsBreakdown"   JSONB,
    "atsSuggestions" JSONB,
    "tone"           TEXT DEFAULT 'professional',
    "label"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ResumeVersion_userId_idx"    ON "ResumeVersion"("userId");
CREATE INDEX IF NOT EXISTS "ResumeVersion_createdAt_idx" ON "ResumeVersion"("createdAt" DESC);

DO $$ BEGIN
  ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── api_call_logs ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "api_call_logs" (
    "id"           TEXT NOT NULL,
    "service"      TEXT NOT NULL,
    "userId"       TEXT,
    "endpoint"     TEXT,
    "model"        TEXT,
    "inputTokens"  INTEGER,
    "outputTokens" INTEGER,
    "totalTokens"  INTEGER,
    "costUsd"      DOUBLE PRECISION,
    "costInr"      DOUBLE PRECISION,
    "query"        TEXT,
    "success"      BOOLEAN NOT NULL DEFAULT true,
    "cached"       BOOLEAN NOT NULL DEFAULT false,
    "generationId" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_call_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "api_call_logs_service_idx"           ON "api_call_logs"("service");
CREATE INDEX IF NOT EXISTS "api_call_logs_userId_idx"            ON "api_call_logs"("userId");
CREATE INDEX IF NOT EXISTS "api_call_logs_createdAt_idx"         ON "api_call_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "api_call_logs_service_createdAt_idx" ON "api_call_logs"("service", "createdAt");

DO $$ BEGIN
  ALTER TABLE "api_call_logs" ADD CONSTRAINT "api_call_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── admin_settings ───────────────────────────────────────────────────────
-- Full schema including gen-limit columns (owned by 20260425000002_admin_gen_limits).
-- The ALTER TABLE fallbacks below add them if the table pre-existed without them.

CREATE TABLE IF NOT EXISTS "admin_settings" (
    "id"               TEXT             NOT NULL DEFAULT 'singleton',
    "usdToInr"         DOUBLE PRECISION NOT NULL DEFAULT 84.0,
    "updatedAt"        TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freeDailyLimit"   INTEGER                   DEFAULT 3,
    "freeWeeklyLimit"  INTEGER,
    "freeMonthlyLimit" INTEGER                   DEFAULT 30,
    "proDailyLimit"    INTEGER,
    "proWeeklyLimit"   INTEGER,
    "proMonthlyLimit"  INTEGER,
    "teamDailyLimit"   INTEGER,
    "teamWeeklyLimit"  INTEGER,
    "teamMonthlyLimit" INTEGER,
    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- Ensure gen-limit columns exist even if table pre-existed without them
DO $$ BEGIN ALTER TABLE "admin_settings" ADD COLUMN "freeDailyLimit"   INTEGER DEFAULT 3;  EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "admin_settings" ADD COLUMN "freeWeeklyLimit"  INTEGER;             EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "admin_settings" ADD COLUMN "freeMonthlyLimit" INTEGER DEFAULT 30; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "admin_settings" ADD COLUMN "proDailyLimit"    INTEGER;             EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "admin_settings" ADD COLUMN "proWeeklyLimit"   INTEGER;             EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "admin_settings" ADD COLUMN "proMonthlyLimit"  INTEGER;             EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "admin_settings" ADD COLUMN "teamDailyLimit"   INTEGER;             EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "admin_settings" ADD COLUMN "teamWeeklyLimit"  INTEGER;             EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "admin_settings" ADD COLUMN "teamMonthlyLimit" INTEGER;             EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── notifications ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "notifications" (
    "id"           TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "body"         TEXT NOT NULL,
    "imageUrl"     TEXT,
    "type"         TEXT NOT NULL DEFAULT 'broadcast',
    "targetUserId" TEXT,
    "sentBy"       TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification_reads" (
    "id"             TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "readAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_reads_notificationId_userId_key"
    ON "notification_reads"("notificationId", "userId");
CREATE INDEX IF NOT EXISTS "notification_reads_userId_idx"
    ON "notification_reads"("userId");

DO $$ BEGIN
  ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notificationId_fkey"
    FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── page_visits ──────────────────────────────────────────────────────────
-- Owned by 20260425000003_add_page_visits / 20260426000000_pagevisit_optional_userid
-- but included here (nullable userId, with FK) to cover fresh DB deploys.

CREATE TABLE IF NOT EXISTS "page_visits" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT,
    "page"      TEXT NOT NULL,
    "durationMs" INTEGER,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "page_visits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "page_visits_userId_idx"    ON "page_visits"("userId");
CREATE INDEX IF NOT EXISTS "page_visits_page_idx"      ON "page_visits"("page");
CREATE INDEX IF NOT EXISTS "page_visits_createdAt_idx" ON "page_visits"("createdAt");

DO $$ BEGIN
  ALTER TABLE "page_visits" ADD CONSTRAINT "page_visits_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── pricing_plans ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "pricing_plans" (
    "id"        TEXT NOT NULL,
    "planId"    TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "price"     TEXT NOT NULL,
    "period"    TEXT NOT NULL DEFAULT '/month',
    "features"  TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pricing_plans_planId_key" ON "pricing_plans"("planId");
