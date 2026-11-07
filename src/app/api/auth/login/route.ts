import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { adminError, adminFailure, adminJson } from '@/lib/http/admin-response';
import { readJsonBody } from '@/lib/http/admin-request';
import { badOriginResponse, isSameOriginMutation } from '@/lib/auth/authorization';
import { signInSchema } from '@/lib/validation/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return badOriginResponse();
  if (!isSupabaseConfigured) return adminError('SERVICE_UNAVAILABLE', 'Authentication is not configured.', 503);
  const parsed = await readJsonBody(request, signInSchema);
  if ('response' in parsed) return parsed.response;

  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return adminError('UNAUTHENTICATED', 'Sign-in failed. Check your credentials and try again.', 401);

  const { data: membership, error: membershipError } = await client.from('admin_users')
    .select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (membershipError) {
    await client.auth.signOut({ scope: 'local' });
    return adminFailure();
  }
  if (!membership) {
    await client.auth.signOut({ scope: 'local' });
    return adminError('FORBIDDEN', 'This account does not have admin access.', 403);
  }

  return adminJson({ authenticated: true });
}
