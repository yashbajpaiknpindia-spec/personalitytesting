-- CreateTable: page_visits for user analytics tracking
CREATE TABLE IF NOT EXISTS "page_visits" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "page"       TEXT NOT NULL,
    "durationMs" INTEGER,
    "sessionId"  TEXT,
    "userAgent"  TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "page_visits_userId_idx"    ON "page_visits"("userId");
CREATE INDEX IF NOT EXISTS "page_visits_page_idx"      ON "page_visits"("page");
CREATE INDEX IF NOT EXISTS "page_visits_createdAt_idx" ON "page_visits"("createdAt");
