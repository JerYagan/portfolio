import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PortfolioImage } from '@/components/public/PortfolioImage';
import { SafeMarkdown } from '@/components/public/SafeMarkdown';
import { ProjectGallery } from '@/components/public/ProjectGallery';
import { TechnologyMark } from '@/components/public/TechnologyMark';
import { getPublishedEntryBySlug } from '@/lib/data/portfolio';
import { technologyIdForLabel } from '@/lib/tech-stack';
import { publicSlugSchema } from '@/lib/validation/public-queries';

export const dynamic = 'force-dynamic';

type RouteParams = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { slug } = await params;
  if (!publicSlugSchema.safeParse(slug).success) return { title: 'Work' };
  const entry = await getPublishedEntryBySlug(slug);
  if (!entry) return { title: 'Work' };
  return {
    title: entry.seoTitle || entry.title,
    description: entry.seoDescription || entry.summary,
    openGraph: entry.thumbnail ? { images: [{ url: entry.thumbnail.url, alt: entry.thumbnail.alt }] } : undefined,
  };
}

export default async function WorkDetailPage({ params }: { params: RouteParams }) {
  const { slug } = await params;
  if (!publicSlugSchema.safeParse(slug).success) notFound();
  const entry = await getPublishedEntryBySlug(slug);
  if (!entry) notFound();

  const metadata = [
    entry.completedOn ? { label: 'Completed', value: formatCompletionDate(entry.completedOn) } : null,
    !entry.completedOn && entry.year ? { label: 'Year', value: String(entry.year) } : null,
    entry.role ? { label: 'Role', value: entry.role } : null,
    entry.clientLabel ? { label: 'Client', value: entry.clientLabel } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const projectTools = entry.tags.filter((tag) => technologyIdForLabel(tag.name));
  const projectTags = entry.tags.filter((tag) => !technologyIdForLabel(tag.name));
  const logofolioBoard = entry.presentation === 'logofolio' ? entry.media[0] ?? null : null;
  const logofolioLogos = entry.presentation === 'logofolio' ? entry.media.slice(1) : [];

  return (
    <main className="page-frame detail-page" id="main-content">
      <Link className="back-link" href={`/work/category/${entry.category.slug}`}>← {entry.category.name}</Link>
      <header className="detail-header">
        <p className="eyebrow">{entry.category.name}</p>
        <h1>{entry.title}</h1>
        <p className="detail-header__summary">{entry.summary}</p>
        {metadata.length > 0 ? (
          <dl className="detail-meta">
            {metadata.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
          </dl>
        ) : null}
        <div className="detail-actions">
          {entry.projectUrl ? <a className="button button--primary" href={entry.projectUrl} rel="noreferrer noopener" target="_blank">View project ↗</a> : null}
          {entry.repositoryUrl ? <a className="text-link" href={entry.repositoryUrl} rel="noreferrer noopener" target="_blank">Repository ↗</a> : null}
        </div>
      </header>

      {entry.presentation === 'logofolio' ? (
        <div className="logofolio-detail">
          {logofolioBoard ? <figure className="logofolio-board">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={logofolioBoard.alt} src={logofolioBoard.url} />
            {logofolioBoard.caption ? <figcaption>{logofolioBoard.caption}</figcaption> : null}
          </figure> : entry.thumbnail ? <div className="detail-cover"><PortfolioImage className="detail-cover__image" eager image={entry.thumbnail} /></div> : null}

          {entry.bodyMarkdown ? <section aria-label="Project details" className="logofolio-description"><SafeMarkdown source={entry.bodyMarkdown} /></section> : null}

          {projectTools.length > 0 || projectTags.length > 0 ? <section aria-labelledby="logofolio-tools-title" className="logofolio-tools">
            <p className="eyebrow">The making of it</p>
            <h2 id="logofolio-tools-title">Tools used</h2>
            {projectTools.length > 0 ? <ul className="tag-list" aria-label="Tools used">
              {projectTools.map((tool) => <li key={tool.id}><TechnologyMark id={technologyIdForLabel(tool.name)} label={tool.name} /><span>{tool.name}</span></li>)}
            </ul> : null}
            {projectTags.length > 0 ? <ul className="tag-list" aria-label="Project tags">
              {projectTags.map((tag) => <li key={tag.id}><span>{tag.name}</span></li>)}
            </ul> : null}
          </section> : null}

          {logofolioLogos.length > 0 ? <section aria-labelledby="gallery-title" className="detail-gallery logofolio-gallery">
            <div className="section-heading"><div><p className="eyebrow">Marks and variations</p><h2 id="gallery-title">Logo gallery</h2></div></div>
            <ProjectGallery images={logofolioLogos} />
          </section> : null}
        </div>
      ) : <>
        <div className="detail-cover"><PortfolioImage className="detail-cover__image" eager image={entry.thumbnail} /></div>
        <div className="detail-body">
          <aside className="detail-body__aside">
            <p className="eyebrow">Project notes</p>
            {projectTools.length > 0 ? <>
              <h2 className="detail-tools-title">Tools used</h2>
              <ul className="tag-list" aria-label="Tools used">
                {projectTools.map((tool) => <li key={tool.id}><TechnologyMark id={technologyIdForLabel(tool.name)} label={tool.name} /><span>{tool.name}</span></li>)}
              </ul>
            </> : null}
            {projectTags.length > 0 ? <>
              <h2 className="detail-tools-title">Project tags</h2>
              <ul className="tag-list" aria-label="Project tags">
                {projectTags.map((tag) => <li key={tag.id}><span>{tag.name}</span></li>)}
              </ul>
            </> : null}
            {entry.tags.length === 0 ? <p className="muted-note">No tools or tags added.</p> : null}
          </aside>
          <section aria-label="Project details" className="detail-body__content">
            {entry.bodyMarkdown ? <SafeMarkdown source={entry.bodyMarkdown} /> : <p className="muted-note">A longer project story will be added here when available.</p>}
          </section>
        </div>
        {entry.media.length > 0 ? (
          <section aria-labelledby="gallery-title" className="detail-gallery">
            <div className="section-heading"><div><p className="eyebrow">A closer look</p><h2 id="gallery-title">Gallery</h2></div></div>
            <ProjectGallery images={entry.media} />
          </section>
        ) : null}
      </>}

      <div className="detail-end"><Link className="text-link" href="/work">Back to all work ↗</Link></div>
    </main>
  );
}

function formatCompletionDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}
