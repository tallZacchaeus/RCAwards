#!/bin/sh
# Container entrypoint: apply DB migrations, then serve the API. Running
# `alembic upgrade head` here makes schema changes automatic on deploy instead of
# a manual, easy-to-forget step.
set -e

echo "[entrypoint] Applying database migrations..."
alembic upgrade head

echo "[entrypoint] Starting API..."
exec uvicorn app.main:app \
  --host 0.0.0.0 --port 8000 --workers 2 \
  --proxy-headers --forwarded-allow-ips "*"
