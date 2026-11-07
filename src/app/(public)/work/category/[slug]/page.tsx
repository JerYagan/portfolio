import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WorkListing } from '@/components/public/WorkListing';
import { getPublicCategories, getPublishedEntries } from '@/lib/data/portfolio';
import { publicEntriesQuerySchema, publicSlugSchema } from '@/lib/validation/public-queries';

export const dynamic = 'force-dynamic';

type RouteParams = Promise<{ slug: string }>;
type SearchValue = string | string[] | undefined;
type WorkSearchParams = { q?: SearchValue; page?: SearchValue };

function first(value: SearchValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { slug } = await params;
  if (!publicSlugSchema.safeParse(slug).success) return { title: 'Work' };
  const result = await getPublishedEntries({ categorySlug: slug, limit: 1 });
  if (!result.category) return { title: 'Work' };
  return {
    title: result.category.name,
    description: result.category.description || `Published work in ${result.category.name}.`,
  };
}

export default async function WorkCategoryPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: Promise<WorkSearchParams>;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  if (!publicSlugSchema.safeParse(slug).success) notFound();

  const parsed = publicEntriesQuerySchema.safeParse({ q: first(search.q), page: first(search.page), limit: 48 });
  const query = parsed.success ? parsed.data : { page: 1, limit: 48, q: undefined };
  const [categories, result] = await Promise.all([
    getPublicCategories(),
    getPublishedEntries({ categorySlug: slug, query: query.q, page: query.page, limit: query.limit }),
  ]);
  if (!result.category) notFound();

  return (
    <WorkListing
      action={`/work/category/${result.category.slug}`}
      categories={categories}
      description={result.category.description || `Selected work filed under ${result.category.name}.`}
      entries={result.entries}
      page={query.page}
      query={query.q}
      selectedCategory={result.category}
      title={result.category.name}
      total={result.total}
    />
  );
}
