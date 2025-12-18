#!/bin/bash
# Claude Code Hook: Architecture Check (dependency-cruiser)
# Runs after Edit/Write operations to validate architecture rules

set -euo pipefail

# Get project root (where .dependency-cruiser.js is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if dependency-cruiser config exists
if [ ! -f "$PROJECT_ROOT/.dependency-cruiser.js" ]; then
  echo "Warning: .dependency-cruiser.js not found, skipping architecture check"
  exit 0
fi

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo "Warning: node_modules not found, skipping architecture check"
  exit 0
fi

# Run dependency-cruiser
cd "$PROJECT_ROOT"

# Run architecture check (suppress progress output for cleaner hook output)
OUTPUT=$(npx depcruise src app --config .dependency-cruiser.js --output-type err 2>&1) || true

# Check if there are any violations
if echo "$OUTPUT" | grep -q "error\|warn"; then
  echo ""
  echo "=========================================="
  echo "  Architecture Violation Detected!"
  echo "=========================================="
  echo ""
  echo "$OUTPUT"
  echo ""
  echo "Run 'npm run check:arch' for detailed report"
  echo ""
  # Return 2 to block the operation (for PreToolUse hooks)
  # Return 0 to allow but warn (for PostToolUse/Stop hooks)
  exit 0
fi

exit 0
