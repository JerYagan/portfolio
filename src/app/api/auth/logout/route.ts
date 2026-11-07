import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { adminError } from '@/lib/http/admin-response';
import { isSameOriginMutation } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return adminError('FORBIDDEN', 'This request origin is not allowed.', 403);
  if (!isSupabaseConfigured) return adminError('SERVICE_UNAVAILABLE', 'Authentication is not configured.', 503);
  const client = await createSupabaseServerClient();
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) return adminError('INTERNAL_ERROR', 'Sign-out failed. Please try again.', 500);
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
