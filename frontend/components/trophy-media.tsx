"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const WEBM = "/brand/award-3d.webm";
const GIF = "/brand/award-3d.gif";
const ALT = "The Redemption City Award of Excellence trophy";

/** The spinning trophy. Serves a tiny alpha WebM where supported (Chrome/Firefox/
 *  Edge) and falls back to the GIF on Safari, which lacks VP9-alpha. */
export function TrophyMedia({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const [mode, setMode] = useState<"video" | "gif">("video");

  useEffect(() => {
    const canWebm = document
      .createElement("video")
      .canPlayType('video/webm; codecs="vp9"');
    if (!canWebm) setMode("gif");
  }, []);

  if (mode === "gif") {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img src={GIF} alt={ALT} className={cn(className)} style={style} draggable={false} />
    );
  }

  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      aria-label={ALT}
      className={cn("object-contain", className)}
      style={style}
    >
      <source src={WEBM} type="video/webm" />
    </video>
  );
}
