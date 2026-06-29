# RCAwards — Frontend (Phase 3: marketing site)

The public marketing site for the Redemption City Awards of Excellence 2026 —
Next.js 16 (App Router) + React 19 + Tailwind v4, with GSAP + Lenis for the
narrative-scroll motion. Visual system follows [`../docs/brand.md`](../docs/brand.md):
gold-on-black, Cinzel / Playfair Display / Cormorant Garamond / Manrope.

## Stack

- **Next.js 16** (App Router) — the home page is statically generated (SSG + ISR)
  for near-instant first paint; GSAP layers motion on after hydration.
- **Tailwind v4** — brand tokens defined in `app/globals.css` via `@theme`.
- **GSAP + ScrollTrigger** + **Lenis** — scroll reveals, hero timeline, smooth scroll.
- **next/font** — the four brand fonts, self-hosted, zero layout shift.
- Utilities for shadcn/ui (`cn`, clsx, tailwind-merge, CVA) are installed; shadcn
  components are introduced with the nomination forms / dashboard in Phases 4 & 6.

## Structure

```
app/
  layout.tsx           # root: fonts, metadata, globals (html/body only)
  globals.css          # brand tokens (@theme) + keyframes + reduced-motion
  (marketing)/         # public site — its own layout adds header/footer + Lenis
    layout.tsx · page.tsx · nominate/… · vote/…
  admin/               # logged-in console — its own shell, no marketing chrome
    layout.tsx         # AuthProvider + route guard
    login · nominations · nominations/[id] · leaderboard · nominees
components/
  smooth-scroll        # Lenis, synced to GSAP ScrollTrigger
  reveal               # scroll-triggered reveal wrapper (GPU, fires once)
  hero · breed-pillars · about-award · objectives · how-to-nominate ·
  categories · winners-gallery · sponsors · faq · nominate-cta ·
  site-header · site-footer · countdown
  ui/                  # brand-styled primitives (button, input, textarea,
                       # label, select, radio-group) on Radix — shadcn-conventioned
  forms/               # nomination-form, field-renderer, linear-scale, file-upload
lib/
  site.ts              # static content (BREED, objectives, FAQ, fallback categories)
  api.ts               # categories, category detail, signup, upload, submit
  forms/               # form-definition types + client validator (mirrors backend)
  utils.ts             # cn()
```

## Nomination flow (Phase 4)

`/nominate` lists categories; `/nominate/[slug]` fetches that category's form
definition from the backend and renders it dynamically — any of the 23 forms from
JSON, no hardcoding. Client-side validation mirrors the backend validator for
instant feedback; the backend re-validates on submit. File fields upload to
`/uploads` first, then their URLs ride along with the nomination to
`POST /nominations`. Server-side field errors (422) map back onto the fields.

## Voting (Phase 5)

`/vote` → `/vote/[slug]` renders shortlisted nominees with live vote counts and a
one-vote-per-category device gate (a `localStorage` device id pairs with the
server's IP hash for anti-fraud).

## Admin console (Phase 6)

`/admin/*` is a logged-in console (JWT in `localStorage`, route-guarded) over the
backend admin endpoints: the nomination queue with filters + CSV export, a detail
view that resolves answer labels from the form schema, judge scoring against the
1–10 criteria, status decisions, the average-score leaderboard, and the voting
slate (add nominees, crown winners). Admin-only actions are gated by role.

## Develop

```bash
cd frontend
npm install
cp .env.example .env.local     # point NEXT_PUBLIC_API_BASE at the backend
npm run dev                    # http://localhost:3000
```

The categories grid and the newsletter signup talk to the FastAPI backend
(`NEXT_PUBLIC_API_BASE`, default `http://localhost:8000`). If the API is
unreachable, categories fall back to a static list so the site still builds and
renders.

## Motion & performance notes

- All reveals use opacity/transform only (GPU) and fire once.
- Everything degrades to an instant, fully-visible state under
  `prefers-reduced-motion: reduce`.
- The hero particle field is deterministic (no `Math.random`) to avoid hydration
  mismatch.

## Build

```bash
npm run build      # type-checks and prerenders the static home page
```
