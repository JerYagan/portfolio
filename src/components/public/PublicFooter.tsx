import Link from 'next/link';

export function PublicFooter({ displayName }: { displayName: string }) {
  return (
    <footer className="site-footer page-frame">
      <span>© {new Date().getFullYear()} {displayName}</span>
      <span>Made with care, wherever you are.</span>
      <Link href="#main-content">Back to top ↑</Link>
    </footer>
  );
}
