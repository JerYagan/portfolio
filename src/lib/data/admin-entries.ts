import type { SupabaseClient } from '@supabase/supabase-js';

export async function replaceAssociations(
  client: SupabaseClient,
  entryId: string,
  tagNames?: string[],
  tagIds?: string[],
  media?: Array<{ object_path: string; alt_text: string; caption?: string | null; media_role: 'presentation_board' | 'logo_variation' | 'supporting_image'; sort_order: number }>,
) {
  if (tagNames !== undefined || tagIds !== undefined) {
    const resolved = tagIds ?? await resolveTagNames(client, tagNames ?? []);
    if (!resolved) return 'invalid';
    const { error: deleteError } = await client.from('entry_tags').delete().eq('entry_id', entryId);
    if (deleteError) return 'database';
    if (resolved.length) {
      const { error } = await client.from('entry_tags').insert([...new Set(resolved)].map((tagId) => ({ entry_id: entryId, tag_id: tagId })));
      if (error) return error.code === '23503' ? 'invalid' : 'database';
    }
  }
  if (media !== undefined) {
    const { error: deleteError } = await client.from('portfolio_media').delete().eq('entry_id', entryId);
    if (deleteError) return 'database';
    if (media.length) {
      const { error } = await client.from('portfolio_media').insert(media.map((item) => ({ ...item, entry_id: entryId, caption: item.caption ?? null })));
      if (error) return error.code === '23503' || error.code === '23505' ? 'invalid' : 'database';
    }
  }
  return null;
}

async function resolveTagNames(client: SupabaseClient, names: string[]): Promise<string[] | null> {
  const ids: string[] = [];
  for (const name of names) {
    const slug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50).replace(/-$/g, '');
    if (!slug) return null;
    const { data: existing, error: lookupError } = await client.from('portfolio_tags').select('id').eq('slug', slug).maybeSingle();
    if (lookupError) return null;
    if (existing) { ids.push(existing.id); continue; }
    const { data: created, error: insertError } = await client.from('portfolio_tags').insert({ name, slug }).select('id').single();
    if (created) { ids.push(created.id); continue; }
    if (insertError?.code !== '23505') return null;
    const { data: raced } = await client.from('portfolio_tags').select('id').eq('slug', slug).maybeSingle();
    if (!raced) return null;
    ids.push(raced.id);
  }
  return [...new Set(ids)];
}
