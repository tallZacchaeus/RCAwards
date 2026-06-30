"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT } from "@/lib/site";

function diff(target: number) {
  const total = Math.max(0, target - Date.now());
  return {
    days:    Math.floor(total / 86_400_000),
    hours:   Math.floor((total / 3_600_000) % 24),
    minutes: Math.floor((total / 60_000) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

/** A single animated digit block with flip animation on change */
function FlipDigit({ value, label }: { value: number; label: string }) {
  const prev = useRef(value);
  const [flipping, setFlipping] = useState(false);
  const displayValue = String(value).padStart(2, "0");

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 360);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="group relative flex min-w-[80px] flex-col items-center overflow-hidden rounded-2xl border border-gold/25 bg-bg-raised/70 px-5 py-4 transition-all duration-500 hover:border-gold/50 hover:bg-bg-elevated sm:min-w-[112px]">
      {/* Inner gold glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(50% 50% at 50% 100%, rgba(201,162,75,0.12), transparent)" }}
      />

      <span
        className={`font-serif text-4xl text-metallic tabular-nums sm:text-6xl flip-digit ${flipping ? "is-flipping" : ""}`}
      >
        {displayValue}
      </span>
      <span className="mt-1.5 text-[10px] uppercase tracking-[0.3em] text-ink-muted sm:text-xs">
        {label}
      </span>
    </div>
  );
}

export function Countdown() {
  const target = new Date(EVENT.dateISO).getTime();
  const [time, setTime] = useState(() => diff(target));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    { label: "Days",    value: time.days },
    { label: "Hours",   value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  if (!mounted) {
    // Skeleton placeholders to avoid layout shift
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
          <div
            key={label}
            className="flex min-w-[80px] flex-col items-center rounded-2xl border border-gold/25 bg-bg-raised/70 px-5 py-4 sm:min-w-[112px]"
          >
            <span className="font-serif text-4xl text-metallic/30 sm:text-6xl">––</span>
            <span className="mt-1.5 text-[10px] uppercase tracking-[0.3em] text-ink-muted/50 sm:text-xs">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      {units.map((u) => (
        <FlipDigit key={u.label} value={u.value} label={u.label} />
      ))}
    </div>
  );
}
