-- AddField: posterEditLimit to admin_settings
-- Adds admin-configurable limit on how many AI edits a user can make per poster/image.

ALTER TABLE "admin_settings"
ADD COLUMN IF NOT EXISTS "posterEditLimit" INTEGER NOT NULL DEFAULT 2;
