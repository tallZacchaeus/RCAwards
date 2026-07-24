"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = container.current;
      if (!el) return;

      // Find stagger targets. First try elements with explicit class,
      // fallback to direct children if none exist.
      let targets: Element[] = Array.from(el.querySelectorAll(".page-stagger-item"));
      if (targets.length === 0) {
        targets = Array.from(el.children);
      }

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
        }
      );
    },
    { scope: container }
  );

  return (
    <div ref={container} className="w-full flex flex-col flex-1">
      {children}
    </div>
  );
}
