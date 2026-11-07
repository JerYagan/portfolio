import type { ReactNode } from 'react';
import { PublicFooter } from '@/components/public/PublicFooter';
import { SiteHeader } from '@/components/site-header';
import { getPublicProfile } from '@/lib/data/portfolio';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  let displayName = 'Your Name';
  try {
    displayName = (await getPublicProfile()).displayName;
  } catch {
    // Keep public navigation available during a temporary profile service outage.
  }

  return (
    <>
      <SiteHeader displayName={displayName} />
      {children}
      <PublicFooter displayName={displayName} />
    </>
  );
}
