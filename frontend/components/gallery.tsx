import { Reveal } from "./reveal";

// Curated, web-optimized selection from the 2025 shoot (public/brand/photos/gallery).
const IMAGES = [
  "g01", "g02", "g03", "g04", "g05", "g06", "g07", "g08",
  "g09", "g11", "g12", "g13", "g14", "g15", "g16",
].map((n) => `/brand/photos/gallery/${n}.jpg`);

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
          {IMAGES.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`Redemption City Awards 2025 — moment ${i + 1}`}
              loading="lazy"
              className="mb-4 w-full break-inside-avoid border border-line grayscale-[0.1] transition-all duration-500 hover:grayscale-0"
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
