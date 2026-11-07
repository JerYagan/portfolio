import { createServerClient as createSsrServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env, requireSupabaseEnvironment } from '@/lib/env';

export async function createSupabaseServerClient() {
  const { url, publishableKey } = requireSupabaseEnvironment();
  const cookieStore = await cookies();

  return createSsrServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || env.siteUrl.startsWith('https://'),
            sameSite: 'lax',
            path: '/',
          }));
        } catch {
          // Server Components cannot write cookies. `proxy.ts` refreshes sessions for each request.
        }
      },
    },
  });
}
