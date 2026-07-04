# Redemption City Award of Excellence 2026 — Build Plan

_Powered by City Breed · 4th Edition · Event: Wednesday, 29 July 2026_

## 1. What we're building

A single web platform with three faces:

1. **Marketing site** — public landing experience (hero, City Breed B.R.E.E.D. pillars, about the award, objectives, how-to-nominate, categories, gallery of past winners, countdown, signup).
2. **Nomination system** — native, in-app forms for ~20 award categories, stored in our own database (replaces the existing tinyurl/Google Forms).
3. **Voting + Admin/Judging** — public voting on shortlisted nominees, plus an internal dashboard for staff/judges to review submissions, score against criteria, and shortlist the top 3 per category.

**Design direction:** keep the existing dark-luxury visual system (gold `#C9A24B` on near-black `#0A0807`; Playfair Display + Cormorant Garamond + Manrope) from `Redemption City Awards.dc.html`, and fold in the CityBreed content (B.R.E.E.D. pillars, objectives, how-to-nominate steps).

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **Next.js (TypeScript, App Router) + Tailwind** | SSG marketing pages for instant first paint + SEO; client components for forms/voting/admin. (Next.js *is* React — see §2a.) |
| UI components | **shadcn/ui** (Radix primitives) + **21st.dev Magic MCP** | shadcn for accessible app UI (forms, dialogs, tables, dashboard); Magic MCP to generate bespoke marketing/hero components. |
| Animation | **GSAP + ScrollTrigger** + **Lenis** smooth scroll | Story-like, scroll-driven motion; Lenis for buttery momentum scrolling. `@gsap/react` `useGSAP()` hook for clean React integration. |
| Backend | **Python + FastAPI** | REST API, Pydantic validation, async. |
| ORM / migrations | **SQLAlchemy 2.x + Alembic** | Versioned schema. |
| Database | **MySQL 8** | As requested. |
| Auth | **JWT** (admin/judges only) | Public nomination/voting are unauthenticated but rate-limited. |
| File uploads | **S3-compatible storage** (or local disk in dev) | Photos, flyers, testimonials, reports. |
| Hosting | Frontend → Vercel; API → container (Fly/Render/VPS); MySQL → managed | Decide at deploy phase. |

### 2a. Why Next.js and not "just React"

Next.js *is* React — React is the library, Next.js is the framework built on it. The real trade-off is Vite+React (you wire up routing/SEO/images yourself; best for login-walled apps where SEO is irrelevant) vs Next.js (routing, **SSG/SSR**, image/font optimization, API layer built in; best for public sites that must rank and load fast). For this project Next.js wins because the marketing pages can be **statically generated for near-instant first paint**, then GSAP layers motion on top after hydration — Framer/Webflow-class animation *without* the slow blank-screen of a client-only React app. shadcn, Magic MCP, and GSAP all run identically either way.

### 2b. Tooling roles (no overlap)

- **shadcn/ui** → the *app* surface: nomination form controls, dialogs, toasts, data tables, the admin/judging dashboard. Accessible, themeable, we own the code.
- **21st.dev Magic MCP** → the *marketing* surface: generate distinctive hero, category grid, winner spotlight, timeline, and CTA sections, then hand-tune. Use it for the "wow," not for plumbing.
- **GSAP + ScrollTrigger + Lenis** → the *motion* layer that ties it together (see §3a).

**Repo layout (monorepo):**
```
/frontend   → Next.js app (TypeScript)
/backend    → FastAPI app (Python)
/backend/alembic → migrations
/docs       → these source docs + schema notes
```

## 3. The key architectural idea: a dynamic form engine

The 20 categories have very different forms (short text, paragraphs, multiple choice, dropdowns, 1–10 linear scales, yes/no, file uploads). **Do not hardcode 20 forms.** Instead:

- Each category stores a **JSON form definition** (sections → fields, each with `type`, `label`, `required`, `options`, `min/max`, `maxWords`).
- The frontend renders any form from that JSON; the backend validates submissions against the same schema.
- Adding/editing a category or a question becomes data, not code.

