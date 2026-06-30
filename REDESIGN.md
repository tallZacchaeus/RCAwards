# UI Overhaul Plan — escaping the "AI look"

_Concept reference: the Chrona Awards 2024 Dribbble shot. Goal: a flat, editorial,
typographic, photographic site with **zero gradients** and real restraint._

## 0. Resolved direction (reconciling the brief)

Two answers were in tension — "light editorial like the concept" **and** "must
match the dark-gold flyer." The resolution keeps **both**:

- Adopt the concept's **editorial design language** (flat color, oversized type,
  framed photos, restraint, no gradients) — this is what actually kills the AI feel.
- Render it in the **flyer's dark-gold identity**, so the brand matches.
- Use **light, off-white editorial sections as deliberate contrast** between the
  dark-gold brand blocks. This **dark ↔ light rhythm** gives the airy editorial
  feel from the concept while staying on-brand — and a monotone-breaking rhythm is
  itself strongly anti-AI.
- **Real photography supplied by you** anchors the "this is real" credibility.

So: dark-gold brand moments (hero, header, CTA, footer) **+** light editorial
blocks (about, winners, categories index, jury) — all flat, typographic, framed.

## 1. Why the current site reads as "AI-generated"

It's not one thing — it's a cluster of tells that AI design tools default to, and
we have all of them:

| Tell | Count in code | Why it screams "AI" |
|---|---|---|
| Gradients | 30 | The #1 giveaway. Gradient buttons, gradient text, gradient backgrounds. |
| "Glow" / blooms | 30 | Soft radial glows behind everything = generated-premium cliché. |
| Radial-gradient washes | 9 | Same. |
| Metallic gradient text | 9 | "Luxury" text fill is a template signature. |
| Particles + orbit rings | 18 | Decorative motion with no meaning = filler. |
| Dark + gold + everything centered | — | The single most over-produced AI aesthetic. |

The deeper issue: **decoration is doing the work that typography and layout
should do.** Editorial/human design is confident with flat color, big type, real
photos, asymmetry, and space.

## 2. The new direction (anti-AI, per the concept)

1. **Flat, solid color. No gradients anywhere.** Warm off-white canvas, ink-black
   type, gold as a *single small accent* (one button, a few marks) — not the whole theme.
2. **Typography is the hero.** Oversized, tight, lowercase display type that
   overlaps the trophy and the layout — type as composition, like the concept.
3. **One real product shot, framed with intent.** The trophy on a clean flat
   ground, not floating in glow.
4. **Restraint + asymmetry + space.** Tiny nav, off-center credits, generous
   negative space, hairline rules instead of glowing cards.
5. **Real photography** (past ceremonies/winners) — AI sites rarely place real
   photos well, so it instantly reads human.

## 3. Design system changes

### Color — two flat surfaces (kill every gradient)
Dark-gold brand identity **and** a light editorial surface, alternating by section:

```
/* Dark brand surface — hero, header, CTA, footer (flat, no glow) */
--brand-bg     #0A0807   /* flat near-black (NOT a gradient) */
--brand-ink    #F3EEE3   /* warm white */
--brand-muted  #9A917F
--brand-line   rgba(201,162,75,0.18)

/* Light editorial surface — about, winners, categories, jury */
--paper        #ECEAE4   /* warm greige canvas, like the concept */
--surface      #F6F4EF
--ink          #16130E   /* warm near-black */
--ink-muted    #6E675C
--line         rgba(20,17,12,0.12)

/* One disciplined accent, works on both */
--gold         #C9A24B   /* on dark */
--gold-deep    #A8842F   /* on light, for contrast */
```
Rules: **no `linear-gradient`, no `radial-gradient`, no metallic text fills, no
glow blooms, no particles, no orbit rings.** Elevation = hairlines + space, plus
*one* soft realistic shadow used rarely (the Vote pill). Gold is an accent (a
button, a rule, a mark) — never a fill across whole surfaces.

### Typography
- **Display = Manrope** (already installed), used *huge*, tight tracking,
  **lowercase** headlines ("redemption city awards 2026"). This is the editorial move.
