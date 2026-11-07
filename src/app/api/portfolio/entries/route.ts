import { getPublishedEntries } from '@/lib/data/portfolio';
import { apiError, apiFailure, mediaExpirationMeta, publicCacheHeaders } from '@/lib/http/public-response';
import { publicEntriesQuerySchema } from '@/lib/validation/public-queries';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = publicEntriesQuerySchema.safeParse({
    category: params.get('category') ?? undefined,
    featured: params.get('featured') ?? undefined,
    q: params.get('q') ?? undefined,
    page: params.get('page') ?? undefined,
    limit: params.get('limit') ?? undefined,
  });
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Check the query parameters.', 400, true);

  try {
    const result = await getPublishedEntries({
      categorySlug: parsed.data.category,
      featured: parsed.data.featured === undefined ? undefined : parsed.data.featured === 'true',
      query: parsed.data.q,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });
    if (parsed.data.category && !result.category) return apiError('NOT_FOUND', 'Category not found.', 404, true);

    const hasMedia = result.entries.some((entry) => entry.thumbnail !== null);
    return Response.json({
      data: result.entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        slug: entry.slug,
        summary: entry.summary,
        category: { name: entry.category.name, slug: entry.category.slug },
        thumbnail: entry.thumbnail,
        year: entry.year,
        completed_on: entry.completedOn,
        is_featured: entry.isFeatured,
        published_at: entry.publishedAt,
      })),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / result.limit),
        ...mediaExpirationMeta(hasMedia),
      },
    }, { headers: publicCacheHeaders });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error(`[public-entries-api] ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    return apiFailure();
  }
}
