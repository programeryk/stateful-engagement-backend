#!/bin/sh
set -e

echo "Running migrations..."
npx prisma migrate deploy

if [ "${RUN_SEED_ON_BOOT}" = "true" ]; then
  echo "Running seed..."
  npx prisma db seed
fi

echo "Starting app..."
node dist/src/main.js
