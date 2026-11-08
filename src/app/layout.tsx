import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { env } from '@/lib/env';

const themeInitialization = `(() => {
  try {
    const mode = localStorage.getItem('portfolio-theme');
    if (mode === 'light' || mode === 'dark') document.documentElement.dataset.theme = mode;
  } catch {}
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  icons: {
    icon: [
      { url: '/images/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/favicon_io/favicon.ico', sizes: 'any' },
    ],
    apple: '/images/favicon_io/apple-touch-icon.png',
  },
  manifest: '/images/favicon_io/site.webmanifest',
  title: {
    default: 'Portfolio',
    template: '%s — Portfolio',
  },
  description: 'A personal portfolio of websites, graphic design, drawings, and digital systems.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme-initialization" strategy="beforeInteractive">
          {themeInitialization}
        </Script>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
