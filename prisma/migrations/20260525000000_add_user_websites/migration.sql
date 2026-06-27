-- CreateTable
-- Idempotent because scripts/fix-migrations.mjs can self-heal this table before
-- Prisma reaches this migration on recovered/baselined databases.
CREATE TABLE IF NOT EXISTS "user_websites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateId" TEXT,
    "templateLabel" TEXT,
    "htmlContent" TEXT NOT NULL,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT,
    "customDomain" TEXT,
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "adminNote" TEXT,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "generationId" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_websites_pkey" PRIMARY KEY ("id")
);

-- Ensure columns exist if the table already existed from an older partial/self-healed run.
ALTER TABLE "user_websites"
  ADD COLUMN IF NOT EXISTS "visitCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "generationId" TEXT,
  ADD COLUMN IF NOT EXISTS "metaTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_websites_slug_key" ON "user_websites"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "user_websites_customDomain_key" ON "user_websites"("customDomain");
CREATE INDEX IF NOT EXISTS "user_websites_userId_idx" ON "user_websites"("userId");
CREATE INDEX IF NOT EXISTS "user_websites_slug_idx" ON "user_websites"("slug");
CREATE INDEX IF NOT EXISTS "user_websites_createdAt_idx" ON "user_websites"("createdAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "user_websites" ADD CONSTRAINT "user_websites_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
