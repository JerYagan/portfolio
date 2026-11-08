import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { SignOutButton } from '@/components/admin/SignOutButton';

export function AdminShell({ children, email }: { children: ReactNode; email: string }) {
  return (
    <div className="admin-app">
      <header className="admin-topbar">
        <Link aria-label="Portfolio admin overview" className="admin-brand" href="/admin">
          <Image alt="" className="admin-brand__mark" height={30} src="/images/SVG/portfolio-logo.svg" width={30} />
          <span>Portfolio CMS</span>
        </Link>
        <div className="admin-topbar__account"><span>{email}</span><SignOutButton /></div>
      </header>
      <div className="admin-workspace">
        <AdminNavigation />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
