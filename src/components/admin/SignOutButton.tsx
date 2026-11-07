'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    setPending(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Sign-out failed.');
      router.replace('/admin/login'); router.refresh();
    } catch {
      setError('Sign-out failed. Please try again.'); setPending(false);
    }
  }

  return <div className="admin-signout-wrap"><button className="admin-signout" disabled={pending} onClick={signOut} type="button">{pending ? 'Signing out…' : 'Sign out'}</button>{error ? <span role="alert">{error}</span> : null}</div>;
}
