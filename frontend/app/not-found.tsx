import Link from "next/link";

/** Branded 404, replacing Next's default. */
export default function NotFound() {
  return (
    <main className="surface-dark flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-xs uppercase tracking-[0.3em] text-gold">
        404
      </p>
      <h1 className="font-serif text-3xl text-ink">Page not found</h1>
      <p className="max-w-md text-sm text-ink-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-bg"
      >
        Back to home
      </Link>
    </main>
  );
}
