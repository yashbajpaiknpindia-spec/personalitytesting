-- Phase 4: Editable Slide Builder
-- Adds presentations + slides tables
-- Run after phase3_resume_system migration

-- ─────────────────────────────────────────────────────────────────────────
-- Presentations (one per user-created deck)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "presentations" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL,
  "title"       TEXT NOT NULL DEFAULT 'Untitled Presentation',
  "slug"        TEXT NOT NULL,
  "accentColor" TEXT NOT NULL DEFAULT '#C9A84C',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "presentations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "presentations_slug_key" ON "presentations"("slug");
CREATE INDEX "presentations_userId_idx" ON "presentations"("userId");

ALTER TABLE "presentations"
  ADD CONSTRAINT "presentations_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- Slides (ordered slides belonging to a presentation)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "slides" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "presentationId"   TEXT NOT NULL,
  "order"            INTEGER NOT NULL DEFAULT 0,
  "content"          JSONB NOT NULL DEFAULT '{}',
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "slides_presentationId_idx" ON "slides"("presentationId");
CREATE INDEX "slides_order_idx"          ON "slides"("presentationId", "order");

ALTER TABLE "slides"
  ADD CONSTRAINT "slides_presentationId_fkey"
  FOREIGN KEY ("presentationId") REFERENCES "presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
