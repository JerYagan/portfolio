import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EntryEditor } from '@/components/admin/EntryEditor';
import { signAdminPath } from '@/lib/data/admin-media';
import { isMissingMediaRoleColumn, isMissingWebsitePageMediaColumn } from '@/lib/data/completion-date';
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
  type EditableMediaRow = { id: string; object_path: string; alt_text: string; caption: string | null; sort_order: number; media_role?: string; page_name?: string | null; device_label?: string | null };
  const mediaWithMetadata = await client.from('portfolio_media').select('id,object_path,alt_text,caption,sort_order,media_role,page_name,device_label').eq('entry_id', parsedId.data).order('sort_order', { ascending: true });
  let rawMedia: EditableMediaRow[] | null;
  if (isMissingWebsitePageMediaColumn(mediaWithMetadata.error)) {
    const mediaWithRoles = await client.from('portfolio_media').select('id,object_path,alt_text,caption,sort_order,media_role').eq('entry_id', parsedId.data).order('sort_order', { ascending: true });
    if (isMissingMediaRoleColumn(mediaWithRoles.error)) {
      const legacyMedia = await client.from('portfolio_media').select('id,object_path,alt_text,caption,sort_order').eq('entry_id', parsedId.data).order('sort_order', { ascending: true });
      if (legacyMedia.error) notFound();
      rawMedia = legacyMedia.data?.map((item, index) => ({
        ...item,
        media_role: row.presentation === 'logofolio' ? (index === 0 ? 'presentation_board' : 'logo_variation') : 'supporting_image',
      })) ?? null;
    } else if (mediaWithRoles.error) notFound();
    else rawMedia = mediaWithRoles.data as EditableMediaRow[] | null;
  } else if (isMissingMediaRoleColumn(mediaWithMetadata.error)) {
    const legacyMedia = await client.from('portfolio_media').select('id,object_path,alt_text,caption,sort_order').eq('entry_id', parsedId.data).order('sort_order', { ascending: true });
    if (legacyMedia.error) notFound();
    rawMedia = legacyMedia.data?.map((item, index) => ({
      ...item,
      media_role: row.presentation === 'logofolio' ? (index === 0 ? 'presentation_board' : 'logo_variation') : 'supporting_image',
    })) ?? null;
  } else if (mediaWithMetadata.error) notFound();
  else rawMedia = mediaWithMetadata.data as EditableMediaRow[] | null;
  const [thumbnailPreviewUrl, media] = await Promise.all([
    signAdminPath(client, row.thumbnail_path),
    Promise.all((rawMedia ?? []).map(async (item) => ({ ...item, page_name: item.page_name ?? null, device_label: item.device_label ?? null, preview_url: await signAdminPath(client, item.object_path) }))),
  ]);
  const entryTagLinks = (row.entry_tags ?? []) as Array<{
    portfolio_tags: { id: string; name: string; slug: string } | Array<{ id: string; name: string; slug: string }> | null;
  }>;
  const initialEntry = {
    ...row,
    case_study_sections: Array.isArray(row.case_study_sections) ? row.case_study_sections.flatMap((item: unknown) => {
      if (!item || typeof item !== 'object') return [];
      const section = item as Record<string, unknown>;
      if (typeof section.heading !== 'string' || typeof section.body_markdown !== 'string') return [];
      return [{ heading: section.heading.slice(0, 80), body_markdown: section.body_markdown.slice(0, 8000) }];
    }).slice(0, 12) : [],
    tags: entryTagLinks.flatMap((link) => Array.isArray(link.portfolio_tags) ? link.portfolio_tags : link.portfolio_tags ? [link.portfolio_tags] : []),
    media,
    thumbnail_preview_url: thumbnailPreviewUrl,
  };
  return <main className="admin-page admin-page--wide" id="main-content"><header className="admin-page-heading"><div><p className="admin-eyebrow">The archive</p><h1>Edit entry</h1></div></header><EntryEditor categories={categories ?? []} initialEntry={initialEntry} /></main>;
}
