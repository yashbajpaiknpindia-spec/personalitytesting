-- CreateTable
-- This migration must be safe to run after 20260424000000_initial_schema,
-- because the initial schema also includes Domain for fresh/baselined databases.
CREATE TABLE IF NOT EXISTS "Domain" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT NOT NULL,
    "cnameTarget" TEXT NOT NULL DEFAULT 'cname.brandsyndicate.co',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Domain_userId_key" ON "Domain"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Domain_domain_key" ON "Domain"("domain");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Domain" ADD CONSTRAINT "Domain_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
