-- Phase 1 + Phase 2: Brand Platform, Lead Capture, Analytics, Social Links, Custom Domain
-- Run after existing 0_init migration

-- ─────────────────────────────────────────────────────────────────────────
-- Phase 1: Portfolio Publishing
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "portfolios" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"         TEXT NOT NULL,
  "generationId"   TEXT NOT NULL,
  "slug"           TEXT NOT NULL,
  "isPublished"    BOOLEAN NOT NULL DEFAULT true,
  "customDomain"   TEXT,
  "seoTitle"       TEXT,
  "seoDescription" TEXT,
  "ogImageUrl"     TEXT,
  "viewCount"      INTEGER NOT NULL DEFAULT 0,
  "publishedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "portfolios_slug_key"         ON "portfolios"("slug");
CREATE UNIQUE INDEX "portfolios_userId_key"        ON "portfolios"("userId");
CREATE UNIQUE INDEX "portfolios_generationId_key"  ON "portfolios"("generationId");
CREATE INDEX        "portfolios_userId_idx"        ON "portfolios"("userId");

ALTER TABLE "portfolios"
  ADD CONSTRAINT "portfolios_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portfolios"
  ADD CONSTRAINT "portfolios_generationId_fkey"
  FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- Phase 1: Lead Capture
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "contacts" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "ownerId"    TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "email"      TEXT NOT NULL,
  "phone"      TEXT,
  "company"    TEXT,
  "sourceSlug" TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contacts_ownerId_idx" ON "contacts"("ownerId");

ALTER TABLE "contacts"
  ADD CONSTRAINT "contacts_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "card_views" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "ownerId"   TEXT NOT NULL,
  "visitorIp" TEXT,
  "userAgent" TEXT,
  "referer"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "card_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "card_views_ownerId_idx" ON "card_views"("ownerId");

ALTER TABLE "card_views"
  ADD CONSTRAINT "card_views_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- Phase 1: Analytics Events
-- ─────────────────────────────────────────────────────────────────────────
CREATE TYPE "EventType" AS ENUM (
  'PORTFOLIO_VIEW',
  'CARD_VIEW',
  'RESUME_DOWNLOAD',
  'PRESENTATION_VIEW',
  'LEAD_CAPTURED'
);

CREATE TABLE "analytics_events" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "ownerId"   TEXT NOT NULL,
  "type"      "EventType" NOT NULL,
  "metadata"  JSONB,
  "visitorIp" TEXT,
  "userAgent" TEXT,
  "referer"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_ownerId_idx"    ON "analytics_events"("ownerId");
CREATE INDEX "analytics_events_type_idx"       ON "analytics_events"("type");
CREATE INDEX "analytics_events_createdAt_idx"  ON "analytics_events"("createdAt" DESC);

ALTER TABLE "analytics_events"
  ADD CONSTRAINT "analytics_events_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- Phase 2: Social Links
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "social_links" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
  CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "social_links_userId_key" ON "social_links"("userId");

ALTER TABLE "social_links"
  ADD CONSTRAINT "social_links_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- Phase 2: Custom Domains
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "domains" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"            TEXT NOT NULL,
  "domain"            TEXT NOT NULL,
  "verified"          BOOLEAN NOT NULL DEFAULT false,
  "verificationToken" TEXT NOT NULL,
  "cnameTarget"       TEXT NOT NULL DEFAULT 'cname.brandsyndicate.co',
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "domains_userId_key"  ON "domains"("userId");
CREATE UNIQUE INDEX "domains_domain_key"  ON "domains"("domain");

ALTER TABLE "domains"
  ADD CONSTRAINT "domains_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
