-- AlterTable: add websiteTheme column to portfolios
ALTER TABLE "portfolios" ADD COLUMN "websiteTheme" TEXT NOT NULL DEFAULT 'the-manifesto';
