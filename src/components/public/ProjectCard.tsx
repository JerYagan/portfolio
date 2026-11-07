import Link from 'next/link';
import type { PublicEntryPreview } from '@/lib/data/portfolio';
import { PortfolioImage } from '@/components/public/PortfolioImage';

export function ProjectCard({ entry, priority = false }: { entry: PublicEntryPreview; priority?: boolean }) {
  return (
    <article className="project-card">
      <Link aria-label={`View ${entry.title}`} className="project-card__link" href={`/work/${entry.slug}`}>
        <div className="project-card__media">
          <PortfolioImage className="project-card__image" eager={priority} image={entry.thumbnail} />
          <span aria-hidden="true" className="project-card__index">↗</span>
        </div>
        <div className="project-card__meta">
          <span>{entry.category.name}</span>
          {entry.completedOn ? <span>Completed {formatCompletionDate(entry.completedOn, true)}</span> : entry.year ? <span>{entry.year}</span> : null}
        </div>
        <h3>{entry.title}</h3>
        <p>{entry.summary}</p>
      </Link>
    </article>
  );
}

function formatCompletionDate(value: string, compact: boolean) {
  return new Intl.DateTimeFormat('en', { month: compact ? 'short' : 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}
