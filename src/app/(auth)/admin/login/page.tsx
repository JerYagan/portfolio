import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/LoginForm';
import { getAdminPageContext } from '@/lib/auth/authorization';
import { isSupabaseConfigured } from '@/lib/env';
import { uuidSchema } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin sign in' };

type LoginParams = Promise<{ next?: string | string[]; error?: string | string[] }>;

export default async function AdminLoginPage({ searchParams }: { searchParams: LoginParams }) {
  const params = await searchParams;
  const nextValue = Array.isArray(params.next) ? params.next[0] : params.next;
  const errorValue = Array.isArray(params.error) ? params.error[0] : params.error;
  const previewId = nextValue?.startsWith('/preview/') ? nextValue.slice('/preview/'.length) : '';
  const isSafeNextPath = (nextValue?.startsWith('/admin/') && !nextValue.startsWith('//') && nextValue !== '/admin/login')
    || (Boolean(nextValue?.startsWith('/preview/')) && uuidSchema.safeParse(previewId).success);
  const nextPath = isSafeNextPath && nextValue
    ? nextValue
    : '/admin';
  const currentAdmin = await getAdminPageContext();
  if (currentAdmin) redirect(nextPath);

  return (
    <main className="admin-login-page" id="main-content">
      <div className="admin-login-card">
        <Link className="admin-login-back" href="/">← Back to the portfolio</Link>
        <p className="admin-eyebrow">Private workspace</p>
        <h1>Welcome back.</h1>
        <p className="admin-login-intro">Sign in with the owner account invited through Supabase Auth.</p>
        {errorValue === 'forbidden' ? <p className="admin-alert" role="status">This account does not have admin access.</p> : null}
        <LoginForm configured={isSupabaseConfigured} nextPath={nextPath} />
      </div>
    </main>
  );
}
