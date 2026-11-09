import { requireAdmin, badOriginResponse, isSameOriginMutation } from '@/lib/auth/authorization';
import { adminError, adminFailure, adminJson, entryDatabaseErrorResponse } from '@/lib/http/admin-response';
import { readJsonBody } from '@/lib/http/admin-request';
import { revalidatePortfolio } from '@/lib/http/revalidate-portfolio';
import { createEntrySchema, adminEntryListQuerySchema } from '@/lib/validation/admin';
import { replaceAssociations } from '@/lib/data/admin-entries';
import { isMissingCompletionDateColumn, isMissingPresentationColumn, isMissingMediaRoleColumn, isMissingCaseStudySectionsColumn, isMissingProjectStatusColumn, isMissingWebsitePageMediaColumn } from '@/lib/data/completion-date';

export const dynamic = 'force-dynamic';

const entryColumns = '*';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const url = new URL(request.url);
  const query = adminEntryListQuerySchema.safeParse({
    status: url.searchParams.get('status') ?? 'all',
    page: url.searchParams.get('page') ?? '1',
    limit: url.searchParams.get('limit') ?? '20',
    q: url.searchParams.get('q') ?? undefined,
  });
  if (!query.success) return adminError('VALIDATION_ERROR', 'Check the search filters.', 400);

  const { status, page, limit, q } = query.data;
  let builder = auth.client.from('portfolio_entries')
    .select(`${entryColumns},portfolio_categories(name,slug)`, { count: 'exact' })
    .order('updated_at', { ascending: false });
  if (status !== 'all') builder = builder.eq('status', status);
  if (q) {
    const safeQuery = q.replace(/[^\p{L}\p{N}\s_-]/gu, ' ').trim();
    if (safeQuery) builder = builder.or(`title.ilike.%${safeQuery}%,summary.ilike.%${safeQuery}%`);
  }
  const start = (page - 1) * limit;
  const { data, error, count } = await builder.range(start, start + limit - 1);
  if (error) return adminFailure();
  const normalized = (data ?? []).map((entry) => ({ ...entry, portfolio_categories: Array.isArray(entry.portfolio_categories) ? entry.portfolio_categories[0] ?? null : entry.portfolio_categories }));
  return adminJson(normalized, 200, { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const parsed = await readJsonBody(request, createEntrySchema);
  if ('response' in parsed) return parsed.response;

  const values = parsed.data;
  const projectStatusColumn = await auth.client.from('portfolio_entries').select('project_status').limit(0);
  if (isMissingProjectStatusColumn(projectStatusColumn.error)) return adminError('MIGRATION_REQUIRED', 'Apply the project progress migration before saving project progress.', 503);
  if (projectStatusColumn.error) return adminFailure();
  if (values.media?.length) {
    const roleColumn = await auth.client.from('portfolio_media').select('media_role').limit(0);
    if (isMissingMediaRoleColumn(roleColumn.error)) return adminError('MIGRATION_REQUIRED', 'Apply the portfolio media roles migration before saving gallery images.', 503);
    if (roleColumn.error) return adminFailure();
    if (values.media.some((item) => item.media_role === 'page_screenshot')) {
      const pageMediaColumns = await auth.client.from('portfolio_media').select('page_name,device_label').limit(0);
      if (isMissingWebsitePageMediaColumn(pageMediaColumns.error)) return adminError('MIGRATION_REQUIRED', 'Apply the website page screenshots migration before adding website screenshots.', 503);
      if (pageMediaColumns.error) return adminFailure();
    }
  }
  const caseStudySections = values.case_study_sections ?? [];
  if (caseStudySections.length) {
    const sectionsColumn = await auth.client.from('portfolio_entries').select('case_study_sections').limit(0);
    if (isMissingCaseStudySectionsColumn(sectionsColumn.error)) return adminError('MIGRATION_REQUIRED', 'Apply the case-study sections migration before saving sections.', 503);
    if (sectionsColumn.error) return adminFailure();
  }
  const presentationColumn = await auth.client.from('portfolio_entries').select('presentation').limit(0);
  const presentationColumnMissing = isMissingPresentationColumn(presentationColumn.error);
  if (presentationColumn.error && !presentationColumnMissing) return adminFailure();
  if (presentationColumnMissing && values.presentation === 'logofolio') {
    return adminError('MIGRATION_REQUIRED', 'Apply the entry presentation migration before saving a logofolio entry.', 503);
  }
  if (values.completed_on) {
    const completionColumn = await auth.client.from('portfolio_entries').select('completed_on').limit(0);
    if (isMissingCompletionDateColumn(completionColumn.error)) {
      return adminError('MIGRATION_REQUIRED', 'Apply the portfolio completion-date migration before saving a completion date.', 503);
    }
    if (completionColumn.error) return adminFailure();
  }
  const { data, error } = await auth.client.from('portfolio_entries').insert({
    title: values.title,
    slug: values.slug,
    summary: values.summary,
    ...(!presentationColumnMissing ? { presentation: values.presentation ?? 'standard' } : {}),
    body_markdown: values.body_markdown ?? '',
    ...(caseStudySections.length ? { case_study_sections: caseStudySections } : {}),
    category_id: values.category_id,
    thumbnail_path: values.thumbnail_path ?? null,
    thumbnail_alt: values.thumbnail_path ? values.thumbnail_alt?.trim() ?? null : null,
    project_url: values.project_url ?? null,
    repository_url: values.repository_url ?? null,
    year: values.year ?? null,
    ...(values.completed_on ? { completed_on: values.completed_on } : {}),
    project_status: values.project_status ?? 'in_progress',
    client_label: values.client_label ?? null,
    role: values.role ?? null,
    status: values.status ?? 'draft',
    is_featured: values.is_featured ?? false,
    sort_order: values.sort_order ?? 0,
    seo_title: values.seo_title ?? null,
    seo_description: values.seo_description ?? null,
  }).select(entryColumns).single();
  if (error) return entryDatabaseErrorResponse(error);

  const associationError = await replaceAssociations(auth.client, data.id, values.tag_names, values.tag_ids, values.media);
  if (associationError) {
    await auth.client.from('portfolio_entries').delete().eq('id', data.id);
    return associationError === 'invalid' ? adminError('VALIDATION_ERROR', 'A tag or media reference is invalid.', 400) : adminFailure();
  }

  revalidatePortfolio({ entrySlug: data.slug, featured: data.is_featured });
  return adminJson(data, 201);
}

