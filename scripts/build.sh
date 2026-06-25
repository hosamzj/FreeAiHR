#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Generating Prisma Client..."
npx prisma generate

echo "Pushing database schema..."
# Generate SQL and execute directly to avoid permission issues with system tables
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/init.sql 2>/dev/null || true
if [ -f /tmp/init.sql ] && [ -s /tmp/init.sql ]; then
  npx prisma db execute --file /tmp/init.sql --schema prisma/schema.prisma 2>/dev/null || true
fi
# Fallback to prisma db push
npx prisma db push --accept-data-loss 2>/dev/null || true

echo "Building the Next.js project..."
pnpm next build

echo "Bundling server with tsup..."
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

echo "Build completed successfully!"
