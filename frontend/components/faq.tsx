"use client";

import { useState } from "react";
import { FAQ as FAQ_ITEMS } from "@/lib/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-28 sm:px-8">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />

      <Reveal className="mt-12 flex flex-col gap-3">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={cn(
                "overflow-hidden rounded-2xl border transition-all duration-300",
                isOpen
                  ? "border-gold/40 bg-bg-elevated shadow-[0_0_24px_-8px_rgba(201,162,75,0.2)]"
                  : "border-line bg-bg-raised/50 hover:border-gold/20"
              )}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={isOpen}
                id={`faq-btn-${i}`}
                aria-controls={`faq-panel-${i}`}
              >
                <span
                  className={cn(
                    "font-serif text-lg transition-colors duration-300",
                    isOpen ? "text-gold-hi" : "text-ink"
                  )}
                >
                  {item.q}
                </span>
                <span
                  className={cn(
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all duration-300",
                    isOpen
                      ? "border-gold bg-gold/20 text-gold rotate-45"
                      : "border-line text-ink-muted"
                  )}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>

              {/* CSS grid-rows accordion — works in all modern browsers */}
              <div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-btn-${i}`}
                className={cn(
                  "grid transition-all duration-500",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
                style={{
                  transitionTimingFunction: isOpen
                    ? "cubic-bezier(0.16, 1, 0.3, 1)"
                    : "cubic-bezier(0.7, 0, 0.84, 0)",
                }}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 pt-1 text-sm leading-relaxed text-ink-muted">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
