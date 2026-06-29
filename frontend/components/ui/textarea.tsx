import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full min-h-32 resize-y rounded-xl border border-line bg-bg px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-muted/50 focus:border-gold/60 disabled:opacity-60 aria-[invalid=true]:border-red-500/70",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
