#!/bin/sh
# ============================================
# ETEX Game — Docker Entrypoint for Backend
# ============================================
# Runs Prisma migrations, seeds the DB if empty,
# then starts the application server.

set -e

echo "⏳ Waiting for database to be ready..."
# Simple retry loop (npx prisma will fail if DB isn't ready)
MAX_RETRIES=30
RETRY=0
until npx prisma db push --skip-generate; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "❌ Database not reachable after $MAX_RETRIES retries. Exiting."
    exit 1
  fi
  echo "  Retry $RETRY/$MAX_RETRIES — waiting 2s..."
  sleep 2
done
echo "✅ Database schema synced."

# Seed only if the User table is empty (first run)
USER_COUNT=$(npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.user.count().then(c => { console.log(c); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "🌱 Seeding database (first run)..."
  npx tsx prisma/seed.ts
  npx tsx prisma/seed-settings.ts 2>/dev/null || true
  echo "✅ Seed complete."
else
  echo "ℹ️  Database already seeded ($USER_COUNT users). Skipping."
fi

echo "🚀 Starting backend server..."
exec npx tsx src/index.ts
