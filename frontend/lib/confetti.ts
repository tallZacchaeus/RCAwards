import confetti from "canvas-confetti";

const GOLD = ["#C9A24B", "#D4AF37", "#F8E7A1", "#FCEFB4", "#8C6A1F"];

/** A celebratory gold burst — two side cannons plus a centre pop.
 *  No-ops on the server and under prefers-reduced-motion. */
export function fireConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  confetti({
    particleCount: 90,
    spread: 95,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: GOLD,
    scalar: 1.1,
    ticks: 220,
  });

  const end = Date.now() + 900;
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      startVelocity: 55,
      origin: { x: 0, y: 0.7 },
      colors: GOLD,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      startVelocity: 55,
      origin: { x: 1, y: 0.7 },
      colors: GOLD,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
