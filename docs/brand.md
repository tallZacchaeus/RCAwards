# Brand & Design Tokens — Redemption City Awards of Excellence

> **⚠️ Superseded (2026 redesign).** The palette, typography, and effects below
> were the original brief. The shipped visual system is defined by
> [`REDESIGN.md`](../REDESIGN.md) and `frontend/app/globals.css` — an editorial,
> flat direction (Manrope display, no gradients/metallic fills/glow/particles).
> Where this file and REDESIGN.md disagree, **REDESIGN.md wins.** This doc is kept
> for historical brand context only.

These colors and fonts describe the original brief (from the official flyer). The
Phase 3 frontend and the `Redemption City Awards.dc.html` reference no longer
follow it verbatim — see the note above.

Canonical reference: the official 2026 flyer (gold metallic trophy + wordmark on
black). Drop the artwork at `docs/brand/flyer-2026.jpg` to keep it with the repo.

## Palette — gold on black

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0A0807` | Page background (warm near-black) |
| `--bg-raised` | `#120D08` | Cards, panels, raised surfaces |
| `--bg-elevated` | `#1A1206` | Hover/elevated surfaces, inputs |
| `--gold-deep` | `#8C6A1F` | Deep bronze — gradient start, borders |
| `--gold` | `#C9A24B` | **Primary gold** — accents, rules, eyebrows |
| `--gold-bright` | `#D4AF37` | Buttons, active states |
| `--gold-hi` | `#F8E7A1` | Champagne highlight — gradient end, glints |
| `--ink` | `#F5EFE3` | Primary text on dark (warm white) |
| `--ink-muted` | `#B9AC93` | Secondary text, captions |
| `--line` | `rgba(201,162,75,.22)` | Hairline dividers |

**Signature metallic gradient** (the "AWARDS" wordmark fill / shimmer):

```css
background: linear-gradient(105deg, #8C6A1F 0%, #F8E7A1 38%, #C9A24B 60%, #FCEFB4 82%, #8C6A1F 100%);
```

Pair with a soft gold light-bloom and fine gold particle/bokeh over black (already
prototyped in the `.dc.html` keyframes).

## Typography

Roles matched to the flyer's lettering. All available on Google Fonts.

| Role | Font | Where |
|---|---|---|
| **Display caps** | **Cinzel** (Trajan-style Roman capitals) | The "AWARDS OF EXCELLENCE" wordmark, hero title, all-caps section eyebrows |
| **Editorial serif** | **Playfair Display** (high-contrast Didone) | Large headlines, the date lockup ("28TH JULY, 2026" style), elegant pull quotes |
| **Accent serif** | **Cormorant Garamond** | Refined subheads, intros, quotes |
| **Body / UI** | **Manrope** | Paragraphs, buttons, forms, nav, the admin dashboard |

> The flyer's "AWARDS" is an inscriptional Roman capital — **Cinzel** is the closest
> web match and should drive the brand wordmark/titles. Keep body and all app UI in
> Manrope for legibility. (The current `.dc.html` uses Playfair for its hero; in
> Phase 3 the hero wordmark moves to Cinzel to match the flyer exactly.)

## Ready-to-use tokens (Phase 0/3)

CSS custom properties:

```css
:root {
  --bg: #0A0807; --bg-raised: #120D08; --bg-elevated: #1A1206;
  --gold-deep: #8C6A1F; --gold: #C9A24B; --gold-bright: #D4AF37; --gold-hi: #F8E7A1;
  --ink: #F5EFE3; --ink-muted: #B9AC93; --line: rgba(201,162,75,.22);
  --font-display: 'Cinzel', serif;
  --font-serif: 'Playfair Display', serif;
  --font-accent: 'Cormorant Garamond', serif;
  --font-sans: 'Manrope', system-ui, sans-serif;
}
```

Tailwind theme extension:

```ts
theme: {
  extend: {
    colors: {
      bg: { DEFAULT: '#0A0807', raised: '#120D08', elevated: '#1A1206' },
      gold: { deep: '#8C6A1F', DEFAULT: '#C9A24B', bright: '#D4AF37', hi: '#F8E7A1' },
      ink: { DEFAULT: '#F5EFE3', muted: '#B9AC93' },
    },
    fontFamily: {
      display: ['Cinzel', 'serif'],
      serif: ['Playfair Display', 'serif'],
      accent: ['Cormorant Garamond', 'serif'],
      sans: ['Manrope', 'system-ui', 'sans-serif'],
    },
  },
}
```

`next/font` import (Phase 3):

```ts
import { Cinzel, Playfair_Display, Cormorant_Garamond, Manrope } from 'next/font/google'
```

## Event identity

- Name: **The Redemption City Awards of Excellence**
- Edition: **4th** (2026)
- Date: **Tuesday, 28 July 2026**
- Powered by **City Breed** · social: **@thecitybreed** (FB / IG / X / YouTube)
