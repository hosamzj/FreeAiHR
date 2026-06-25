#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel warn --reporter=append-only

echo "Generating Prisma Client for PostgreSQL..."
npx prisma generate

echo "Cleaning previous build artifacts..."
rm -rf .next dist

echo "Building the Next.js project with standalone output..."
NEXT_PRIVATE_TURBOPACK=0 pnpm next build

# Use the standalone build from .next/standalone
echo "Setting up standalone deployment..."
cp -r .next/standalone dist

# Determine the standalone project directory
# Next.js standalone preserves the workspace path structure
STANDALONE_DIR="dist"
if [ -d "dist/workspace/projects" ]; then
    STANDALONE_DIR="dist/workspace/projects"
    echo "Detected workspace structure: dist/workspace/projects"
fi

# Copy static files (CSS/JS bundles) to the correct location
echo "Copying static files to ${STANDALONE_DIR}/.next/static..."
mkdir -p "${STANDALONE_DIR}/.next"
cp -r .next/static "${STANDALONE_DIR}/.next/static"

# Copy public assets
echo "Copying public assets to ${STANDALONE_DIR}/public..."
mkdir -p "${STANDALONE_DIR}/public"
cp -r public/* "${STANDALONE_DIR}/public/" 2>/dev/null || true

# Copy Prisma schema
echo "Copying Prisma schema..."
mkdir -p "${STANDALONE_DIR}/prisma"
cp prisma/schema.prisma "${STANDALONE_DIR}/prisma/"

# Copy .env.example if exists
if [ -f .env.example ]; then
    cp .env.example dist/.env.example
fi

echo "Build completed successfully!"
echo "Standalone project dir: ${STANDALONE_DIR}"
ls -la "${STANDALONE_DIR}/"
echo "--- .next contents ---"
ls -la "${STANDALONE_DIR}/.next/" | head -10
