#!/bin/sh
# Vercel build (vercel.json "buildCommand"). Production deployments apply pending Prisma
# migrations before building, because the production database URL is a Sensitive
# variable that cannot be read outside Vercel. Previews share that database, so they
# never migrate: a pull request's schema change reaches it only when merged. A failed
# migration fails the build, and Vercel keeps serving the previous deployment.
# Migrations use POSTGRES_URL when set: the Prisma Postgres integration's direct TCP
# connection, since DATABASE_URL may be its prisma+postgres:// (Accelerate) address.
set -e
pnpm exec prisma generate
if [ "$VERCEL_ENV" = "production" ]; then
  DATABASE_URL="${POSTGRES_URL:-$DATABASE_URL}" pnpm exec prisma migrate deploy
fi
pnpm exec next build
