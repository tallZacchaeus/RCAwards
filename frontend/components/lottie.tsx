"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { DotLottie } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/utils";

// Lazy-load the player so it never ships in the server bundle and only loads
// on the client when a Lottie is actually rendered.
const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
  { ssr: false }
);

type LottieProps = {
  /** Path under /public, e.g. "/lottie/star.json". */
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  /** Start paused; play while hovered/focused (for cards). */
  playOnHover?: boolean;
};

/** Brand-aware Lottie wrapper. Honours prefers-reduced-motion by rendering a
 *  static first frame instead of animating. */
export function Lottie({
  src,
  className,
  loop = true,
  autoplay = true,
  playOnHover = false,
}: LottieProps) {
  const [reduced, setReduced] = useState(false);
  const instance = useRef<DotLottie | null>(null);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const hoverHandlers = playOnHover
    ? {
        onMouseEnter: () => !reduced && instance.current?.play(),
        onMouseLeave: () => instance.current?.stop(),
        onFocus: () => !reduced && instance.current?.play(),
        onBlur: () => instance.current?.stop(),
      }
    : {};

  return (
    <div className={cn("pointer-events-none", className)} {...hoverHandlers}>
      <DotLottieReact
        src={src}
        loop={loop && !reduced}
        autoplay={autoplay && !reduced && !playOnHover}
        dotLottieRefCallback={(dl) => {
          instance.current = dl;
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
