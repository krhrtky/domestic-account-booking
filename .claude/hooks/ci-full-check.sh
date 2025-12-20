#!/bin/bash
# Claude Code Hook: Full CI Check
# Runs all CI checks: lint, type-check, unit tests, and architecture validation
# Use this before committing/pushing to ensure CI will pass

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo "Warning: node_modules not found, skipping CI check"
  exit 0
fi

cd "$PROJECT_ROOT"

echo ""
echo "=========================================="
echo "  Running Full CI Check"
echo "=========================================="
echo ""

FAILED=0
PASSED=0
WARNINGS=0

# 1. Lint Check
echo "📋 Running lint check..."
if npm run lint >/dev/null 2>&1; then
  echo "  ✅ Lint: Passed"
  ((PASSED++))
else
  echo "  ❌ Lint: Failed"
  ((FAILED++))
fi

# 2. Type Check
echo "🔍 Running type check..."
if npm run type-check >/dev/null 2>&1; then
  echo "  ✅ Type check: Passed"
  ((PASSED++))
else
  echo "  ❌ Type check: Failed"
  ((FAILED++))
fi

# 3. Unit Tests
echo "🧪 Running unit tests..."
if npm test -- --run >/dev/null 2>&1; then
  echo "  ✅ Unit tests: Passed"
  ((PASSED++))
else
  echo "  ❌ Unit tests: Failed"
  ((FAILED++))
fi

# 4. Architecture Check
echo "🏗️ Running architecture check..."
if [ -f "$PROJECT_ROOT/.dependency-cruiser.js" ]; then
  ARCH_OUTPUT=$(npx depcruise src app --config .dependency-cruiser.js --output-type err 2>&1) || true
  if echo "$ARCH_OUTPUT" | grep -q "error"; then
    echo "  ❌ Architecture: Violations found"
    ((FAILED++))
  elif echo "$ARCH_OUTPUT" | grep -q "warn"; then
    echo "  ⚠️ Architecture: Warnings found"
    ((WARNINGS++))
    ((PASSED++))
  else
    echo "  ✅ Architecture: Passed"
    ((PASSED++))
  fi
else
  echo "  ⏭️ Architecture: Skipped (no config)"
fi

# Summary
echo ""
echo "=========================================="
echo "  CI Check Summary"
echo "=========================================="
echo ""
echo "  ✅ Passed:   $PASSED"
echo "  ⚠️ Warnings: $WARNINGS"
echo "  ❌ Failed:   $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
  echo "🚨 CI check failed! Fix the above issues before pushing."
  echo ""
  echo "Run individual checks for details:"
  echo "  npm run lint        # Fix lint issues"
  echo "  npm run type-check  # Fix type errors"
  echo "  npm test            # Fix test failures"
  echo "  npm run check:arch  # Check architecture"
  echo ""
else
  echo "🎉 All CI checks passed! Safe to push."
  echo ""
fi

exit 0
