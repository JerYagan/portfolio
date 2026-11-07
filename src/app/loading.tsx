export default function Loading() {
  return (
    <main aria-busy="true" aria-live="polite" className="page-frame loading-state" id="main-content">
      <span aria-hidden="true" className="loading-state__mark">
        ✳
      </span>
      <p>Arranging the page…</p>
    </main>
  );
}
