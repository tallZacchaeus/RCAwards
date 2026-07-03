# Deploying RCAwards to the Hostinger VPS

Production stack (all in Docker Compose): **MariaDB 11 → FastAPI backend → Next.js
frontend → Caddy** (reverse proxy with automatic Let's Encrypt HTTPS).

Public URL layout — one domain, no CORS headaches:

| URL | Serves |
|---|---|
| `https://awards.thecitybreed.org/` | Next.js site |
| `https://awards.thecitybreed.org/api/*` | FastAPI (prefix stripped by Caddy) |
| `https://awards.thecitybreed.org/uploads/*` | Nomination evidence files |
| `https://awards.thecitybreed.org/api/docs` | Interactive API docs |

Files that make up the deployment:

- `docker-compose.prod.yml` — the whole stack
- `deploy/Caddyfile` — routing + HTTPS
- `.env.production.example` — template for the server's `.env`
- `backend/Dockerfile`, `frontend/Dockerfile`

---

## 1. What to buy (once)

- **Hostinger VPS — KVM 2** (2 vCPU, 8 GB RAM, 100 GB NVMe). KVM 1 (4 GB) can run
  the stack, but the Next.js production build is memory-hungry; 8 GB gives
  comfortable headroom for builds and event-night traffic.
- **Domain**: already owned (`thecitybreed.org`, DNS on Cloudflare) — nothing to buy.
- **Hostinger Mail (optional)**: only needed when the app should send email
  (see §8). ~$0.99/mo for one mailbox.

During VPS checkout, pick the **Ubuntu 24.04 with Docker** template and add your
SSH public key. Choose the datacenter closest to your audience (Europe is
usually the best latency compromise for Nigeria).

## 2. First login & basic hardening

```bash
ssh root@YOUR_VPS_IP

# Firewall: SSH + web only
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# Keep the OS patched
apt update && apt upgrade -y
```

Hostinger's panel includes **weekly auto-backups / snapshots** — turn them on
(VPS → Backups). Take a manual snapshot before major changes.

## 3. Point DNS at the VPS

In **Cloudflare** (where thecitybreed.org's DNS lives), add:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `awards` | YOUR_VPS_IP | **DNS only (grey cloud)** |

Grey-cloud is required so Caddy can obtain the Let's Encrypt certificate
directly. (You can switch to proxied later with Cloudflare SSL mode "Full
(strict)"; grey-cloud is the simple, correct default.)

## 4. Get the code onto the VPS

```bash
git clone https://github.com/tallZacchaeus/RCAwards.git /opt/rcawards
cd /opt/rcawards
```

If the repo is private, create a fine-grained GitHub **personal access token**
(read-only on this repo) and use it as the password when prompted, or add the
VPS's SSH key as a deploy key.

## 5. Configure secrets

```bash
cp .env.production.example .env
openssl rand -hex 32      # → JWT_SECRET
openssl rand -base64 24   # → DB_ROOT_PASSWORD (run again for DB_PASSWORD)
nano .env                 # paste the generated values
```

`.env` is git-ignored — it never leaves the server. With `ENVIRONMENT=production`
the backend **refuses to start** on weak secrets — a deliberate guard.

## 6. Build and launch

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

First build takes several minutes (Next.js compile). Then initialise the
database — migrations, category seeds, and your admin login:

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose -f docker-compose.prod.yml exec backend python -m app.seed.loader
docker compose -f docker-compose.prod.yml exec backend \
  python -m app.manage create-admin --email you@thecitybreed.org --password 'a-strong-password'
```

## 7. Verify & go-live checklist

```bash
curl https://awards.thecitybreed.org/api/health   # {"status":"ok",...}
```

- [ ] Migrations run, categories seeded, first admin created (extra judges via
      `python -m app.manage create-user` or Admin → Users).
- [ ] Homepage loads over HTTPS; certificate is valid.
- [ ] Smoke test: submit a nomination **with a file upload**, log into `/admin`,
      score it, shortlist a nominee, cast a vote.
- [ ] Set the voting window in **Admin → Settings** (opens/closes, results visibility).
- [ ] Hostinger snapshots on; nightly DB dump cron added (§10).
- [ ] (Optional) Managed captcha (Turnstile/hCaptcha) on public writes if spam
      becomes an issue — a honeypot ships already.

If the certificate fails: check DNS propagation (`dig awards.thecitybreed.org`)
and that the Cloudflare record is grey-cloud.

## 8. Email (Hostinger SMTP)

The backend has an SMTP mailer (`backend/app/mailer.py`) configured by the
`SMTP_*` variables in `.env`. To enable it:

1. Buy a Hostinger Mail plan and create a mailbox, e.g. `awards@thecitybreed.org`.
2. **Caution:** attaching Hostinger Mail to `thecitybreed.org` means changing the
   domain's **MX records in Cloudflare**, and the domain already has MX records
   pointing at an existing mail/forwarding service. Changing them affects any
   existing addresses — confirm with whoever manages the current email first.
   (Alternative: host the mailbox on another domain you own.)
3. Fill `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` in `.env`, then
   `docker compose -f docker-compose.prod.yml up -d backend` to reload.

Nothing calls the mailer yet — nomination-confirmation / admin-alert emails can
be wired onto it whenever you want them.

## 9. Updating the site

```bash
cd /opt/rcawards
git pull
docker compose -f docker-compose.prod.yml up -d --build
# Only when a release includes new migrations:
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## 10. Backups

Hostinger's weekly snapshots cover the whole VM (including the `uploads` and
database volumes). For point-in-time database dumps, add a nightly cron
(`mkdir -p /root/backups`, then `crontab -e`):

```cron
0 3 * * * cd /opt/rcawards && docker compose -f docker-compose.prod.yml exec -T db \
  sh -c 'mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" rcawards' | gzip \
  > /root/backups/rcawards-$(date +\%F).sql.gz
```

## Troubleshooting

- **Logs:** `docker compose -f docker-compose.prod.yml logs -f backend` (or
  `frontend`, `caddy`, `db`).
- **Backend exits with "Insecure production configuration":** fix `JWT_SECRET` /
  `DB_PASSWORD` in `.env` — the guard is doing its job.
- **502 from Caddy:** the backend/frontend container is still starting or
  crashed — check its logs.
- **Frontend build killed (OOM) on a small plan:** add swap:
  `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`

## Deferred by design

- **Object storage**: uploads live on the VPS disk via a Docker volume — fine at
  this scale. To move to S3/R2 later, swap `app/storage.py:save_upload` (the
  `StoredFile` return shape is the only contract the routers depend on).
- **Transactional email flows**: the mailer exists; individual emails
  (nomination confirmations, admin alerts) are a small follow-up.
