import type { Metadata } from 'next';
import { WorkListing } from '@/components/public/WorkListing';
import { getPublicCategories, getPublishedEntries } from '@/lib/data/portfolio';
import { publicEntriesQuerySchema } from '@/lib/validation/public-queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Browse published projects and creative work.',
};

type SearchValue = string | string[] | undefined;
type WorkSearchParams = { q?: SearchValue; page?: SearchValue };

function first(value: SearchValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function WorkPage({ searchParams }: { searchParams: Promise<WorkSearchParams> }) {
  const params = await searchParams;
  const parsed = publicEntriesQuerySchema.safeParse({ q: first(params.q), page: first(params.page), limit: 48 });
  const query = parsed.success ? parsed.data : { page: 1, limit: 48, q: undefined };
  const [categories, result] = await Promise.all([
    getPublicCategories(),
    getPublishedEntries({ query: query.q, page: query.page, limit: query.limit }),
  ]);

  return (
    <WorkListing
      categories={categories}
      entries={result.entries}
      page={query.page}
      query={query.q}
      title="Selected work"
      total={result.total}
    />
  );
}
