import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminError } from '@/lib/http/admin-response';
import { isSupabaseConfigured } from '@/lib/env';

export async function requireAdmin() {
  if (!isSupabaseConfigured) return { response: adminError('SERVICE_UNAVAILABLE', 'Authentication is not configured.', 503) } as const;
  const client = await createSupabaseServerClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) {
    return { response: adminError('UNAUTHENTICATED', 'Sign in to continue.', 401) } as const;
  }

  const { data: membership, error: membershipError } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (membershipError) return { response: adminError('INTERNAL_ERROR', 'Authorization could not be checked.', 500) } as const;
  if (!membership) return { response: adminError('FORBIDDEN', 'You do not have access to the admin area.', 403) } as const;

  return { client, user: authData.user } as const;
}

export async function getAdminPageContext(): Promise<{ user: User } | null> {
  if (!isSupabaseConfigured) return null;
  const client = await createSupabaseServerClient();
  const { data: authData } = await client.auth.getUser();
  if (!authData.user) return null;
  const { data: membership, error } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (error || !membership) return null;
  return { user: authData.user };
}

export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

export function badOriginResponse() {
  return adminError('FORBIDDEN', 'This request origin is not allowed.', 403);
}
