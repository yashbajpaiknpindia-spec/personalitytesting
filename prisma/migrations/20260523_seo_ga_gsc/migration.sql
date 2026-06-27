-- Add Google Analytics 4 tracking ID and Google Search Console verification token
-- to the portfolios table.
-- Wrapped in a DO block so it is a no-op on fresh databases where the table
-- is created by Prisma's own schema push (relation may not exist yet at this
-- point in the migration sequence).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'portfolios'
  ) THEN
    -- Add googleAnalyticsId if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'portfolios'
        AND column_name  = 'googleAnalyticsId'
    ) THEN
      ALTER TABLE "portfolios" ADD COLUMN "googleAnalyticsId" TEXT;
    END IF;

    -- Add gscVerificationToken if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'portfolios'
        AND column_name  = 'gscVerificationToken'
    ) THEN
      ALTER TABLE "portfolios" ADD COLUMN "gscVerificationToken" TEXT;
    END IF;
  END IF;
END $$;
