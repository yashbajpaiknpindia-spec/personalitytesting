-- Make templateId nullable on Generation table so logo/brand-image generations
-- can be tracked even when no matching template record exists in the database.
ALTER TABLE "Generation" ALTER COLUMN "templateId" DROP NOT NULL;
