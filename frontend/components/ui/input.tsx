import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "w-full rounded-lg border border-line bg-bg px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/50 focus:border-gold/60 focus:ring-1 focus:ring-gold/25 disabled:opacity-60 aria-[invalid=true]:border-red-500/70",
        className
      )}
      {...props}
    />
  );
}

export { Input };
