#!/usr/bin/env bash
# deploy.sh — pull the latest code, rebuild the images, and restart the stack.
#
# Safe to run repeatedly: it fetches first and exits early when the checkout is
# already at the tip of the deploy branch, so it is cheap to call on a timer or
# from a CI/webhook trigger. DB migrations run automatically inside the backend
# container's entrypoint (`alembic upgrade head`), so they are not repeated here.
#
#   Usage:  ./deploy.sh [--force]
#     --force   rebuild and restart even if there are no new commits
#
#   Env overrides:
#     REPO_DIR       repo location           (default: script's own directory)
#     DEPLOY_BRANCH  branch to deploy        (default: main)
#     DEPLOY_LOG     append a log line here  (default: /var/log/rcawards-deploy.log)
set -euo pipefail

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
BRANCH="${DEPLOY_BRANCH:-main}"
COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="${DEPLOY_LOG:-/var/log/rcawards-deploy.log}"
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

log() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE"; }
die() { log "ERROR: $*"; exit 1; }

# Only one deploy at a time — a slow build must not overlap the next trigger.
exec 9>"/tmp/rcawards-deploy.lock"
flock -n 9 || die "another deploy is already running; aborting."

cd "$REPO_DIR" || die "repo dir not found: $REPO_DIR"
command -v docker >/dev/null || die "docker not installed"

log "Fetching origin/$BRANCH ..."
git fetch --quiet origin "$BRANCH" || die "git fetch failed"

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"

if [ "$LOCAL" = "$REMOTE" ] && [ "$FORCE" -eq 0 ]; then
  log "Already up to date at ${LOCAL:0:7} — nothing to deploy."
  exit 0
fi

log "Deploying ${LOCAL:0:7} -> ${REMOTE:0:7}"

# Fast-forward only. This never discards local edits: if an incoming commit
# conflicts with an uncommitted change it aborts loudly instead of clobbering.
# (.env is gitignored, so secrets/domain config are always preserved.)
git merge --ff-only "origin/$BRANCH" || \
  die "cannot fast-forward — the working tree has diverging/committed local changes. Resolve manually."

log "Building images ..."
docker compose -f "$COMPOSE_FILE" build 2>&1 | tee -a "$LOG_FILE"

log "Restarting stack ..."
docker compose -f "$COMPOSE_FILE" up -d 2>&1 | tee -a "$LOG_FILE"

# Reclaim disk from the images this build just superseded.
docker image prune -f >/dev/null 2>&1 || true

# --- Health check -----------------------------------------------------------
# Probe the site through Caddy on the real domain. SITE_DOMAIN lives in .env.
SITE_DOMAIN="$(grep -E '^SITE_DOMAIN=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' || true)"
if [ -n "$SITE_DOMAIN" ]; then
  URL="https://${SITE_DOMAIN}/api/health"
  log "Health-checking $URL ..."
  ok=0
  for _ in $(seq 1 20); do
    if curl -fsS --max-time 5 "$URL" >/dev/null 2>&1; then ok=1; break; fi
    sleep 3
  done
  [ "$ok" -eq 1 ] || die "health check failed after restart — check: docker compose -f $COMPOSE_FILE logs"
  log "Health check OK."
else
  log "SITE_DOMAIN not set in .env — skipping external health check."
fi

log "Deploy complete: now at ${REMOTE:0:7} ($(git log -1 --pretty=%s))"
