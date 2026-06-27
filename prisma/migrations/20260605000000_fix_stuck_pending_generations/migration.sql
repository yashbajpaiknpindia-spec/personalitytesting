-- Fix stuck PENDING generations caused by the pre-v24 bug where:
-- 1. generation.update(FAILED) was fire-and-forget with .catch(() => {}) so 
--    failures were swallowed silently, leaving records stuck at PENDING.
-- 2. The OPENAI_API_KEY check returned early before Generation.create so 
--    key-missing failures were never recorded at all.
--
-- This migration marks any Generation record that has been PENDING for more than
-- 30 minutes as FAILED, since no valid generation should ever stay PENDING that long.
-- It only touches records with known genTypes (logo, brand-images, strategy, calendar)
-- to avoid interfering with any actively-running website streaming generations.

UPDATE "Generation"
SET "status" = 'FAILED'
WHERE "status" = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '30 minutes'
  AND (
    "enrichedData"->>'genType' IN ('logo', 'brand-images', 'strategy', 'calendar')
    OR (
      -- Also catch business-pack PENDING records that have no genType
      "enrichedData"->>'genType' IS NULL
      AND "createdAt" < NOW() - INTERVAL '2 hours'
    )
  );
