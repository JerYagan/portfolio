import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminPageContext } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const context = await getAdminPageContext();
  if (!context) redirect('/admin/login?error=forbidden');
  return <AdminShell email={context.user.email ?? 'Owner'}>{children}</AdminShell>;
}
