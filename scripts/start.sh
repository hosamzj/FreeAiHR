#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# Set PORT from DEPLOY_RUN_PORT if available
PORT="${DEPLOY_RUN_PORT:-5000}"
export PORT

echo "Starting production server on port $PORT..."
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."

# Run the Next.js standalone server
exec node dist/workspace/projects/server.js
