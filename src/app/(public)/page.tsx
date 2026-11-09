import type { Metadata } from 'next';
import Link from 'next/link';
import { PortfolioImage } from '@/components/public/PortfolioImage';
import { ProjectCard } from '@/components/public/ProjectCard';
import { TechnologyList } from '@/components/public/TechnologyList';
import { SocialLinkMark } from '@/components/public/SocialLinkMark';
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
  const contactLinks = [
    ...(profile.contactUrl ? [{ label: profile.contactUrl.startsWith('mailto:') ? 'Email' : 'Contact', url: profile.contactUrl }] : []),
    ...profile.socialLinks,
  ];

  return (
    <main className="home-page" id="main-content">
      <section aria-labelledby="profile-title" className="profile-page page-frame">
        <div className="profile-page__portrait"><PortfolioImage className="profile-page__image" eager image={profile.avatar} /></div>
        <div className="profile-page__copy">
          <h1 id="profile-title">Hi, I’m <em>Jerwin</em></h1>
          {profile.headline ? <p className="profile-page__headline">{profile.headline}</p> : null}
          <p className="profile-page__bio">{intro}</p>
          {profile.location ? <p className="profile-page__location">Based in {profile.location}</p> : null}
          <div className="profile-page__actions">
            {profile.contactUrl ? <a className="button button--primary" href={profile.contactUrl}>Say hello <span aria-hidden="true">↗</span></a> : <Link className="button button--primary" href="/#contact">Say hello <span aria-hidden="true">↗</span></Link>}
            <Link className="text-link" href="/work">Browse the work <span aria-hidden="true">↘</span></Link>
          </div>
          {profile.socialLinks.length > 0 ? <ul aria-label="Social links" className="profile-page__socials">{profile.socialLinks.map((link) => <li key={`${link.label}-${link.url}`}><a href={link.url} rel={link.url.startsWith('mailto:') ? undefined : 'noreferrer noopener'} target={link.url.startsWith('mailto:') ? undefined : '_blank'}><SocialLinkMark label={link.label} url={link.url} /><span>{link.label}</span></a></li>)}</ul> : null}
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
        <div className="home-category-section__heading"><p className="eyebrow">By discipline</p><h2>Browse by category</h2><p>A few different corners of the work I make.</p></div>
        <ul>{categories.map((category, index) => <li key={category.id}><span className="home-category-section__number">{String(index + 1).padStart(2, '0')}</span><div><Link href={`/work/category/${category.slug}`}>{category.name}<span aria-hidden="true">↗</span></Link>{category.description ? <p>{category.description}</p> : null}</div></li>)}</ul>
      </nav> : null}

      <section aria-labelledby="contact-title" className="contact-section page-frame" id="contact">
        <div className="contact-section__intro"><p className="eyebrow">Drop me a note</p><h2 id="contact-title">I’d be glad to hear from you.</h2><p>For a project, a question, or just to say hello.</p></div>
        <div className="contact-section__details">
          {contactLinks.length ? <ul aria-label="Contact and social links" className="contact-link-list">{contactLinks.map((link, index) => {
            const isEmail = link.url.startsWith('mailto:');
            const href = isEmail ? link.url : link.url;
            const detail = isEmail ? link.url.slice(7) : link.url.replace(/^https:\/\/(www\.)?/i, '').replace(/\/$/, '');
            return <li key={`${link.label}-${link.url}-${index}`}><a href={href} rel={isEmail ? undefined : 'noreferrer noopener'} target={isEmail ? undefined : '_blank'}><SocialLinkMark label={link.label} url={link.url} /><span className="contact-link-list__text"><strong>{link.label}</strong><small>{detail}</small></span><span aria-hidden="true" className="contact-link-list__arrow">↗</span></a></li>;
          })}</ul> : <p className="muted-note">Contact details will appear here once added.</p>}
        </div>
      </section>
    </main>
  );
}
