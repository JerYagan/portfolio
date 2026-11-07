import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EntryEditor } from '@/components/admin/EntryEditor';
import { signAdminPath } from '@/lib/data/admin-media';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Edit entry' };

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) notFound();
  const client = await createSupabaseServerClient();
  const [{ data: row, error }, { data: categories }] = await Promise.all([
    client.from('portfolio_entries').select('*,entry_tags(portfolio_tags(id,name,slug))').eq('id', parsedId.data).maybeSingle(),
    client.from('portfolio_categories').select('id,name').order('sort_order').order('name'),
  ]);
  if (error || !row) notFound();
  const { data: rawMedia, error: mediaError } = await client.from('portfolio_media').select('id,object_path,alt_text,caption,sort_order').eq('entry_id', parsedId.data).order('sort_order', { ascending: true });
  if (mediaError) notFound();
  const [thumbnailPreviewUrl, media] = await Promise.all([
    signAdminPath(client, row.thumbnail_path),
    Promise.all((rawMedia ?? []).map(async (item) => ({ ...item, preview_url: await signAdminPath(client, item.object_path) }))),
  ]);
  const entryTagLinks = (row.entry_tags ?? []) as Array<{
    portfolio_tags: { id: string; name: string; slug: string } | Array<{ id: string; name: string; slug: string }> | null;
  }>;
  const initialEntry = {
    ...row,
    tags: entryTagLinks.flatMap((link) => Array.isArray(link.portfolio_tags) ? link.portfolio_tags : link.portfolio_tags ? [link.portfolio_tags] : []),
    media,
    thumbnail_preview_url: thumbnailPreviewUrl,
  };
  return <main className="admin-page admin-page--wide" id="main-content"><header className="admin-page-heading"><div><p className="admin-eyebrow">The archive</p><h1>Edit entry</h1></div></header><EntryEditor categories={categories ?? []} initialEntry={initialEntry} /></main>;
}
