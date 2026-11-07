import type { Metadata } from 'next';
import Link from 'next/link';
import { PortfolioImage } from '@/components/public/PortfolioImage';
import { ProjectCard } from '@/components/public/ProjectCard';
import { TechnologyList } from '@/components/public/TechnologyList';
import { getPublicCategories, getPublicProfile, getPublishedEntries } from '@/lib/data/portfolio';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicProfile();
  return {
    title: profile.displayName,
    description: (profile.headline || profile.bio || 'A portfolio of websites, graphic design, drawings, and digital systems.').slice(0, 180),
  };
}

export default async function HomePage() {
  const [profile, categories, featured, latest] = await Promise.all([
    getPublicProfile(),
    getPublicCategories(),
    getPublishedEntries({ featured: true, page: 1, limit: 3 }),
    getPublishedEntries({ sort: 'latest', page: 1, limit: 8 }),
  ]);
  const intro = profile.bio || 'I make websites, visuals, and little digital experiments. This is where I keep the work I’m proud to share.';

  return (
    <main className="home-page" id="main-content">
      <section aria-labelledby="profile-title" className="profile-page page-frame">
        <div className="profile-page__portrait"><PortfolioImage className="profile-page__image" eager image={profile.avatar} /></div>
        <div className="profile-page__copy">
          <p className="eyebrow"><span className="eyebrow__rule" /> A little about me</p>
          <h1 id="profile-title">Hi, I’m <em>{profile.displayName}.</em></h1>
          {profile.headline ? <p className="profile-page__headline">{profile.headline}</p> : null}
          <p className="profile-page__bio">{intro}</p>
          {profile.location ? <p className="profile-page__location">Based in {profile.location}</p> : null}
          <div className="profile-page__actions">
            {profile.contactUrl ? <a className="button button--primary" href={profile.contactUrl}>Say hello <span aria-hidden="true">↗</span></a> : <Link className="button button--primary" href="/about">More about me <span aria-hidden="true">↗</span></Link>}
            <Link className="text-link" href="/work">Browse the work <span aria-hidden="true">↘</span></Link>
          </div>
          {profile.socialLinks.length > 0 ? <ul aria-label="Social links" className="profile-page__socials">{profile.socialLinks.map((link) => <li key={`${link.label}-${link.url}`}><a href={link.url} rel="noreferrer noopener" target="_blank">{link.label}<span aria-hidden="true">↗</span></a></li>)}</ul> : null}
        </div>
        <aside aria-label="Tools and technologies" className="profile-page__toolkit">
          <p className="eyebrow">Things I work with</p>
          <TechnologyList skills={profile.skills} />
        </aside>
      </section>

      <section aria-labelledby="work-title" className="work-section page-frame home-featured" id="work">
        <div className="section-heading">
          <div><p className="eyebrow">A few things I’ve made</p><h2 id="work-title">Featured work</h2></div>
          <Link className="text-link" href="/work">Browse all work ↗</Link>
        </div>

        {featured.entries.length > 0 ? (
          <div className="project-grid project-grid--featured">
            {featured.entries.map((entry, index) => <ProjectCard entry={entry} key={entry.id} priority={index < 2} />)}
          </div>
        ) : (
          <div className="empty-work">
            <span aria-hidden="true" className="empty-work__symbol">✳</span>
            <div><h3>Your first featured project will live here.</h3><p>Published projects will appear here as they are added to the portfolio.</p></div>
            <span className="empty-work__status">NO FEATURED WORK</span>
          </div>
        )}
      </section>

      <section aria-labelledby="latest-work-title" className="work-section page-frame home-latest">
        <div className="section-heading">
          <div><p className="eyebrow">Fresh from the archive</p><h2 id="latest-work-title">Latest work</h2></div>
          <Link className="text-link" href="/work">See the full archive ↗</Link>
        </div>
        {latest.entries.length > 0 ? (
          <div className="project-grid">
            {latest.entries.slice(0, 8).map((entry, index) => <ProjectCard entry={entry} key={entry.id} priority={index < 2} />)}
          </div>
        ) : (
          <p className="muted-note home-latest__empty">New work will find its way here as it is published.</p>
        )}
      </section>

      {categories.length > 0 ? <nav aria-label="Browse portfolio categories" className="home-category-section page-frame">
        <div><p className="eyebrow">By discipline</p><h2>Browse by category</h2></div>
        <ul>{categories.map((category) => <li key={category.id}><Link href={`/work/category/${category.slug}`}>{category.name}<span aria-hidden="true">↗</span></Link></li>)}</ul>
      </nav> : null}

      <section aria-labelledby="contact-title" className="contact-section page-frame" id="contact">
        <div><p className="eyebrow">Drop me a note</p><h2 id="contact-title">I’d be glad to hear from you.</h2></div>
        <div className="contact-section__details">
          {profile.contactUrl ? (
            <a className="contact-email" href={profile.contactUrl}>{profile.contactUrl.startsWith('mailto:') ? profile.contactUrl.slice(7) : 'Visit my contact link'} <span aria-hidden="true">↗</span></a>
          ) : <p className="muted-note">Contact details will appear here once added.</p>}
          {profile.socialLinks.length > 0 ? (
            <ul aria-label="Social links" className="social-placeholder">
              {profile.socialLinks.map((link) => <li key={`${link.label}-${link.url}`}><a href={link.url} rel="noreferrer noopener" target="_blank">{link.label}<span aria-hidden="true">↗</span></a></li>)}
            </ul>
          ) : null}
        </div>
      </section>
    </main>
  );
}
