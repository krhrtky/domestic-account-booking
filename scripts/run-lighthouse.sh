#!/bin/bash
set -e

if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ] || [ -z "$NEXTAUTH_SECRET" ]; then
  echo "Error: DATABASE_URL and NEXTAUTH_SECRET environment variables are required"
  exit 1
fi

echo "Building production bundle..."
npm run build

echo "Creating test session..."
AUTH_COOKIE=$(node scripts/lighthouse-auth.js)

echo "Updating Lighthouse config with auth cookie..."
cp .lighthouserc.json .lighthouserc.json.bak
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|__LIGHTHOUSE_AUTH_COOKIE__|$AUTH_COOKIE|g" .lighthouserc.json
else
  sed -i "s|__LIGHTHOUSE_AUTH_COOKIE__|$AUTH_COOKIE|g" .lighthouserc.json
fi

echo "Starting production server..."
npm start &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null || true; mv .lighthouserc.json.bak .lighthouserc.json 2>/dev/null || true" EXIT

echo "Waiting for server to be ready..."
npx wait-on http://localhost:3000 -t 30000

echo "Running Lighthouse CI..."
npx lhci collect
npx lhci assert

echo "Lighthouse CI complete!"
