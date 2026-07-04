"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Root error boundary — replaces Next's default white screen (jarring against
 *  the dark brand) with an on-brand recovery UI when a render throws. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console/monitoring; the digest correlates with server logs.
    console.error(error);
  }, [error]);

  return (
    <main className="surface-dark flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-xs uppercase tracking-[0.3em] text-gold">
        Something went wrong
      </p>
      <h1 className="font-serif text-3xl text-ink">This page hit a snag</h1>
      <p className="max-w-md text-sm text-ink-muted">
        Sorry — an unexpected error occurred. You can try again, or head back to
        the homepage.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-bg"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-line px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-gold/50"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
