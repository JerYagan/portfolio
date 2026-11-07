import Link from 'next/link';
import type { PublicCategory } from '@/lib/data/portfolio';

export function CategoryFilters({
  categories,
  selectedSlug,
}: {
  categories: PublicCategory[];
  selectedSlug?: string;
}) {
  return (
    <nav aria-label="Filter work by category" className="category-filters">
      <Link aria-current={!selectedSlug ? 'page' : undefined} href="/work">
        All work
      </Link>
      {categories.map((category) => (
        <Link
          aria-current={category.slug === selectedSlug ? 'page' : undefined}
          href={`/work/category/${category.slug}`}
          key={category.id}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
