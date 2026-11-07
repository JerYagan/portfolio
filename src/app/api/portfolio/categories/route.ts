import { getPublicCategoriesWithCounts } from '@/lib/data/portfolio';
import { apiFailure, publicCacheHeaders } from '@/lib/http/public-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getPublicCategoriesWithCounts();
    return Response.json({
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        entry_count: category.entry_count,
      })),
    }, { headers: publicCacheHeaders });
  } catch {
    return apiFailure();
  }
}
