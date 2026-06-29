"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger direct children instead of revealing the container as one block. */
  stagger?: boolean;
  delay?: number;
  y?: number;
};

/** Scroll-triggered reveal. GPU-only transforms (opacity/translate), fires once,
 *  and degrades to an instant visible state under reduced-motion. */
export function Reveal({
  children,
  className,
  stagger = false,
  delay = 0,
  y = 28,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const targets = stagger ? Array.from(el.children) : el;
      gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.9,
        delay,
        ease: "power3.out",
        stagger: stagger ? 0.1 : 0,
        scrollTrigger: { trigger: el, start: "top 82%", once: true },
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
