import type { Metadata } from 'next';
import { PortfolioImage } from '@/components/public/PortfolioImage';
import { SafeMarkdown } from '@/components/public/SafeMarkdown';
import { TechnologyList } from '@/components/public/TechnologyList';
import { SocialLinkMark } from '@/components/public/SocialLinkMark';
import { getPublicProfile } from '@/lib/data/portfolio';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicProfile();
  return {
    title: `About ${profile.displayName}`,
    description: (profile.bio || `More about ${profile.displayName} and the work in this portfolio.`).slice(0, 180),
  };
}

export default async function AboutPage() {
  const profile = await getPublicProfile();

  return (
    <main className="page-frame about-page" id="main-content">
      <header className="page-intro">
        <p className="eyebrow">A little about the maker</p>
        <h1>About {profile.displayName}</h1>
        {profile.headline ? <p>{profile.headline}</p> : null}
      </header>

      <div className="about-page__grid">
        <div className="about-page__portrait">
          <PortfolioImage className="about-page__image" image={profile.avatar} />
          {profile.location ? <p className="quiet-label">Based in {profile.location}</p> : null}
        </div>

        <div className="about-page__content">
          <section aria-labelledby="story-title">
            <p className="eyebrow">The story so far</p>
            <h2 className="visually-hidden" id="story-title">Biography</h2>
            {profile.bio ? <SafeMarkdown source={profile.bio} /> : <p className="muted-note">A biography will appear here once it has been added to the profile.</p>}
          </section>

          <section aria-labelledby="skills-title" className="about-page__skills">
            <p className="eyebrow">Tools &amp; practice</p>
            <h2 id="skills-title">Skills and stack</h2>
            <TechnologyList skills={profile.skills} />
          </section>

          <section aria-labelledby="contact-about-title" className="about-page__contact">
            <p className="eyebrow">Say hello</p>
            <h2 id="contact-about-title">Contact &amp; links</h2>
            <ul className="profile-links">
              {profile.contactUrl ? <li><a href={profile.contactUrl}><SocialLinkMark label={profile.contactUrl.startsWith('mailto:') ? 'Email' : 'Website'} url={profile.contactUrl} /><span>{profile.contactUrl.startsWith('mailto:') ? profile.contactUrl.slice(7) : 'Contact' }</span><span aria-hidden="true">↗</span></a></li> : null}
              {profile.socialLinks.map((link) => <li key={`${link.label}-${link.url}`}><a href={link.url} rel={link.url.startsWith('mailto:') ? undefined : 'noreferrer noopener'} target={link.url.startsWith('mailto:') ? undefined : '_blank'}><SocialLinkMark label={link.label} url={link.url} /><span>{link.label}</span><span aria-hidden="true">↗</span></a></li>)}
            </ul>
            {!profile.contactUrl && profile.socialLinks.length === 0 ? <p className="muted-note">Contact details and social links will appear here once added.</p> : null}
          </section>
        </div>
      </div>
    </main>
  );
}
