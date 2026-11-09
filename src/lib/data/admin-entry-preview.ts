import 'server-only';
import { getAdminPageContext } from '@/lib/auth/authorization';
import { signAdminPath } from '@/lib/data/admin-media';
import { isMissingMediaRoleColumn, isMissingWebsitePageMediaColumn } from '@/lib/data/completion-date';
import { normalizeCaseStudySections, type PublicEntry, type PublicGalleryImage, type PublicTag } from '@/lib/data/portfolio';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type EntryRow = {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  summary: string;
  body_markdown: string;
  thumbnail_path: string | null;
  thumbnail_alt: string | null;
  project_url: string | null;
  repository_url: string | null;
  year: number | null;
  completed_on?: string | null;
  project_status?: 'in_progress' | 'completed' | null;
  presentation?: 'standard' | 'logofolio';
  case_study_sections?: unknown;
  client_label: string | null;
  role: string | null;
  is_featured: boolean;
  published_at: string | null;
  updated_at: string;
};

type CategoryRow = { id: string; name: string; slug: string };
type MediaRow = { object_path: string; alt_text: string; caption: string | null; sort_order: number; media_role?: PublicGalleryImage['media_role']; page_name?: string | null; device_label?: PublicGalleryImage['device_label'] };
type TagRow = { id: string; name: string; slug: string };
type EntryTagRow = { portfolio_tags: TagRow | TagRow[] | null };

export type AdminEntryPreviewResult =
  | { status: 'unauthenticated' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ok'; entry: PublicEntry };

export async function getAdminEntryPreview(id: string): Promise<AdminEntryPreviewResult> {
  const admin = await getAdminPageContext();
  if (!admin) return { status: 'unauthenticated' };

  const client = await createSupabaseServerClient();
  const { data: rawEntry, error: entryError } = await client
    .from('portfolio_entries')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (entryError) return { status: 'error' };
  if (!rawEntry) return { status: 'not-found' };

  const row = rawEntry as unknown as EntryRow;
  const [categoryResult, initialMediaResultWithMetadata, tagsResult] = await Promise.all([
    client.from('portfolio_categories').select('id,name,slug').eq('id', row.category_id).maybeSingle(),
    client.from('portfolio_media').select('object_path,alt_text,caption,sort_order,media_role,page_name,device_label').eq('entry_id', id).order('sort_order', { ascending: true }),
    client.from('entry_tags').select('portfolio_tags(id,name,slug)').eq('entry_id', id),
  ]);
  const initialMediaResult = isMissingWebsitePageMediaColumn(initialMediaResultWithMetadata.error)
    ? await client.from('portfolio_media').select('object_path,alt_text,caption,sort_order,media_role').eq('entry_id', id).order('sort_order', { ascending: true })
    : initialMediaResultWithMetadata;
  if (categoryResult.error || tagsResult.error) return { status: 'error' };

  const category = categoryResult.data as unknown as CategoryRow | null;
  if (!category) return { status: 'not-found' };

  const thumbnailUrl = await signAdminPath(client, row.thumbnail_path);
  let rawMedia: MediaRow[];
  if (isMissingMediaRoleColumn(initialMediaResult.error)) {
    const legacyMedia = await client.from('portfolio_media').select('object_path,alt_text,caption,sort_order').eq('entry_id', id).order('sort_order', { ascending: true });
    if (legacyMedia.error) return { status: 'error' };
    rawMedia = (legacyMedia.data ?? []).map((image, index) => ({
      ...image,
      media_role: row.presentation === 'logofolio' ? (index === 0 ? 'presentation_board' : 'logo_variation') : 'supporting_image',
    })) as MediaRow[];
  } else {
    if (initialMediaResult.error) return { status: 'error' };
    rawMedia = (initialMediaResult.data ?? []) as unknown as MediaRow[];
  }
  const media: PublicGalleryImage[] = (await Promise.all(rawMedia.map(async (image) => {
    const url = await signAdminPath(client, image.object_path);
    return url ? { url, alt: image.alt_text, caption: image.caption, sort_order: image.sort_order, media_role: image.media_role ?? 'supporting_image', page_name: image.page_name ?? null, device_label: image.device_label ?? null } : null;
  }))).filter((image): image is PublicGalleryImage => image !== null);

  const tagRows = (tagsResult.data ?? []) as unknown as EntryTagRow[];
  const tags: PublicTag[] = tagRows.flatMap(({ portfolio_tags: related }) => {
    const tag = Array.isArray(related) ? related[0] : related;
    return tag ? [tag] : [];
  });

  return {
    status: 'ok',
    entry: {
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      category: { id: category.id, name: category.name, slug: category.slug },
      thumbnail: thumbnailUrl && row.thumbnail_alt?.trim() ? { url: thumbnailUrl, alt: row.thumbnail_alt.trim() } : null,
      year: row.year,
      completedOn: row.completed_on ?? null,
      projectStatus: row.project_status ?? null,
      isFeatured: row.is_featured,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      presentation: row.presentation === 'logofolio' ? 'logofolio' : 'standard',
      bodyMarkdown: row.body_markdown,
      caseStudySections: normalizeCaseStudySections(row.case_study_sections),
      projectUrl: safeHttpsUrl(row.project_url),
      repositoryUrl: safeHttpsUrl(row.repository_url),
      clientLabel: row.client_label,
      role: row.role,
      seoTitle: null,
      seoDescription: null,
      tags,
      media,
    },
  };
}

function safeHttpsUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.toString() : null;
  } catch {
    return null;
  }
}
