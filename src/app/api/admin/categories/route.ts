import { revalidatePortfolio } from '@/lib/http/revalidate-portfolio';
import { adminError, adminFailure, adminJson, databaseErrorResponse } from '@/lib/http/admin-response';
import { readJsonBody } from '@/lib/http/admin-request';
import { badOriginResponse, isSameOriginMutation, requireAdmin } from '@/lib/auth/authorization';
import { createCategorySchema } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const { data: categories, error } = await auth.client
    .from('portfolio_categories')
    .select('id,name,slug,description,is_visible,sort_order,created_at,updated_at')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) return adminFailure();

  const withCounts = await Promise.all((categories ?? []).map(async (category) => {
    const { count, error: countError } = await auth.client
      .from('portfolio_entries')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category.id);
    if (countError) throw countError;
    return { ...category, entry_count: count ?? 0 };
  }).map((promise) => promise.catch(() => null)));
  if (withCounts.some((category) => category === null)) return adminFailure();
  return adminJson(withCounts);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const parsed = await readJsonBody(request, createCategorySchema);
  if ('response' in parsed) return parsed.response;

  const { data, error } = await auth.client
    .from('portfolio_categories')
    .insert({
      ...parsed.data,
      description: parsed.data.description ?? '',
      is_visible: parsed.data.is_visible ?? true,
      sort_order: parsed.data.sort_order ?? 0,
    })
    .select('id,name,slug,description,is_visible,sort_order,created_at,updated_at')
    .single();
  if (error) return error.code === '23505'
    ? adminError('SLUG_TAKEN', 'A category with that slug already exists.', 409)
    : databaseErrorResponse(error);

  revalidatePortfolio({ categorySlug: data.slug });
  return adminJson(data, 201);
}
