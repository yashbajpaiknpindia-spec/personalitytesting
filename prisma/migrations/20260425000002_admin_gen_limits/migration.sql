-- Add global generation limits to admin_settings
ALTER TABLE "admin_settings"
  ADD COLUMN IF NOT EXISTS "freeDailyLimit"   INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "freeWeeklyLimit"  INTEGER,
  ADD COLUMN IF NOT EXISTS "freeMonthlyLimit" INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "proDailyLimit"    INTEGER,
  ADD COLUMN IF NOT EXISTS "proWeeklyLimit"   INTEGER,
  ADD COLUMN IF NOT EXISTS "proMonthlyLimit"  INTEGER,
  ADD COLUMN IF NOT EXISTS "teamDailyLimit"   INTEGER,
  ADD COLUMN IF NOT EXISTS "teamWeeklyLimit"  INTEGER,
  ADD COLUMN IF NOT EXISTS "teamMonthlyLimit" INTEGER;
