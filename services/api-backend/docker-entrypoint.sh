#!/bin/sh
set -e

echo "=== Rebuilding shared package ==="
cd /app/packages/shared
npm run build

echo "=== Syncing database schema ==="
cd /app/services/api-backend
npm run db:push

echo "=== Starting API backend ==="
exec npm run dev
