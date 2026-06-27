-- Add phone field to User, make email optional
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
