"use client";

import { useEffect, useRef } from "react";

/** A single, subtle dot that lags slightly behind the cursor. Desktop-only,
 *  low-opacity, and disabled under reduced motion — a restrained touch, not a
 *  particle trail. */
export function CursorTrail() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return; // no touch devices

    const el = dot.current;
    if (!el) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let visible = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        el.style.opacity = "1";
      }
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    const tick = () => {
      x += (tx - x) * 0.15; // gentle lag
      y += (ty - y) * 0.15;
      el.style.transform = `translate3d(${x - 5}px, ${y - 5}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[60] h-2.5 w-2.5 rounded-full opacity-0 transition-opacity duration-300 mix-blend-difference"
      style={{ background: "var(--color-gold)" }}
    />
  );
}
