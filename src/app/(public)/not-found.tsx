import Link from 'next/link';

export default function PublicNotFound() {
  return (
    <main className="page-frame not-found" id="main-content">
      <p className="eyebrow">404 · page not found</p>
      <h1>This page went wandering.</h1>
      <p>The address may have changed, or this page may still be on the drawing board.</p>
      <Link className="button button--primary" href="/work">Browse the work <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
