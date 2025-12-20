#!/bin/bash
# Claude Code Hook: Lint Check (ESLint)
# Runs ESLint to check for code style and potential issues

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo "Warning: node_modules not found, skipping lint check"
  exit 0
fi

cd "$PROJECT_ROOT"

# Run ESLint
OUTPUT=$(npm run lint 2>&1) || LINT_EXIT_CODE=$?

if [ "${LINT_EXIT_CODE:-0}" -ne 0 ]; then
  echo ""
  echo "=========================================="
  echo "  ESLint Errors Detected!"
  echo "=========================================="
  echo ""
  echo "$OUTPUT"
  echo ""
  echo "Run 'npm run lint:fix' to auto-fix issues"
  echo ""
  exit 0
fi

# Check for warnings in output
if echo "$OUTPUT" | grep -q "warning"; then
  WARNINGS=$(echo "$OUTPUT" | grep -c "warning" || echo "0")
  echo "⚠️ Lint: $WARNINGS warning(s) found"
else
  echo "✅ Lint: No issues found"
fi

exit 0
