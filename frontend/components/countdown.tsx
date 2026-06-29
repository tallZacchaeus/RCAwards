"use client";

import { useEffect, useState } from "react";
import { EVENT } from "@/lib/site";

function diff(target: number) {
  const total = Math.max(0, target - Date.now());
  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total / 3_600_000) % 24),
    minutes: Math.floor((total / 60_000) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
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
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex min-w-[78px] flex-col items-center rounded-2xl border border-gold/30 bg-bg-raised/70 px-5 py-4 sm:min-w-[110px]"
        >
          <span className="font-serif text-4xl text-metallic tabular-nums sm:text-6xl">
            {mounted ? String(u.value).padStart(2, "0") : "––"}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-ink-muted sm:text-xs">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}
