import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  submitted: "border-ink-muted/30 bg-ink-muted/10 text-ink-muted",
  shortlisted: "border-gold/40 bg-gold/10 text-gold-hi",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2.5 py-0.5 text-xs capitalize",
        STYLES[status] ?? STYLES.submitted
      )}
    >
      {status}
    </span>
  );
}
