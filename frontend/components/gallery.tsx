import { Reveal } from "./reveal";

// Curated 2025 shoot, pre-optimized to responsive WebP (public/brand/photos/gallery).
// Each entry carries the 800w output's intrinsic size so the browser reserves the
// right box (no layout shift) even though the masonry renders at fluid widths.
const IMAGES: { n: string; w: number; h: number }[] = [
  { n: "g01", w: 800, h: 533 }, { n: "g02", w: 800, h: 717 },
  { n: "g03", w: 800, h: 459 }, { n: "g04", w: 800, h: 580 },
  { n: "g05", w: 800, h: 533 }, { n: "g06", w: 800, h: 533 },
  { n: "g07", w: 800, h: 640 }, { n: "g08", w: 800, h: 505 },
  { n: "g09", w: 800, h: 519 }, { n: "g10", w: 800, h: 559 },
  { n: "g11", w: 800, h: 647 }, { n: "g12", w: 800, h: 599 },
  { n: "g13", w: 800, h: 595 }, { n: "g14", w: 800, h: 533 },
  { n: "g15", w: 800, h: 535 }, { n: "g16", w: 800, h: 544 },
  { n: "g17", w: 800, h: 610 }, { n: "g18", w: 800, h: 569 },
  { n: "g19", w: 800, h: 510 }, { n: "g20", w: 800, h: 533 },
];

const BASE = "/brand/photos/gallery";
// Rendered at ~300px in the 4-col masonry, ~1/3 vw on tablet, ~1/2 vw on phone.
const SIZES = "(min-width: 1024px) 300px, (min-width: 768px) 33vw, 50vw";

export function Gallery() {
  return (
    <section id="gallery" className="surface-dark border-y border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-4">
            <span className="eyebrow text-gold">The 2025 Ceremony</span>
            <h2 className="display text-[clamp(2.5rem,6vw,5rem)] text-ink">
              the night in pictures
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
            A world-class celebration of the people who make Redemption City
            extraordinary — relive the previous edition.
          </p>
        </Reveal>

        <Reveal className="mt-12 columns-2 gap-4 md:columns-3 lg:columns-4">
          {IMAGES.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.n}
              src={`${BASE}/${img.n}-800.webp`}
              srcSet={`${BASE}/${img.n}-400.webp 400w, ${BASE}/${img.n}-800.webp 800w`}
              sizes={SIZES}
              width={img.w}
              height={img.h}
              alt={`Redemption City Awards 2025 — moment ${i + 1}`}
              loading="lazy"
              decoding="async"
              className="mb-4 w-full break-inside-avoid border border-line grayscale-[0.1] transition-all duration-500 hover:grayscale-0"
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
