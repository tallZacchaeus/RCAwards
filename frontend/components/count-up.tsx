"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * A number that counts up with GSAP when it scrolls into view.
 *
 * Uses IntersectionObserver to trigger (not GSAP ScrollTrigger) because Lenis's
 * virtual scroll leaves native scrollY at 0, which prevents ScrollTrigger from
 * firing — the same reason `Reveal` uses IntersectionObserver. Reduced-motion
 * users see the final value immediately.
 */
export function CountUp({
  to,
  suffix = "",
  duration = 1.4,
  className,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }

    const counter = { n: 0 };
    let tween: gsap.core.Tween | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        tween = gsap.to(counter, {
          n: to,
          duration,
          ease: "power2.out",
          onUpdate: () => setValue(Math.round(counter.n)),
        });
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
