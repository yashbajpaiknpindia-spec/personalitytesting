-- Make userId nullable on page_visits so guest tracking and analytics work correctly.
-- Also adds a proper foreign key to users with ON DELETE SET NULL.

-- Step 1: Drop any existing NOT NULL constraint by altering the column
ALTER TABLE "page_visits"
  ALTER COLUMN "userId" DROP NOT NULL;

-- Step 2: Add foreign key constraint (only if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'page_visits_userId_fkey'
  ) THEN
    ALTER TABLE "page_visits"
      ADD CONSTRAINT "page_visits_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
