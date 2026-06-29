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
              className="overflow-hidden rounded-2xl border border-line bg-bg-raised/50"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-serif text-lg text-ink">{item.q}</span>
                <span
                  className={cn(
                    "text-xl text-gold transition-transform duration-300",
                    isOpen && "rotate-45"
                  )}
                >
                  +
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm leading-relaxed text-ink-muted">
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
