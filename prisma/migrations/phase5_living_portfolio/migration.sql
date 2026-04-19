-- Phase 5: Living Portfolio
-- Adds projects, seo_settings, blog_posts tables
-- Run after phase4_slide_builder migration

-- ─────────────────────────────────────────────────────────────────────────
-- Projects CMS
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "projects" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "url"         TEXT,
  "imageUrl"    TEXT,
  "tags"        TEXT[]        DEFAULT ARRAY[]::TEXT[],
  "featured"    BOOLEAN       NOT NULL DEFAULT false,
  "order"       INTEGER       NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "projects_userId_idx"   ON "projects"("userId");
CREATE INDEX "projects_featured_idx" ON "projects"("userId", "featured");
CREATE INDEX "projects_order_idx"    ON "projects"("userId", "order");

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- SEO Settings (one per user, linked to their portfolio)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "seo_settings" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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

CREATE UNIQUE INDEX "seo_settings_userId_key" ON "seo_settings"("userId");

ALTER TABLE "seo_settings"
  ADD CONSTRAINT "seo_settings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- Blog Posts
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "blog_posts" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"          TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "slug"            TEXT NOT NULL,
  "excerpt"         TEXT,
  "content"         TEXT NOT NULL DEFAULT '',
  "coverImageUrl"   TEXT,
  "tags"            TEXT[]   DEFAULT ARRAY[]::TEXT[],
  "published"       BOOLEAN  NOT NULL DEFAULT false,
  "publishedAt"     TIMESTAMP(3),
  "seoTitle"        TEXT,
  "seoDescription"  TEXT,
  "readingMinutes"  INTEGER  DEFAULT 1,
  "viewCount"       INTEGER  NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "blog_posts_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "blog_posts_slug_unique" UNIQUE ("userId", "slug")
);

CREATE INDEX "blog_posts_userId_idx"     ON "blog_posts"("userId");
CREATE INDEX "blog_posts_published_idx"  ON "blog_posts"("userId", "published");
CREATE INDEX "blog_posts_publishedAt_idx" ON "blog_posts"("publishedAt" DESC);

ALTER TABLE "blog_posts"
  ADD CONSTRAINT "blog_posts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
