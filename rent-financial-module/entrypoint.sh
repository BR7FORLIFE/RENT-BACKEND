#!/bin/sh

echo "POSTGRES_URI=$POSTGRES_URI"

pnpm prisma migrate deploy

pnpm prisma db seed

node dist/src/main.js