Field types to support: `short_text`, `paragraph`, `multiple_choice`, `dropdown`, `yes_no`, `linear_scale_1_10`, `file_upload`, `email`, `phone`, `region_select`.

**Standardize the Departmental Impact forms** per the PFO note — all departmental categories use the same 5 criteria: **Leadership, Integrity, Problem Solving, Collaboration & Team Spirit, Impact & Value to the Department.**

## 3a. Design & motion system (the "outstanding front-facing site")

**Visual target:** the polish you'd see in award-winning Dribbble / Webflow / Framer showcases — editorial layout, generous whitespace, cinematic dark-luxury palette, large display type, tasteful gold accents and grain/texture. The full, locked design system lives in [`docs/brand.md`](docs/brand.md) (colors + fonts are constant every edition, taken from the official flyer):

- **Palette:** near-black `#0A0807`, primary gold `#C9A24B`, bright `#D4AF37`, champagne highlight `#F8E7A1`, deep bronze `#8C6A1F`; signature metallic gradient for the wordmark.
- **Type:** **Cinzel** (display caps — the "AWARDS OF EXCELLENCE" wordmark & titles), Playfair Display (editorial headlines & date lockup), Cormorant Garamond (accent serif), Manrope (UI/body) — all served via `next/font` (zero layout shift).
- **Texture:** subtle film grain, soft gold light-bloom, thin metallic rules — already prototyped in the HTML's keyframes.

**Motion principles (story-like, not gratuitous):**
- **Narrative scroll** — the page tells a sequence: arrival → who City Breed is (B.R.E.E.D.) → the award → categories → past champions → countdown → nominate. Each section is a "beat."
- **GSAP ScrollTrigger** drives pinned sections, staggered reveals, parallax layers, a counting-up countdown, and a horizontal category showcase.
- **Lenis** smooth scroll for momentum; sync it to ScrollTrigger so pins/parallax stay locked.
- **Hero** — `Playfair` headline word-by-word reveal + light-bloom sweep; one focal animation, not five.

**Performance budget (this is non-negotiable for "fast-loading"):**
- Marketing pages are **SSG**; ship HTML/CSS first, hydrate motion after.
- Lazy-load GSAP plugins and below-the-fold media; `next/image` for all imagery (AVIF/WebP, responsive sizes).
- Respect `prefers-reduced-motion` (degrade to fades/instant).
- Targets: **LCP < 2.0s**, CLS ~0, Lighthouse Performance ≥ 90 on mobile. Animations must not block the main thread on load — prefer `transform`/`opacity` (GPU) only.
- GSAP runs only on sections in/near the viewport; nothing animates off-screen.

## 4. Category catalogue (seed data)

- **City-based:** Crèche of the Year · Event of the Year · Inspirational Leader (Male & Female) · Business Owner of the Year · Organisation of the Year · Under-30 Impact Person · CSR Organisation of the Year
- **RCCG Regional:** Agricultural Innovation · Sports Development · Youth Development · Tech Development
- **Departmental Impact (uniform 5 criteria):** Sanitation · Water · Health (RHV) · Environmental Health · Maintenance · Electronics · Transport · Security · Primary/Secondary School
- **SATGO Youth Province:** Evangelism Impact · Fastest Growing · Outstanding Youth Province

Each is seeded as a JSON form definition extracted from `2026 Content For Award 4.0 link.docx`.

## 5. Database schema (MySQL, first cut)

- `categories` (id, slug, name, group, description, form_schema JSON, voting_enabled, nominations_open, sort_order, active)
- `nominations` (id, category_id, nominator_name, nominator_contact, residency, answers JSON, status [submitted/shortlisted/rejected], created_at)
- `nomination_files` (id, nomination_id, url, kind, uploaded_at)
- `nominees` (id, category_id, display_name, summary, photo_url, source_nomination_id, is_shortlisted, is_winner, edition_year)
- `votes` (id, nominee_id, voter_fingerprint, ip_hash, created_at) — unique (nominee_id, voter_fingerprint)
- `users` (id, email, password_hash, role [admin/judge], active)
- `scores` (id, nomination_id, judge_id, criteria JSON, total, created_at)
- `winners` (id, category_id, nominee_id, edition_year) — for the gallery
- `settings` (key/value: countdown_date, nominations_open_at/close_at, voting window)

