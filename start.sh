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

# Check for ANTHROPIC_API_KEY
if ! grep -q "ANTHROPIC_API_KEY" .env 2>/dev/null || grep -q "ANTHROPIC_API_KEY=$" .env 2>/dev/null; then
  echo "⚠  WARNING: ANTHROPIC_API_KEY is missing or empty in .env"
  echo "   Intel Feed tab will show FEED UNAVAILABLE until you add it."
fi

echo "▶ Starting HormuzWatch API on :8000..."
uvicorn api.main:app --port 8000 --reload &
API_PID=$!
echo "  API PID: $API_PID"

echo "▶ Starting Vite dev server..."
cd hormuzwatch-ui && npm run dev

# Cleanup on exit
trap "kill $API_PID 2>/dev/null" EXIT
