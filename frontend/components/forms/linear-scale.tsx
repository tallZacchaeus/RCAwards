"use client";

import { cn } from "@/lib/utils";

export function LinearScale({
  value,
  onChange,
  invalid,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  invalid?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "grid grid-cols-10 gap-1.5",
          invalid && "rounded-xl ring-1 ring-red-500/50"
        )}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={active}
              className={cn(
                "btn-press focus-ring aspect-square rounded-lg border text-sm font-medium",
                active
                  ? "border-gold bg-gold text-bg"
                  : "border-line text-ink-muted hover:border-gold/50 hover:text-gold"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-ink-muted/70">
        <span>1 — Poor</span>
        <span>10 — Excellent</span>
      </div>
    </div>
  );
}
