"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const parts = Array.from(el.querySelectorAll<HTMLElement>(".sh-part"));

    // Set initial hidden state
    parts.forEach((part, i) => {
      part.style.opacity = "0";
      part.style.transform = "translateY(20px)";
      part.style.transition = `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`;
      part.style.willChange = "opacity, transform";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        parts.forEach((part) => {
          part.style.opacity = "1";
          part.style.transform = "translateY(0)";
          part.style.willChange = "auto";
        });
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <div className="sh-part flex items-center gap-3">
          <span className="h-px w-6 bg-gold/50" aria-hidden="true" />
          <span className="font-display text-xs uppercase tracking-[0.42em] text-gold">
            {eyebrow}
          </span>
          <span className="h-px w-6 bg-gold/50" aria-hidden="true" />
        </div>
      )}

      <h2 className="sh-part font-serif text-4xl leading-[1.05] text-ink sm:text-5xl md:text-6xl">
        {title}
      </h2>

      {subtitle && (
        <p
          className={cn(
            "sh-part max-w-2xl font-accent text-lg text-ink-muted sm:text-xl",
            align === "center" ? "mx-auto" : ""
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
