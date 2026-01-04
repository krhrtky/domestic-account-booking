#!/bin/bash
set -e

if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "Building production bundle..."
npm run build

echo "Starting production server..."
npm start &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null || true" EXIT

echo "Waiting for server to be ready..."
npx wait-on http://localhost:3000 -t 30000

echo "Running Lighthouse CI..."
npx lhci collect
npx lhci assert

echo "Lighthouse CI complete!"
