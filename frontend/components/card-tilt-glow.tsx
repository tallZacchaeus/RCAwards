import { cn } from "@/lib/utils";

/* Flat pass-through. The cursor tilt/glow was removed in the editorial overhaul;
   the API is kept so existing call sites need no change. */
export function CardTiltGlow({
  children,
  className,
  as: Component = "article",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  glowColor?: string;
  tiltMax?: number;
  perspective?: number;
  [key: string]: unknown;
}) {
  // Drop non-DOM tuning props so they don't leak onto the element.
  const { glowColor: _g, tiltMax: _t, perspective: _p, ...domProps } = rest;
  void _g;
  void _t;
  void _p;
  return (
    <Component
      className={cn("group relative transition-colors duration-300", className)}
      {...domProps}
    >
      {children}
    </Component>
  );
}
