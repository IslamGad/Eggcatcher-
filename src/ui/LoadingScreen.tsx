/**
 * Shown as the Suspense fallback while AssetPreloader loads every game
 * texture up front. Sits on the same sky-blue the Canvas clears to and the
 * body background resolves to (see index.css) so there's no color flash
 * between "before React mounts", "loading", and "first game frame" — just
 * one steady background with a spinner on top.
 */
export function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-screen__spinner" aria-hidden="true" />
      <p className="loading-screen__label">Loading Farmyard Frenzy…</p>
    </div>
  );
}
