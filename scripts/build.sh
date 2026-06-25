#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel warn --reporter=append-only

echo "Generating Prisma Client..."
npx prisma generate

echo "Building the Next.js project with standalone output..."
NEXT_PRIVATE_TURBOPACK=0 pnpm next build

# Use the standalone build from .next/standalone
echo "Setting up standalone deployment..."
rm -rf dist
cp -r .next/standalone dist

# Copy static files to standalone
echo "Copying static files..."
cp -r .next/static dist/.next/static 2>/dev/null || true
cp -r public dist/public 2>/dev/null || true

# Copy Prisma schema and engines
echo "Copying Prisma files..."
mkdir -p dist/prisma
cp prisma/schema.prisma dist/prisma/ 2>/dev/null || true

# Copy .env.example if exists
if [ -f .env.example ]; then
    cp .env.example dist/.env.example
fi

echo "Build completed successfully!"
echo "Deployment directory: dist/"
ls -la dist/
