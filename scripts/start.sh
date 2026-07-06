#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# Set PORT from DEPLOY_RUN_PORT if available
PORT="${DEPLOY_RUN_PORT:-5000}"
export PORT

echo "Starting production server on port $PORT..."
echo "DATABASE_URL: ${DATABASE_URL:0:60}..."

# Determine the standalone project directory
STANDALONE_DIR="dist"
if [ -d "dist/workspace/projects" ]; then
    STANDALONE_DIR="dist/workspace/projects"
fi

# Push database schema to ensure tables exist
echo "Pushing database schema..."
cd "${COZE_WORKSPACE_PATH}"
npx prisma db push --skip-generate --accept-data-loss 2>&1 || echo "Warning: prisma db push failed, tables may already exist"

echo "Starting standalone server from ${STANDALONE_DIR}/server.js..."
cd "${COZE_WORKSPACE_PATH}"
exec node "${STANDALONE_DIR}/server.js"
