import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin, badOriginResponse, isSameOriginMutation } from '@/lib/auth/authorization';
import { adminError, adminFailure, adminJson } from '@/lib/http/admin-response';
import { readJsonBody } from '@/lib/http/admin-request';
import { revalidatePortfolio } from '@/lib/http/revalidate-portfolio';
import { findReferencedPaths, removeStoragePaths, signAdminPath } from '@/lib/data/admin-media';
import { updateProfileSchema } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

const profileColumns = 'id,display_name,headline,bio,location,contact_url,avatar_path,avatar_alt,skills,social_links,updated_at';

export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const { data, error } = await auth.client.from('profile').select(profileColumns).eq('id', 1).maybeSingle();
  if (error) return adminFailure();
  if (!data) return adminError('NOT_FOUND', 'Profile not found.', 404);
  return adminJson({ ...data, avatar_preview_url: await signAdminPath(auth.client, data.avatar_path) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const parsed = await readJsonBody(request, updateProfileSchema);
  if ('response' in parsed) return parsed.response;

  const patch = { ...parsed.data };
  if (patch.avatar_path === null && patch.avatar_alt === undefined) patch.avatar_alt = null;
  const { data: current, error: currentError } = await auth.client
    .from('profile')
    .select('avatar_path')
    .eq('id', 1)
    .maybeSingle();
  if (currentError) return adminFailure();
  if (!current) return adminError('NOT_FOUND', 'Profile not found.', 404);

  const { data, error } = await auth.client
    .from('profile')
    .update(patch)
    .eq('id', 1)
    .select(profileColumns)
    .single();
  if (error) return adminFailure();

  const cleanup = current.avatar_path && current.avatar_path !== data.avatar_path
    ? await cleanupUnusedPath(auth.client, current.avatar_path)
    : [];
  revalidatePortfolio();
  return adminJson({ ...data, avatar_preview_url: await signAdminPath(auth.client, data.avatar_path) }, 200, cleanup.length > 0 ? { cleanup_pending: cleanup } : undefined);
}

async function cleanupUnusedPath(client: SupabaseClient, path: string) {
  const references = await findReferencedPaths(client, [path]);
  if (!references) return [path];
  if (references.has(path)) return [];
  return removeStoragePaths(client, [path]);
}
