'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm({ nextPath, configured }: { nextPath: string; configured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!response.ok) {
        const result = await response.json() as { error?: { code?: string; message?: string } };
        setError(result.error?.message ?? 'Sign-in failed. Check your credentials and try again.');
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError('Sign-in is unavailable right now. Please try again later.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      {!configured ? <p className="admin-alert" role="alert">Supabase is not configured for this application.</p> : null}
      <label htmlFor="admin-email">Email address</label>
      <input autoComplete="username" disabled={!configured || pending} id="admin-email" name="email" required type="email" />
      <label htmlFor="admin-password">Password</label>
      <input autoComplete="current-password" disabled={!configured || pending} id="admin-password" name="password" required type="password" />
      {error ? <p className="admin-alert" role="alert">{error}</p> : null}
      <button className="admin-button admin-button--primary" disabled={!configured || pending} type="submit">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="admin-form-note">Owner access is invite-only. There is no public registration.</p>
    </form>
  );
}
