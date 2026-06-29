# Deployment & launch runbook

The platform is two deployables: the **FastAPI backend** (+ MySQL) and the
**Next.js frontend**. This guide covers production configuration, the database,
and the launch checklist.

## 1. Database (MySQL 8)

```sql
CREATE DATABASE rcawards CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rcawards'@'%' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON rcawards.* TO 'rcawards'@'%';
FLUSH PRIVILEGES;
```

Use a managed MySQL (PlanetScale, RDS, Railway, etc.) in production. The
connection string is `mysql+pymysql://rcawards:<password>@<host>:3306/rcawards`.

## 2. Backend

Environment (see `backend/.env.example`):

| Variable | Production value |
|---|---|
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | your MySQL URL (not the `root:root` default) |
| `JWT_SECRET` | a random string **≥ 32 bytes** (`openssl rand -hex 32`) |
| `CORS_ORIGINS` | `["https://<your-frontend-domain>"]` |
| `UPLOAD_DIR` / storage | see step 4 |

> With `ENVIRONMENT=production`, the app **refuses to start** if `JWT_SECRET` is
> weak or `DATABASE_URL` still uses the default root credentials — a deliberate
> guard.

Deploy steps:

```bash
pip install -r requirements.txt
alembic upgrade head                      # create/upgrade schema
python -m app.seed.loader                 # load the 23 categories (idempotent)
python -m app.manage create-admin --email you@org.com --password '<strong>'
uvicorn app.main:app --host 0.0.0.0 --port 8000   # behind gunicorn/uvicorn workers
```

Run it as a container (Fly.io, Render, Railway, a VPS) or behind a process
manager. Put it behind HTTPS (the reverse proxy / platform handles TLS). The API
already sets security headers and per-IP rate limiting on public writes.

## 3. Frontend (Vercel recommended)

Environment (see `frontend/.env.example`):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE` | `https://<your-api-domain>` |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-frontend-domain>` |

```bash
npm ci && npm run build      # CI does this on every push
```

On Vercel: import the repo, set **Root Directory = `frontend`**, add the two env
vars, deploy. The marketing pages are statically generated (ISR); the form,
voting, and admin routes render on demand.

## 4. File uploads (storage)

Dev stores uploads on local disk (`UPLOAD_DIR`). For production, swap
`app/storage.py:save_upload` for an S3/R2/Blob implementation (the `StoredFile`
return shape is the only contract the routers depend on) and serve files from the
bucket/CDN instead of the local `/uploads` mount.

## 5. Go-live checklist

- [ ] MySQL provisioned; `alembic upgrade head` run; categories seeded.
- [ ] First admin created; extra judges added via the console or `manage create-user`.
- [ ] `ENVIRONMENT=production`, strong `JWT_SECRET`, real `DATABASE_URL`, correct `CORS_ORIGINS`.
- [ ] Frontend env points at the production API and site URL.
- [ ] Storage backend wired for uploads (step 4) if nominations use file uploads.
- [ ] Custom domain + HTTPS on both apps.
- [ ] Set the voting window in **Admin → Settings** (opens/closes, results visibility).
- [ ] Smoke test: submit a nomination, log into `/admin`, score it, shortlist a
      nominee, cast a vote.
- [ ] (Optional) Add a managed captcha (Turnstile/hCaptcha) on top of the honeypot
      for the public write endpoints if spam becomes an issue.
- [ ] Database backups enabled on the managed MySQL.

## 6. What's intentionally deferred

- **Captcha**: a honeypot ships now; a key-based captcha is a drop-in add if needed.
- **Email**: newsletter signups are stored in `subscribers`; wiring an ESP
  (Resend/Mailchimp) is a follow-up.
- **Object storage**: see step 4.
