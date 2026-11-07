import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { SignOutButton } from '@/components/admin/SignOutButton';

export function AdminShell({ children, email }: { children: ReactNode; email: string }) {
  return (
    <div className="admin-app">
      <header className="admin-topbar">
        <Link aria-label="Portfolio admin overview" className="admin-brand" href="/admin">
          <span aria-hidden="true" className="admin-brand__mark">✳</span>
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
