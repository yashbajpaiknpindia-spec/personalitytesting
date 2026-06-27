-- Store the original user prompt/brief used to create AI-generated or template-picked websites.
ALTER TABLE "user_websites"
  ADD COLUMN IF NOT EXISTS "prompt" TEXT;
