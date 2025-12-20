#!/bin/bash
# Claude Code Hook: Unit Tests Check
# Runs Vitest unit tests to ensure code correctness

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo "Warning: node_modules not found, skipping unit tests"
  exit 0
fi

cd "$PROJECT_ROOT"

# Run unit tests (single run, not watch mode)
OUTPUT=$(npm test -- --run 2>&1) || TEST_EXIT_CODE=$?

if [ "${TEST_EXIT_CODE:-0}" -ne 0 ]; then
  echo ""
  echo "=========================================="
  echo "  Unit Test Failures Detected!"
  echo "=========================================="
  echo ""
  # Show the last 30 lines of output for context
  echo "$OUTPUT" | tail -30
  echo ""
  echo "Run 'npm test' to see full test output"
  echo ""
  exit 0
fi

# Extract test results
if echo "$OUTPUT" | grep -qE "Tests\s+[0-9]+\s+passed"; then
  PASSED=$(echo "$OUTPUT" | grep -oE "[0-9]+ passed" | head -1)
  echo "✅ Unit tests: $PASSED"
elif echo "$OUTPUT" | grep -qE "\d+ test"; then
  echo "✅ Unit tests: All passed"
else
  echo "✅ Unit tests: Completed"
fi

exit 0
