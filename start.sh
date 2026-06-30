#!/bin/bash
# HormuzWatch — local dev startup
# Run from the hormuzwatch/ directory: bash start.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate venv if present
if [ -f ".venv/bin/activate" ]; then
  source .venv/bin/activate
fi

echo "▶ Starting HormuzWatch API on :8000..."
uvicorn api.main:app --port 8000 --reload &
API_PID=$!
echo "  API PID: $API_PID"
trap 'kill "$API_PID" 2>/dev/null || true' EXIT INT TERM

echo "▶ Starting Vite dev server..."
cd hormuzwatch-ui && npm run dev
