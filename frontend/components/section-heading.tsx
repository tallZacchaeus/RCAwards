import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="font-display text-xs uppercase tracking-[0.42em] text-gold">
          {eyebrow}
        </span>
      )}
      <h2 className="font-serif text-4xl leading-[1.05] text-ink sm:text-5xl md:text-6xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "max-w-2xl font-accent text-lg text-ink-muted sm:text-xl",
            align === "center" ? "mx-auto" : ""
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
