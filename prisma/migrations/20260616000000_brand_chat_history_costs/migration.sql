-- Brand Chat: user-visible conversation history and cost tracking
CREATE TABLE IF NOT EXISTS "chat_threads" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'New chat',
  "mode" TEXT NOT NULL DEFAULT 'brand_studio',
  "totalCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalCostInr" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "messageCount" INTEGER NOT NULL DEFAULT 0,
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "userId" TEXT,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "provider" TEXT,
  "model" TEXT,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "totalTokens" INTEGER,
  "costUsd" DOUBLE PRECISION,
  "costInr" DOUBLE PRECISION,
  "usedExternalApi" BOOLEAN NOT NULL DEFAULT false,
  "confidence" DOUBLE PRECISION,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chat_threads_userId_idx" ON "chat_threads"("userId");
CREATE INDEX IF NOT EXISTS "chat_threads_lastMessageAt_idx" ON "chat_threads"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "chat_messages_threadId_idx" ON "chat_messages"("threadId");
CREATE INDEX IF NOT EXISTS "chat_messages_userId_idx" ON "chat_messages"("userId");
CREATE INDEX IF NOT EXISTS "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

DO $$ BEGIN
  ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
