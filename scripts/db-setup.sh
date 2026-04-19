#!/bin/sh
set -e

echo "Generating Prisma client..."
npx prisma generate

echo "Detecting and resolving any stuck migrations..."
node scripts/fix-migrations.mjs

# Give the query engine time to fully release the DB connection
# before prisma migrate deploy opens its own connection.
sleep 3

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database with templates..."
npx tsx prisma/seed.ts

echo "Done."
