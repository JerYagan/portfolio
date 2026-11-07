import { revalidatePortfolio } from '@/lib/http/revalidate-portfolio';
import { adminError, adminFailure, adminJson, databaseErrorResponse } from '@/lib/http/admin-response';
import { readJsonBody } from '@/lib/http/admin-request';
import { badOriginResponse, isSameOriginMutation, requireAdmin } from '@/lib/auth/authorization';
import { updateCategorySchema, uuidSchema } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) return adminError('NOT_FOUND', 'Category not found.', 404);
  const parsed = await readJsonBody(request, updateCategorySchema);
  if ('response' in parsed) return parsed.response;

  const { data: current, error: currentError } = await auth.client.from('portfolio_categories').select('slug').eq('id', id).maybeSingle();
  if (currentError) return adminFailure();

  const { data, error } = await auth.client
    .from('portfolio_categories')
    .update(parsed.data)
    .eq('id', id)
    .select('id,name,slug,description,is_visible,sort_order,created_at,updated_at')
    .maybeSingle();
  if (error) return databaseErrorResponse(error);
  if (!data) return adminError('NOT_FOUND', 'Category not found.', 404);

  if (current?.slug) revalidatePortfolio({ categorySlug: current.slug });
  revalidatePortfolio({ categorySlug: data.slug });
  return adminJson(data);
}

export async function DELETE(request: Request, context: Context) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) return adminError('NOT_FOUND', 'Category not found.', 404);

  const { data: category, error: categoryError } = await auth.client
    .from('portfolio_categories')
    .select('id,slug')
    .eq('id', id)
    .maybeSingle();
  if (categoryError) return adminFailure();
  if (!category) return adminError('NOT_FOUND', 'Category not found.', 404);

  const { count, error: countError } = await auth.client
    .from('portfolio_entries')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);
  if (countError) return adminFailure();
  if ((count ?? 0) > 0) return adminError('CATEGORY_IN_USE', 'Move or delete this category’s entries before deleting it.', 409);

  const { error } = await auth.client.from('portfolio_categories').delete().eq('id', id);
  if (error) return databaseErrorResponse(error);
  revalidatePortfolio({ categorySlug: category.slug });
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
