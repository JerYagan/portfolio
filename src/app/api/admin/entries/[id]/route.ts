import { requireAdmin, badOriginResponse, isSameOriginMutation } from '@/lib/auth/authorization';
import { findReferencedPaths, removeStoragePaths, signAdminPath } from '@/lib/data/admin-media';
import { adminError, adminFailure, adminJson, entryDatabaseErrorResponse } from '@/lib/http/admin-response';
import { readJsonBody } from '@/lib/http/admin-request';
import { revalidatePortfolio } from '@/lib/http/revalidate-portfolio';
import { replaceAssociations } from '@/lib/data/admin-entries';
import { isMissingCompletionDateColumn, isMissingPresentationColumn, isMissingMediaRoleColumn } from '@/lib/data/completion-date';
import { updateEntrySchema, uuidSchema } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

const entryColumns = '*';

type RouteContext = { params: Promise<{ id: string }> };

async function getId(context: RouteContext) {
  const { id } = await context.params;
  return uuidSchema.safeParse(id);
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const parsedId = await getId(context);
  if (!parsedId.success) return adminError('NOT_FOUND', 'Entry not found.', 404);
  const { data, error } = await auth.client.from('portfolio_entries')
    .select(`${entryColumns},portfolio_categories(id,name,slug),entry_tags(portfolio_tags(id,name,slug))`)
    .eq('id', parsedId.data).maybeSingle();
  if (error) return adminFailure();
  if (!data) return adminError('NOT_FOUND', 'Entry not found.', 404);

  const mediaWithRoles = await auth.client.from('portfolio_media')
    .select('id,object_path,alt_text,caption,sort_order,media_role').eq('entry_id', parsedId.data).order('sort_order', { ascending: true });
  let rawMedia = mediaWithRoles.data;
  if (isMissingMediaRoleColumn(mediaWithRoles.error)) {
    const legacyMedia = await auth.client.from('portfolio_media').select('id,object_path,alt_text,caption,sort_order').eq('entry_id', parsedId.data).order('sort_order', { ascending: true });
    if (legacyMedia.error) return adminFailure();
    rawMedia = legacyMedia.data?.map((item, index) => ({
      ...item,
      media_role: data.presentation === 'logofolio' ? (index === 0 ? 'presentation_board' : 'logo_variation') : 'supporting_image',
    })) ?? null;
  } else if (mediaWithRoles.error) return adminFailure();
  const [media, thumbnailPreviewUrl] = await Promise.all([
    Promise.all((rawMedia ?? []).map(async (item) => ({ ...item, preview_url: await signAdminPath(auth.client, item.object_path) }))),
    signAdminPath(auth.client, data.thumbnail_path),
  ]);
  const entryTagLinks = (data.entry_tags ?? []) as Array<{
    portfolio_tags: { id: string; name: string; slug: string } | Array<{ id: string; name: string; slug: string }> | null;
  }>;
  return adminJson({
    ...data,
    presentation: data.presentation ?? 'standard',
    tags: entryTagLinks.flatMap((link) => Array.isArray(link.portfolio_tags) ? link.portfolio_tags : link.portfolio_tags ? [link.portfolio_tags] : []),
    media,
    thumbnail_preview_url: thumbnailPreviewUrl,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const parsedId = await getId(context);
  if (!parsedId.success) return adminError('NOT_FOUND', 'Entry not found.', 404);
  const parsed = await readJsonBody(request, updateEntrySchema);
  if ('response' in parsed) return parsed.response;
  if (parsed.data.media?.length) {
    const roleColumn = await auth.client.from('portfolio_media').select('media_role').limit(0);
    if (isMissingMediaRoleColumn(roleColumn.error)) return adminError('MIGRATION_REQUIRED', 'Apply the portfolio media roles migration before saving gallery images.', 503);
    if (roleColumn.error) return adminFailure();
  }

  const { data: current, error: currentError } = await auth.client.from('portfolio_entries')
    .select(entryColumns).eq('id', parsedId.data).maybeSingle();
  if (currentError) return adminFailure();
  if (!current) return adminError('NOT_FOUND', 'Entry not found.', 404);

  const { data: existingMedia, error: mediaReadError } = await auth.client.from('portfolio_media')
    .select('object_path,alt_text,caption,media_role,sort_order').eq('entry_id', parsedId.data);
  if (mediaReadError) return adminFailure();
  const previousPaths = [current.thumbnail_path, ...(existingMedia ?? []).map((item) => item.object_path)].filter((path): path is string => Boolean(path));
  const { data: existingTags, error: tagsReadError } = await auth.client.from('entry_tags').select('tag_id').eq('entry_id', parsedId.data);
  if (tagsReadError) return adminFailure();

  const patch = { ...parsed.data };
  delete patch.tag_names;
  delete patch.tag_ids;
  delete patch.media;
  if (patch.presentation !== undefined) {
    const presentationColumn = await auth.client.from('portfolio_entries').select('presentation').limit(0);
    if (isMissingPresentationColumn(presentationColumn.error)) {
      if (patch.presentation === 'logofolio') return adminError('MIGRATION_REQUIRED', 'Apply the entry presentation migration before saving a logofolio entry.', 503);
      delete patch.presentation;
    } else if (presentationColumn.error) {
      return adminFailure();
    }
  }
  if (patch.completed_on !== undefined) {
    const completionColumn = await auth.client.from('portfolio_entries').select('completed_on').limit(0);
    if (isMissingCompletionDateColumn(completionColumn.error)) {
      if (patch.completed_on !== null) return adminError('MIGRATION_REQUIRED', 'Apply the portfolio completion-date migration before saving a completion date.', 503);
      delete patch.completed_on;
    } else if (completionColumn.error) {
      return adminFailure();
    }
  }
  if (patch.thumbnail_path === null) patch.thumbnail_alt = null;
  const finalThumbnailPath = patch.thumbnail_path === undefined ? current.thumbnail_path : patch.thumbnail_path;
  const finalThumbnailAlt = patch.thumbnail_alt === undefined ? current.thumbnail_alt : patch.thumbnail_alt;
  if ((finalThumbnailPath && !finalThumbnailAlt?.trim()) || (!finalThumbnailPath && finalThumbnailAlt)) {
    return adminError('VALIDATION_ERROR', 'Thumbnail alt text is required when a thumbnail is selected.', 400, { thumbnail_alt: 'Enter meaningful alternative text.' });
  }

  const { data: updated, error } = await auth.client.from('portfolio_entries')
    .update(patch).eq('id', parsedId.data).select(entryColumns).single();
  if (error) return entryDatabaseErrorResponse(error);

  const associationError = await replaceAssociations(auth.client, parsedId.data, parsed.data.tag_names, parsed.data.tag_ids, parsed.data.media);
  if (associationError) {
    const rollbackFields = Object.fromEntries(Object.keys(patch).map((key) => [key, current[key as keyof typeof current]]));
    const rollbackEntry = await auth.client.from('portfolio_entries').update(rollbackFields).eq('id', parsedId.data);
    const rollbackAssociations = await replaceAssociations(
      auth.client,
      parsedId.data,
      undefined,
      parsed.data.tag_names !== undefined || parsed.data.tag_ids !== undefined ? (existingTags ?? []).map((item) => item.tag_id) : undefined,
      parsed.data.media !== undefined ? existingMedia ?? [] : undefined,
    );
    if (rollbackEntry.error || rollbackAssociations) return adminFailure();
    return associationError === 'invalid'
      ? adminError('VALIDATION_ERROR', 'A tag or media reference is invalid.', 400)
      : adminFailure();
  }

  const references = await findReferencedPaths(auth.client, previousPaths);
  const cleanupPending = references
    ? await removeStoragePaths(auth.client, previousPaths.filter((path) => !references.has(path)))
    : previousPaths;
  revalidatePortfolio({ entrySlug: current.slug, featured: current.is_featured });
  revalidatePortfolio({ entrySlug: updated.slug, featured: updated.is_featured });
  return adminJson(updated, 200, cleanupPending.length ? { cleanup_pending: cleanupPending } : undefined);
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const parsedId = await getId(context);
  if (!parsedId.success) return adminError('NOT_FOUND', 'Entry not found.', 404);
  const { data: entry, error: entryError } = await auth.client.from('portfolio_entries')
    .select('id,slug,is_featured,thumbnail_path').eq('id', parsedId.data).maybeSingle();
  if (entryError) return adminFailure();
  if (!entry) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  const { data: gallery, error: galleryError } = await auth.client.from('portfolio_media').select('object_path').eq('entry_id', parsedId.data);
  if (galleryError) return adminFailure();
  const paths = [entry.thumbnail_path, ...(gallery ?? []).map((item) => item.object_path)].filter((path): path is string => Boolean(path));

  const { error: deleteError } = await auth.client.from('portfolio_entries').delete().eq('id', parsedId.data);
  if (deleteError) return entryDatabaseErrorResponse(deleteError);

  const references = await findReferencedPaths(auth.client, paths);
  const cleanupPaths = references ? paths.filter((path) => !references.has(path)) : [];
  const cleanupPending = cleanupPaths.length ? await removeStoragePaths(auth.client, cleanupPaths) : references ? [] : paths;
  revalidatePortfolio({ entrySlug: entry.slug, featured: entry.is_featured });
  return cleanupPending.length
    ? adminJson({ deleted: true }, 200, { cleanup_pending: cleanupPending })
    : new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
