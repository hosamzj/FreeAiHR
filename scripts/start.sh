#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"


start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    PORT=${DEPLOY_RUN_PORT} node dist/server.js
}

# Ensure database directory exists and is writable
DB_DIR=$(dirname "${DATABASE_URL#file:}" 2>/dev/null || echo "/tmp")
mkdir -p "$DB_DIR" 2>/dev/null || true

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service