- **Serif (Cinzel/Playfair) demoted** to just the small wordmark lockup and the ™-style
  marks — exactly like the concept's serif "chrona Awards™" against grotesque body.
- Body = Manrope. Retire Cormorant.

### Motion (keep meaningful, cut filler)
- **Keep:** the trophy rotation, scroll-linked type reveals, a `2026` marquee
  strip, subtle image parallax.
- **Cut:** orbit rings, particle emitters, breathing glows, gradient sweeps,
  metallic shimmer. These are the filler tells.

## 4. The hero (the centerpiece)

Two layouts on the table — your "image left / trophy right" idea is option B:

**A — Concept overlap (recommended signature):** centered trophy; oversized
lowercase `awards 2026` wordmark layered *through* it (parts behind the cup, parts
in front); a small "powered by City Breed" credit off to one side; a repeating
`2026 2026 2026…` hairline strip; a large light-gray intro paragraph below.

**B — Editorial split (your idea):** left = a **framed editorial photo** (past
ceremony / champion) with a thin caption frame; right = the **spinning trophy** on
flat ground; the wordmark spans across the top. Clean, magazine-like.

My recommendation: **A as the hero**, and use **B as the very next section** so we
get both — the framed photo gives the "real" credibility AI sites lack.

## 5. Section-by-section

- **Categories** → from glowy card grid to an **editorial index**: numbered rows
  `01 … 23`, big type, hairline dividers, hover = the row reveals an underline /
  the name shifts. Reads like a contents page, not AI cards.
- **Winners** → an **asymmetric framed photo grid** (real photography), captions in
  small caps. The opposite of identical glow cards.
- **B.R.E.E.D. / Objectives** → minimal text blocks separated by hairlines and big
  numerals; no bordered glow cards.
- **Countdown / CTA** → flat, oversized numerals; one solid accent button.
- **Header** → minimal: left nav cluster, centered serif wordmark, a profile dot +
  a single **Vote** pill (exactly the concept's chrome).
- **Cards behaviour generally** → replace "lift + glow + gold border" with
  editorial hovers: image zoom, underline draw, or a quiet background shift. Pick
  one and use it consistently.

## 6. What stays

- All content, copy, the backend, forms, voting, admin, judging — untouched.
- The trophy animation stays, but **refined**: drop the orbit rings + particles,
  keep a clean slow rotation and a real soft contact shadow on the flat ground.
- Gold stays — as a disciplined *accent*, not the whole surface.

## 7. Execution (phased, reviewable)

1. **Tokens + globals** — new flat palette, remove gradient/glow utilities, retype
   the scale. (Everything re-skins from here.)
2. **Hero** — build option A (+ the framed B section).
3. **Header + footer** — minimal chrome.
4. **Sections** — categories index, winners photo grid, BREED/objectives, CTA.
5. **Motion pass** — strip filler, add editorial reveals + marquee.
6. **QA** — contrast/accessibility on the light theme, responsive, perf.

## 8. Decisions — locked

1. **Canvas:** ✅ dual-tone — dark-gold brand blocks **+** light editorial sections
   (reconciles "light editorial" with "match the flyer"; see §0).
2. **Brand:** ✅ stays dark-gold; light sections are editorial contrast, not a
   rebrand.
3. **Hero:** ✅ both — concept-overlap hero, then your framed-photo-left /
   spinning-trophy-right section.
4. **Fonts:** Manrope carries the oversized lowercase display; serifs demote to the
   wordmark. _(Confirm if you'd prefer a different grotesque.)_
5. **Photography:** ✅ you'll supply real ceremony/winner photos — drop them in
   `frontend/public/brand/photos/` and I'll frame them. Until then, empty-frame
   placeholders sized to the real crops.

## 9. First build step

Phase 1 = **tokens + globals**: introduce the two flat surfaces, delete every
gradient/glow/particle/orbit utility, and retype the scale (oversized lowercase
Manrope). Everything re-skins from there, so it's the right place to start and the
fastest way for you to feel the new direction.
