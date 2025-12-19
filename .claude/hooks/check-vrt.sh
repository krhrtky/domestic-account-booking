#!/bin/bash
# Claude Code Hook: VRT Check
# Runs VRT tests when UI-related files are changed

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

if [ ! -f ".env.local.e2e" ]; then
  echo "⚠️ VRT: .env.local.e2e not found, skipping VRT check"
  echo "  Run 'make e2e-ci-setup' to set up E2E environment"
  exit 0
fi

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "domestic-account-booking-e2e-postgres"; then
  echo "⚠️ VRT: E2E database not running, skipping VRT check"
  echo "  Run 'make e2e-ci-db-start' to start database"
  exit 0
fi

echo "🔍 Running VRT tests..."
OUTPUT=$(npm run test:vrt 2>&1) || true

if echo "$OUTPUT" | grep -q "failed"; then
  echo ""
  echo "=========================================="
  echo "  VRT Test Failure Detected!"
  echo "=========================================="
  echo ""
  echo "$OUTPUT" | tail -20
  echo ""
  echo "Run 'npm run test:vrt:update' to update snapshots"
  echo ""
  exit 0
fi

if echo "$OUTPUT" | grep -q "passed"; then
  PASSED=$(echo "$OUTPUT" | grep -oE "[0-9]+ passed" | head -1)
  echo "✅ VRT: $PASSED"
fi

exit 0
