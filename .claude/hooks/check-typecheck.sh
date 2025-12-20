#!/bin/bash
# Claude Code Hook: TypeScript Type Check
# Runs TypeScript compiler to check for type errors

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo "Warning: node_modules not found, skipping type check"
  exit 0
fi

# Check if tsconfig.json exists
if [ ! -f "$PROJECT_ROOT/tsconfig.json" ]; then
  echo "Warning: tsconfig.json not found, skipping type check"
  exit 0
fi

cd "$PROJECT_ROOT"

# Run TypeScript type check
OUTPUT=$(npm run type-check 2>&1) || TYPE_EXIT_CODE=$?

if [ "${TYPE_EXIT_CODE:-0}" -ne 0 ]; then
  echo ""
  echo "=========================================="
  echo "  TypeScript Errors Detected!"
  echo "=========================================="
  echo ""
  echo "$OUTPUT"
  echo ""
  echo "Fix type errors before proceeding"
  echo ""
  exit 0
fi

echo "✅ Type check: No errors"

exit 0
