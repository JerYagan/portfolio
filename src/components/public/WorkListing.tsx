import Link from 'next/link';
import type { PublicCategory, PublicEntryPreview } from '@/lib/data/portfolio';
import { CategoryFilters } from '@/components/public/CategoryFilters';
import { ProjectCard } from '@/components/public/ProjectCard';

export function WorkListing({
  categories,
  entries,
  selectedCategory,
  query = '',
  page = 1,
  limit = 48,
  total = entries.length,
  action = '/work',
  title = 'Selected work',
  description = 'A collection of projects, studies, and systems.',
}: {
  categories: PublicCategory[];
  entries: PublicEntryPreview[];
  selectedCategory?: PublicCategory | null;
  query?: string;
  page?: number;
  limit?: number;
  total?: number;
  action?: string;
  title?: string;
  description?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const selectedSlug = selectedCategory?.slug;
  const searchSuffix = query ? `&q=${encodeURIComponent(query)}` : '';

  return (
    <main className="page-frame work-page" id="main-content">
      <header className="page-intro">
        <p className="eyebrow">A selection of things made</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <CategoryFilters categories={categories} selectedSlug={selectedSlug} />

      <form action={action} className="work-search" role="search">
        <div className="work-search__field">
          <label htmlFor="work-search">Search titles and summaries</label>
          <input autoComplete="off" defaultValue={query} id="work-search" maxLength={100} name="q" type="search" />
        </div>
        <button className="button button--primary" type="submit">Search</button>
      </form>

      {entries.length > 0 ? (
        <>
          <p className="result-count" aria-live="polite">
            {total} {total === 1 ? 'project' : 'projects'}{query ? ` matching “${query}”` : ''}
          </p>
          <div className="project-grid">
            {entries.map((entry, index) => <ProjectCard entry={entry} key={entry.id} priority={index < 2} />)}
          </div>
          {totalPages > 1 ? (
            <nav aria-label="Work pages" className="pagination">
              {page > 1 ? <Link href={`${action}?page=${page - 1}${searchSuffix}`}>← Newer</Link> : <span />}
              <span>Page {page} of {totalPages}</span>
              {page < totalPages ? <Link href={`${action}?page=${page + 1}${searchSuffix}`}>Older →</Link> : <span />}
            </nav>
          ) : null}
        </>
      ) : (
        <div className="empty-state">
          <span aria-hidden="true" className="empty-state__mark">✳</span>
          <h2>{query ? 'No matching work yet.' : 'Nothing published here yet.'}</h2>
          <p>
            {query
              ? 'Try another word, or browse all of the work.'
              : 'New pieces will appear here once they are ready to share.'}
          </p>
          {selectedCategory || query ? <Link className="text-link" href="/work">Browse all work ↗</Link> : null}
        </div>
      )}
    </main>
  );
}
