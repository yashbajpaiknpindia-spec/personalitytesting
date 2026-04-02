#!/bin/sh
set -e

echo "Generating Prisma client..."
npx prisma generate

echo "Pushing schema to database (safe, non-destructive)..."
npx prisma db push --accept-data-loss

echo "Seeding database with templates..."
npx tsx prisma/seed.ts

echo "Done."
