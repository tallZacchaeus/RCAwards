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

  // Once the event has started, don't sit on a frozen "00 00 00 00".
  const isOver =
    mounted && time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0;
  if (isOver) {
    return (
      <div className="flex flex-col gap-2">
        <span className="display text-[clamp(2rem,6vw,4rem)] leading-none text-gold">
          The night has arrived
        </span>
        <span className="eyebrow text-ink-muted">
          {EVENT.dateLabel} · Celebrating excellence
        </span>
      </div>
    );
  }

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4 sm:gap-x-12">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-end gap-8 sm:gap-12">
          <div className="flex flex-col">
            <span className="display text-[clamp(2.75rem,8vw,6rem)] leading-none text-ink tabular-nums">
              {mounted ? String(u.value).padStart(2, "0") : "––"}
            </span>
            <span className="eyebrow mt-2 text-ink-muted">{u.label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="mb-6 hidden h-12 w-px bg-line sm:block" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}
