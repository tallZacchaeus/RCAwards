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
  layout.tsx       # fonts, metadata, smooth-scroll + header/footer shell
  page.tsx         # composes the narrative-scroll sections
  globals.css      # brand tokens (@theme) + keyframes + reduced-motion
components/
  smooth-scroll    # Lenis, synced to GSAP ScrollTrigger
  reveal           # scroll-triggered reveal wrapper (GPU transforms, fires once)
  hero · breed-pillars · about-award · objectives · how-to-nominate ·
  categories · winners-gallery · sponsors · faq · nominate-cta ·
  site-header · site-footer · countdown
lib/
  site.ts          # static content (BREED, objectives, FAQ, fallback categories)
  api.ts           # fetch categories + post signup to the backend
  utils.ts         # cn()
```

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
