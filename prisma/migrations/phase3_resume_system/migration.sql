-- Phase 3: Resume Intelligence System
-- Adds resume_versions table for tailoring, ATS scoring, and cover letter history
-- Run after phase1_and_phase2 migration

-- ─────────────────────────────────────────────────────────────────────────
-- Resume Versions (tailored + original snapshots)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "resume_versions" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"          TEXT NOT NULL,
  "originalResume"  JSONB NOT NULL,
  "tailoredResume"  JSONB,
  "jobDescription"  TEXT,
  "coverLetter"     TEXT,
  "atsScore"        INTEGER,
  "atsBreakdown"    JSONB,
  "atsSuggestions"  JSONB,
  "tone"            TEXT DEFAULT 'professional',
  "label"           TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resume_versions_userId_idx" ON "resume_versions"("userId");
CREATE INDEX "resume_versions_createdAt_idx" ON "resume_versions"("createdAt" DESC);

ALTER TABLE "resume_versions"
  ADD CONSTRAINT "resume_versions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