## 6. API surface (FastAPI)

- **Public:** `GET /categories`, `GET /categories/{slug}` (returns form schema), `POST /nominations`, `POST /uploads`, `GET /nominees?category=`, `POST /votes`, `POST /signup` (newsletter).
- **Auth:** `POST /auth/login`, `POST /auth/refresh`.
- **Admin/judge:** `GET /admin/nominations`, `PATCH /admin/nominations/{id}` (status), `POST /admin/scores`, `GET /admin/leaderboard`, category CRUD, shortlist/winner management, CSV export.

## 7. Phased delivery

**Phase 0 — Foundation (setup)**
- Init monorepo, Next.js + FastAPI skeletons, MySQL + Alembic, env config, lint/format, basic CI.
- Install & wire **shadcn/ui** (theme it to the gold-on-black tokens), **GSAP + ScrollTrigger + @gsap/react**, and **Lenis**; confirm the **21st Magic MCP** is reachable for component generation.
- Port the design tokens (colors, fonts, animations) from the `.dc.html` into Tailwind config + `next/font` setup + a shared style layer. Add the `prefers-reduced-motion` baseline and a reusable `useGSAP` scroll-section wrapper.

**Phase 1 — Data & form engine**
- Define form-schema JSON spec; extract all 20 categories from the docx into seed files.
- Build schema models, migrations, seed script.
- Backend validator that checks a submission against a category's schema.

**Phase 2 — Backend API**
- Nominations create + file uploads; categories endpoints; signup; rate limiting.
- Auth (admin/judge); admin nomination listing + status; scoring; exports.

**Phase 3 — Marketing site (merged design + motion)**
- Build the narrative-scroll page: Hero, B.R.E.E.D. pillars, About the Award, Objectives, How-to-Nominate steps, Categories showcase, Past Winners gallery, Countdown to 29 July 2026, Sponsors, FAQ, newsletter signup, footer.
- Generate hero / category / spotlight sections with **21st Magic MCP**, then hand-tune to the brand.
- Layer **GSAP ScrollTrigger** beats (pinned sections, staggered reveals, parallax, count-up countdown) + **Lenis** smooth scroll. Keep to the Phase-0 motion principles.
- **Performance pass against the §3a budget** before moving on (Lighthouse ≥ 90 mobile, LCP < 2.0s, CLS ~0).

**Phase 4 — Nomination forms (dynamic renderer)**
- Category picker → render form from JSON → client + server validation → file upload → confirmation screen.
- "Submit more" flow back to categories.

**Phase 5 — Public voting**
- Nominee galleries per category; vote action with anti-fraud (fingerprint + IP hash + rate limit + voting window); live tallies (or hidden until close).

**Phase 6 — Admin / judging dashboard**
- Login; review queue; score against criteria; auto-rank; shortlist top 3; mark winners; export CSV.

**Phase 7 — Hardening & launch**
- Anti-spam (captcha/honeypot), accessibility pass, responsive QA, SEO/meta, analytics, backups, deploy, load-test the voting endpoint.

## 8. Open items to confirm as we go

- **Voting model:** one vote per category per device, or weighted/limited? Public tallies visible live or revealed at close?
- **Nomination vs voting windows:** exact open/close dates around the 29 July event.
- **Auth for judges:** invite-only accounts vs SSO.
- **Storage/hosting** provider choices (finalize at Phase 7).
- **Captcha** provider (hCaptcha/Turnstile) for nominations + votes.

## 9. Recommended starting point

Phase 0 + Phase 1 together: stand up the monorepo and nail the form-schema engine + category seed data. Everything else (forms, voting, admin) depends on that schema being right, and it's where the source docs translate most directly into the build.
