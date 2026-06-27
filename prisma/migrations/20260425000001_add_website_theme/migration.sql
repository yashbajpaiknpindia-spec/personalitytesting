-- AlterTable: add websiteTheme column to portfolios
-- Safe to re-run because initial_schema/self-healing may already have added it.
ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "websiteTheme" TEXT DEFAULT 'the-manifesto';
