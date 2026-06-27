-- AddColumn: daily usage tracking on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyUsageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyUsageDate" TEXT NOT NULL DEFAULT '';

-- AddColumn: master generation limit on AdminSettings
ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "globalGenLimit" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "globalLimitPeriod" TEXT NOT NULL DEFAULT 'daily';
