"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger direct children instead of revealing the container as one block. */
  stagger?: boolean;
  delay?: number;
  y?: number;
  /** Use clip-path reveal instead of simple fade-up */
  clip?: boolean;
};

/**
 * Scroll-triggered reveal using IntersectionObserver + CSS transitions.
 *
 * We switched from GSAP ScrollTrigger to IntersectionObserver because GSAP
 * ScrollTrigger reads native window.scrollY which remains at 0 while Lenis
 * (virtual scroll) intercepts the wheel events — causing all ScrollTrigger
 * instances to never fire. IntersectionObserver works correctly regardless of
 * which scroll implementation is active.
 */
export function Reveal({
  children,
  className,
  stagger = false,
  delay = 0,
  y = 28,
  clip = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets: Element[] = stagger
      ? Array.from(el.children)
      : [el];

    // Apply initial hidden styles
    targets.forEach((t, i) => {
      const target = t as HTMLElement;
      const itemDelay = delay + (stagger ? i * 0.08 : 0);

      if (clip) {
        target.style.clipPath = "inset(0 0 24px 0)";
        target.style.opacity = "0";
      } else {
        target.style.opacity = "0";
        target.style.transform = `translateY(${y}px)`;
      }

      target.style.transition = `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${itemDelay}s, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${itemDelay}s, clip-path 0.75s cubic-bezier(0.16,1,0.3,1) ${itemDelay}s`;
      target.style.willChange = "opacity, transform";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          // Reveal all targets at once (stagger handled by CSS delay)
          targets.forEach((t) => {
            const target = t as HTMLElement;
            target.style.opacity = "1";
            target.style.transform = "translateY(0)";
            if (clip) target.style.clipPath = "inset(0 0 0 0)";
            target.style.willChange = "auto";
          });

          // Only trigger once — disconnect after first intersection
          observer.disconnect();
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    // Observe the container element
    observer.observe(el);

    return () => observer.disconnect();
  }, [stagger, delay, y, clip]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
