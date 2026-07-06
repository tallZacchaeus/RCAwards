"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Both images are 16:9 designed banners with their own branding baked in.
const SLIDES = [
  {
    src: "/brand/hero/hero-1.webp",
    alt: "The Redemption City Awards of Excellence 2026 — powered by City Breed",
  },
  {
    src: "/brand/hero/hero-2.webp",
    alt: "Past honourees of the Redemption City Awards holding their trophies — celebrating the best of the best",
  },
];

const INTERVAL_MS = 6000;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Auto-advance, paused on hover/focus and under reduced-motion.
  useEffect(() => {
    if (paused || reduced.current || SLIDES.length < 2) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [paused, active]);

  const go = useCallback(
    (i: number) => setActive((i + SLIDES.length) % SLIDES.length),
    []
  );

  return (
    <div
      className="group relative w-full overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Event highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative aspect-[16/9] w-full bg-bg">
        {SLIDES.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            aria-hidden={i !== active}
            draggable={false}
            width={1920}
            height={1080}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            decoding="async"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none",
              i === active ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
      </div>

      {SLIDES.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-white/90 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-white/90 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1} of ${SLIDES.length}`}
                aria-current={i === active}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === active ? "w-6 bg-gold" : "w-2 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
