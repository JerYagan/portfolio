import type { SupabaseClient } from '@supabase/supabase-js';

const bucket = 'portfolio-media';

export async function findReferencedPaths(
  client: SupabaseClient,
  paths: string[],
  excludeEntryId?: string,
): Promise<Set<string> | null> {
  const uniquePaths = [...new Set(paths)];
  if (uniquePaths.length === 0) return new Set();

  const profileQuery = client.from('profile').select('avatar_path').in('avatar_path', uniquePaths);
  let entriesQuery = client.from('portfolio_entries').select('thumbnail_path').in('thumbnail_path', uniquePaths);
  let mediaQuery = client.from('portfolio_media').select('object_path').in('object_path', uniquePaths);
  if (excludeEntryId) {
    entriesQuery = entriesQuery.neq('id', excludeEntryId);
    mediaQuery = mediaQuery.neq('entry_id', excludeEntryId);
  }

  const [profile, entries, media] = await Promise.all([profileQuery, entriesQuery, mediaQuery]);
  if (profile.error || entries.error || media.error) return null;

  const referenced = new Set<string>();
  for (const row of profile.data ?? []) if (row.avatar_path) referenced.add(row.avatar_path);
  for (const row of entries.data ?? []) if (row.thumbnail_path) referenced.add(row.thumbnail_path);
  for (const row of media.data ?? []) if (row.object_path) referenced.add(row.object_path);
  return referenced;
}

export async function removeStoragePaths(client: SupabaseClient, paths: string[]): Promise<string[]> {
  const uniquePaths = [...new Set(paths)];
  if (uniquePaths.length === 0) return [];
  const { error } = await client.storage.from(bucket).remove(uniquePaths);
  if (!error) return [];
  if (String(error.statusCode ?? '') === '404') return [];
  return uniquePaths;
}

export async function signAdminPath(client: SupabaseClient, path: string | null): Promise<string | null> {
  if (!path?.startsWith('portfolio/')) return null;
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, 5 * 60);
  return error ? null : data?.signedUrl ?? null;
}
