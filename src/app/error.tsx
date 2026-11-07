'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page-frame not-found" id="main-content">
      <p className="eyebrow">Something didn’t load</p>
      <h1>Let’s try that again.</h1>
      <p>The page hit a snag. Your place here is safe.</p>
      <button className="button button--primary" onClick={reset} type="button">
        Try again <span aria-hidden="true">↻</span>
      </button>
    </main>
  );
}
