import Link from 'next/link';
import { PortfolioImage } from '@/components/public/PortfolioImage';
import { CaseStudySections } from '@/components/public/CaseStudySections';
import { SafeMarkdown } from '@/components/public/SafeMarkdown';
import { ProjectGallery } from '@/components/public/ProjectGallery';
import { WebsitePageScreenshots } from '@/components/public/WebsitePageScreenshots';
import { TechnologyMark } from '@/components/public/TechnologyMark';
import type { PublicEntry } from '@/lib/data/portfolio';
import { technologyIdForLabel } from '@/lib/tech-stack';

export function ProjectDetail({ entry, preview = false }: { entry: PublicEntry; preview?: boolean }) {
  const metadata = [
    entry.completedOn ? { label: 'Completed', value: formatCompletionDate(entry.completedOn) } : null,
    !entry.completedOn && entry.year ? { label: 'Year', value: String(entry.year) } : null,
    entry.projectStatus ? { label: 'Project status', value: entry.projectStatus === 'completed' ? 'Completed' : 'In progress' } : null,
    entry.role ? { label: 'Role', value: entry.role } : null,
    entry.clientLabel ? { label: 'Client', value: entry.clientLabel } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const projectTools = entry.tags.filter((tag) => technologyIdForLabel(tag.name));
  const projectTags = entry.tags.filter((tag) => !technologyIdForLabel(tag.name));
  const logofolioBoard = entry.presentation === 'logofolio' ? entry.media.find((image) => image.media_role === 'presentation_board') ?? null : null;
  const logofolioLogos = entry.presentation === 'logofolio' ? entry.media.filter((image) => image.media_role === 'logo_variation') : [];
  const logofolioSupporting = entry.presentation === 'logofolio' ? entry.media.filter((image) => image.media_role === 'supporting_image') : [];
  const websiteScreenshots = entry.media.filter((image) => image.media_role === 'page_screenshot');
  const standardGallery = entry.media.filter((image) => image.media_role !== 'page_screenshot');
  const hasCaseStudySections = entry.caseStudySections.some((section) => section.heading.trim() && section.bodyMarkdown.trim());
  const hasLogofolioNarrative = Boolean(entry.bodyMarkdown.trim() || hasCaseStudySections);
  const hasLogofolioProjectInfo = hasLogofolioNarrative || metadata.length > 0 || entry.tags.length > 0;

  return (
    <main className="page-frame detail-page" id="main-content">
      {preview ? <aside className="project-preview-notice" role="status">
        <div><p className="eyebrow">Private preview</p><p>Showing the latest saved version. Only signed-in portfolio admins can view this page.</p></div>
        <Link className="text-link" href={`/admin/entries/${entry.id}`}>Back to editor ↗</Link>
      </aside> : null}
      <Link className="back-link" href={`/work/category/${entry.category.slug}`}>← {entry.category.name}</Link>
      <header className="detail-header">
        <p className="eyebrow">{entry.category.name}</p>
        <h1>{entry.title}</h1>
        <p className="detail-header__summary">{entry.summary}</p>
        {entry.presentation !== 'logofolio' && metadata.length > 0 ? (
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

          {logofolioLogos.length > 0 ? <section aria-labelledby="gallery-title" className="detail-gallery logofolio-gallery">
            <div className="section-heading"><div><p className="eyebrow">Marks and variations</p><h2 id="gallery-title">Logo gallery</h2></div></div>
            <ProjectGallery images={logofolioLogos} />
          </section> : null}
          {logofolioSupporting.length > 0 ? <section aria-labelledby="supporting-gallery-title" className="detail-gallery logofolio-gallery">
            <div className="section-heading"><div><p className="eyebrow">In context</p><h2 id="supporting-gallery-title">Supporting images</h2></div></div>
            <ProjectGallery images={logofolioSupporting} />
          </section> : null}
          {websiteScreenshots.length > 0 ? <section aria-labelledby="website-pages-title" className="detail-gallery website-screenshots">
            <div className="section-heading"><div><p className="eyebrow">Full-page captures</p><h2 id="website-pages-title">Website pages</h2></div></div>
            <WebsitePageScreenshots images={websiteScreenshots} />
          </section> : null}

          {hasLogofolioProjectInfo ? <section aria-label="Project information" className={`logofolio-info${hasLogofolioNarrative && (metadata.length > 0 || entry.tags.length > 0) ? ' logofolio-info--split' : ''}`}>
            {hasLogofolioNarrative ? <div className="logofolio-info__copy">
              <p className="eyebrow">Project notes</p>
              <h2>About this project</h2>
              {entry.bodyMarkdown ? <div className="logofolio-description"><SafeMarkdown source={entry.bodyMarkdown} /></div> : null}
              <CaseStudySections sections={entry.caseStudySections} />
            </div> : null}
            {metadata.length > 0 || entry.tags.length > 0 ? <aside aria-label="Project information and tools" className="logofolio-info__aside">
              <p className="eyebrow">At a glance</p>
              <h2>Project info</h2>
              {metadata.length > 0 ? <dl className="detail-meta logofolio-info__meta">
                {metadata.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
              </dl> : null}
              {projectTools.length > 0 || projectTags.length > 0 ? <section aria-labelledby="logofolio-tools-title" className="logofolio-tools">
                <p className="eyebrow">{projectTools.length > 0 ? 'The making of it' : 'Project notes'}</p>
                {projectTools.length > 0 ? <h3 id="logofolio-tools-title">Tools used</h3> : <h3 id="logofolio-tools-title">Project tags</h3>}
                {projectTools.length > 0 ? <ul className="tag-list" aria-label="Tools used">
                  {projectTools.map((tool) => <li key={tool.id}><TechnologyMark id={technologyIdForLabel(tool.name)} label={tool.name} /><span>{tool.name}</span></li>)}
                </ul> : null}
                {projectTags.length > 0 ? <>
                  {projectTools.length > 0 ? <h4 className="logofolio-info__tag-title">Project tags</h4> : null}
                  <ul className="tag-list" aria-label="Project tags">
                    {projectTags.map((tag) => <li key={tag.id}><span>{tag.name}</span></li>)}
                  </ul>
                </> : null}
              </section> : null}
            </aside> : null}
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
            <CaseStudySections sections={entry.caseStudySections} />
          </section>
        </div>
        {websiteScreenshots.length > 0 ? <section aria-labelledby="website-pages-title" className="detail-gallery website-screenshots">
          <div className="section-heading"><div><p className="eyebrow">Full-page captures</p><h2 id="website-pages-title">Website pages</h2></div></div>
          <WebsitePageScreenshots images={websiteScreenshots} />
        </section> : null}
        {standardGallery.length > 0 ? (
          <section aria-labelledby="gallery-title" className="detail-gallery">
            <div className="section-heading"><div><p className="eyebrow">A closer look</p><h2 id="gallery-title">Gallery</h2></div></div>
            <ProjectGallery images={standardGallery} />
          </section>
        ) : null}
      </>}

      <div className={`detail-end${entry.presentation === 'logofolio' ? ' detail-end--logofolio' : ''}`}><Link className="text-link" href="/work">Back to all work ↗</Link></div>
    </main>
  );
}

function formatCompletionDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}
