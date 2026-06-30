"use client";

import { useState } from "react";
import { FAQ as FAQ_ITEMS } from "@/lib/site";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="surface-paper">
      <div className="mx-auto max-w-4xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal className="mb-12 flex flex-col gap-4">
          <span className="eyebrow text-gold-deep">FAQ</span>
          <h2 className="display text-[clamp(2.5rem,6vw,5rem)] text-graphite">
            questions, answered
          </h2>
        </Reveal>

        <Reveal>
          <ul>
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={i} className="border-t border-rule last:border-b">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                    aria-expanded={isOpen}
                    id={`faq-btn-${i}`}
                    aria-controls={`faq-panel-${i}`}
                  >
                    <span className="font-serif text-xl text-graphite sm:text-2xl">
                      {item.q}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-2xl text-gold-deep transition-transform duration-300",
                        isOpen && "rotate-45"
                      )}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-btn-${i}`}
                    className={cn(
                      "grid transition-all duration-500",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-2xl pb-6 text-sm leading-relaxed text-slate sm:text-base">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
