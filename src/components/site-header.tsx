'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader({ displayName = 'Your Name' }: { displayName?: string }) {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTravel = useRef(0);

  useEffect(() => {
    let animationFrame = 0;
    const handleScroll = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        const currentY = Math.max(0, window.scrollY);
        const movement = currentY - lastScrollY.current;

        if (currentY < 72) {
          scrollTravel.current = 0;
          setHidden(false);
        } else if (movement > 0) {
          scrollTravel.current = Math.max(0, scrollTravel.current) + movement;
          if (scrollTravel.current >= 9) {
            setHidden(true);
            setMenuOpen(false);
          }
        } else if (movement < 0) {
          scrollTravel.current = Math.min(0, scrollTravel.current) + movement;
          if (scrollTravel.current <= -9) setHidden(false);
        }

        /* Keep tiny direction changes from accumulating against each other. */
        if (movement === 0) scrollTravel.current *= 0.9;

        lastScrollY.current = currentY;
      });
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      className="site-header page-frame"
      data-hidden={hidden ? 'true' : 'false'}
      onFocusCapture={() => setHidden(false)}
    >
      <Link aria-label={`${displayName} portfolio home`} className="wordmark" href="/" onClick={closeMenu}>
        <Image alt="" className="wordmark__mark" height={36} priority src="/images/SVG/portfolio-logo.svg" width={36} />
        <span>{displayName}</span>
      </Link>

      <nav aria-label="Main navigation" className="site-nav" data-open={menuOpen ? 'true' : 'false'} id="site-navigation">
        <Link href="/work" onClick={closeMenu}>Work</Link>
        <Link href="/#contact" onClick={closeMenu}>Contact</Link>
      </nav>

      <div className="site-header__controls">
        <ThemeToggle />
        <button
          aria-controls="site-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="site-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
