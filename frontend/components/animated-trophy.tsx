"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

const TROPHY_SRC = "/brand/trophy.png";

// Deterministic sparkles rising around the trophy (no Math.random → no SSR drift).
const SPARKLES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 53) % 100,
  bottom: (i * 29) % 70,
  size: 1.5 + ((i * 7) % 3),
  delay: (i % 8) * 0.6,
  duration: 6 + ((i * 5) % 6),
  opacity: 0.3 + ((i % 4) * 0.12),
}));

export function AnimatedTrophy({
  className,
  imgHeightClass = "h-[clamp(340px,46vh,540px)]",
  scrollReactive = true,
}: {
  className?: string;
  imgHeightClass?: string;
  scrollReactive?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const scrollWrap = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);

  // Pointer-driven 3D tilt + entrance (GSAP).
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = root.current;
      const card = tilt.current;
      if (!el || !card) return;

      gsap.from(card, {
        autoAlpha: 0,
        scale: 0.85,
        yPercent: 6,
        duration: 1.2,
        ease: "power3.out",
      });

      const qx = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3" });
      const qy = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3" });

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        qy(x * 18);
        qx(-y * 12);
      };
      const onLeave = () => {
        qx(0);
        qy(0);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: root }
  );

  // Scroll-reactive parallax rise + gentle turn. Reads getBoundingClientRect so
  // it works regardless of native vs. Lenis virtual scroll.
  useEffect(() => {
    if (!scrollReactive) return;
    const wrap = scrollWrap.current;
    const el = root.current;
    if (!wrap || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = r.top + r.height / 2;
      // 0 when the trophy enters from the bottom, 1 when it exits at the top.
      const p = Math.max(0, Math.min(1, (vh - center) / vh));
      const lift = (0.5 - p) * 46; // px — rises as you scroll down
      const turn = (p - 0.5) * 22; // deg — turns to face you on the way past
      wrap.style.transform = `translateY(${lift}px) rotateY(${turn}deg)`;
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [scrollReactive]);

  return (
    <div
      ref={root}
      className={cn("relative flex items-center justify-center", className)}
      style={{ perspective: "1200px" }}
    >
      {/* Breathing glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[46%] h-[68%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(201,162,75,0.28), transparent 65%)",
          filter: "blur(26px)",
          animation: "glowBreath 6s ease-in-out infinite",
        }}
      />

      {/* Rising sparkles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-gold-hi"
            style={{
              left: `${s.left}%`,
              bottom: `${s.bottom}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animation: `floatUp ${s.duration}s linear ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Scroll-reactive wrapper */}
      <div ref={scrollWrap} className="relative" style={{ transformStyle: "preserve-3d" }}>
        {/* Pointer-tilt wrapper */}
        <div ref={tilt} className="relative" style={{ transformStyle: "preserve-3d" }}>
          <div className="trophy-float relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TROPHY_SRC}
              alt="The Redemption City Award of Excellence trophy"
              draggable={false}
              className={cn("relative z-10 w-auto select-none", imgHeightClass)}
              style={{
                filter:
                  "drop-shadow(0 30px 40px rgba(0,0,0,0.55)) drop-shadow(0 0 26px rgba(201,162,75,0.22))",
              }}
            />

            {/* Specular glint, clipped to the trophy's silhouette */}
            <div
              aria-hidden="true"
              className="trophy-shine pointer-events-none absolute inset-0 z-20"
              style={{
                WebkitMaskImage: `url(${TROPHY_SRC})`,
                maskImage: `url(${TROPHY_SRC})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />

            {/* Faint floor reflection */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-full h-[28%] w-full"
              style={{
                backgroundImage: `url(${TROPHY_SRC})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "top center",
                transform: "scaleY(-1)",
                opacity: 0.1,
                filter: "blur(2px)",
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
