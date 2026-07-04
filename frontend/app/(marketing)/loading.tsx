/** Shown while a marketing route's server data is loading, so navigation gives
 *  immediate feedback instead of a frozen previous page. */
export default function Loading() {
  return (
    <div className="surface-dark flex min-h-[60vh] items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold"
      />
    </div>
  );
}
