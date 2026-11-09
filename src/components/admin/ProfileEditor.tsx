'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { TechnologyMark } from '@/components/public/TechnologyMark';
import { SocialLinkMark } from '@/components/public/SocialLinkMark';
import { uploadPortfolioImage } from '@/lib/media/upload-image';
import {
  normalizeStoredTechnologies,
  TECHNOLOGY_OPTIONS,
  type StoredTechnology,
  type TechnologyId,
  type TechnologyStatus,
} from '@/lib/tech-stack';

type Profile = {
  display_name: string; headline: string; bio: string; location: string | null; contact_url: string | null;
  avatar_path: string | null; avatar_alt: string | null; avatar_preview_url: string | null;
  skills: StoredTechnology[]; social_links: Array<{ label: string; url: string }>;
};
type Envelope<T> = { data?: T; error?: { message?: string; fields?: Record<string, string> }; meta?: { cleanup_pending?: string[] } };

const socialPlatforms = ['Email', 'LinkedIn', 'Behance', 'GitHub', 'Dribbble', 'Instagram', 'YouTube', 'Website', 'Other'] as const;

function knownSocialPlatform(label: string) {
  return socialPlatforms.find((platform) => platform.toLocaleLowerCase() === label.toLocaleLowerCase() && platform !== 'Other');
}

export function ProfileEditor({ initialProfile }: { initialProfile: Profile }) {
  const [profile, setProfile] = useState({ ...initialProfile, skills: normalizeStoredTechnologies(initialProfile.skills) });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initialProfile.avatar_preview_url ?? '');
  const [message, setMessage] = useState('');
  const [technologyQuery, setTechnologyQuery] = useState('');
  const [pending, setPending] = useState(false);
  const [cleanupPaths, setCleanupPaths] = useState<string[]>([]);

  function changeAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) setAvatarPreview(URL.createObjectURL(file));
  }

  function setTechnology(id: TechnologyId, checked: boolean) {
    setProfile((current) => {
      const catalogSkills = current.skills.filter((skill): skill is Extract<StoredTechnology, { id: TechnologyId }> => 'id' in skill);
      const existing = catalogSkills.find((skill) => skill.id === id);
      const legacy = current.skills.filter((skill) => !('id' in skill));
      const selected = TECHNOLOGY_OPTIONS.flatMap((technology) => {
        if (technology.id === id && checked) return [{ id, status: existing?.status ?? 'known' as const }];
        if (technology.id === id) return [];
        return catalogSkills.filter((skill) => skill.id === technology.id);
      });
      return { ...current, skills: [...selected, ...legacy] };
    });
  }

  function setTechnologyStatus(id: TechnologyId, status: TechnologyStatus) {
    setProfile((current) => ({
      ...current,
      skills: current.skills.map((skill) => 'id' in skill && skill.id === id ? { ...skill, status } : skill),
    }));
  }

  async function retryCleanup(paths: string[]) {
    const remaining: string[] = [];
    for (const object_path of paths) {
      const response = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ object_path }), signal: AbortSignal.timeout(15_000) }).catch(() => null);
      if (!response?.ok) remaining.push(object_path);
    }
    setCleanupPaths(remaining);
    return remaining.length;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(avatarFile ? 'Uploading profile image…' : 'Saving profile…');
    const formElement = event.currentTarget;
    let uploadedPath = '';
    try {
      let avatarPath = profile.avatar_path;
      if (avatarFile) {
        setMessage('Uploading profile image…');
        const uploadResult = await uploadPortfolioImage(avatarFile, 'avatar');
        avatarPath = uploadedPath = uploadResult.object_path;
      }
      const payload = {
        display_name: profile.display_name, headline: profile.headline, bio: profile.bio,
        location: profile.location || null, contact_url: profile.contact_url || null,
        avatar_path: avatarPath, avatar_alt: avatarPath ? profile.avatar_alt : null,
        skills: profile.skills,
        social_links: profile.social_links.filter((link) => link.url.trim()),
      };
      setMessage('Saving profile details…');
      const response = await fetch('/api/admin/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(120_000) });
      const result = await response.json() as Envelope<Profile>;
      if (!response.ok || !result.data) {
        const details = result.error?.fields ? ` ${Object.entries(result.error.fields).map(([key, value]) => `${key}: ${value}`).join(' ')}` : '';
        throw new Error(`${result.error?.message ?? 'Profile could not be saved.'}${details}`);
      }
      setProfile({ ...result.data, skills: normalizeStoredTechnologies(result.data.skills) });
      setAvatarFile(null);
      const remaining = await retryCleanup(result.meta?.cleanup_pending ?? []);
      setMessage(remaining ? 'Profile saved. Some old images still need cleanup.' : 'Profile saved.');
    } catch (error) {
      if (uploadedPath) await retryCleanup([uploadedPath]);
      setMessage(error instanceof Error ? error.message : 'Profile could not be saved.');
    } finally { setPending(false); }
  }

  const legacySkills = profile.skills.filter((skill): skill is Extract<StoredTechnology, { name: string }> => !('id' in skill));
  const normalizedTechnologyQuery = technologyQuery.trim().toLocaleLowerCase();
  const technologyGroups = TECHNOLOGY_OPTIONS.reduce<Record<string, typeof TECHNOLOGY_OPTIONS[number][]>>((groups, technology) => {
    const matches = !normalizedTechnologyQuery
      || technology.name.toLocaleLowerCase().includes(normalizedTechnologyQuery)
      || technology.group.toLocaleLowerCase().includes(normalizedTechnologyQuery);
    if (matches) (groups[technology.group] ??= []).push(technology);
    return groups;
  }, {});

  return <form className="admin-form admin-profile-form" onSubmit={submit}>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Public identity</p><h2>About you</h2></div></div>
      <div className="admin-profile-grid"><div className="admin-avatar-control">{avatarPreview ? <img alt="" src={avatarPreview} /> : <div className="admin-avatar-empty">YN</div>}<label className="admin-file-picker">{avatarPreview ? 'Replace portrait' : 'Choose portrait'}<input accept="image/jpeg,image/png,image/webp,image/avif" onChange={changeAvatar} type="file" /></label><p className="admin-field-note">JPEG, PNG, WebP, or AVIF. Up to 15 MiB.</p>{avatarPreview ? <button className="admin-text-button admin-text-button--danger" onClick={() => { setAvatarFile(null); setAvatarPreview(''); setProfile((current) => ({ ...current, avatar_path: null, avatar_alt: null })); }} type="button">Remove portrait</button> : null}</div>
        <div className="admin-stack"><label>Display name<input maxLength={120} onChange={(event) => setProfile((current) => ({ ...current, display_name: event.target.value }))} required value={profile.display_name} /></label><label>Headline<input maxLength={180} onChange={(event) => setProfile((current) => ({ ...current, headline: event.target.value }))} value={profile.headline} /></label>{avatarPreview ? <label>Portrait alternative text<input maxLength={300} onChange={(event) => setProfile((current) => ({ ...current, avatar_alt: event.target.value }))} required value={profile.avatar_alt ?? ''} /></label> : null}</div>
      </div>
      <label>Biography<textarea maxLength={12000} onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))} rows={8} value={profile.bio} /></label>
      <div className="admin-form-grid"><label>Location<input maxLength={120} onChange={(event) => setProfile((current) => ({ ...current, location: event.target.value || null }))} value={profile.location ?? ''} /></label></div>
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">A small, honest toolkit</p><h2>Technologies</h2><p className="admin-panel-intro">Choose the tools you want people to see, then mark whether you use them or are learning them.</p></div></div>
      <label className="admin-tech-search">Search the technology catalog<input autoComplete="off" onChange={(event) => setTechnologyQuery(event.target.value)} placeholder="Try ‘React’, ‘SEO’, or ‘Microsoft’" type="search" value={technologyQuery} /></label>
      <div aria-label="Choose technologies to show on the public profile" className="admin-tech-groups">
        {Object.entries(technologyGroups).map(([group, technologies]) => <details className="admin-tech-group" key={group}>
          <summary><span>{group}</span><span>{technologies.length} tools</span></summary>
          <div className="admin-tech-list">
            {technologies.map((technology) => {
              const selected = profile.skills.find((skill) => 'id' in skill && skill.id === technology.id);
              return <div className="admin-tech-option" key={technology.id}>
                <label className="admin-tech-option__choice"><input checked={Boolean(selected)} onChange={(event) => setTechnology(technology.id, event.target.checked)} type="checkbox" /><TechnologyMark id={technology.id} label={technology.name} /><span><strong>{technology.name}</strong></span></label>
                {selected ? <label className="admin-tech-option__status"><span>Status</span><select aria-label={`${technology.name} status`} onChange={(event) => setTechnologyStatus(technology.id, event.target.value as TechnologyStatus)} value={selected.status}><option value="known">I use this</option><option value="learning">I’m learning this</option></select></label> : null}
              </div>;
            })}
          </div>
        </details>)}
        {Object.keys(technologyGroups).length === 0 ? <p className="admin-field-note">No tools match that search.</p> : null}
      </div>
      {legacySkills.length > 0 ? <div className="admin-legacy-skills"><h3>Older custom skills</h3><p className="admin-field-note">These were entered before the technology list. Keep them for now or remove them.</p>{legacySkills.map((skill) => <div className="admin-legacy-skill" key={`${skill.name}-${skill.group ?? ''}`}><span>{skill.name}{skill.group ? ` · ${skill.group}` : ''}</span><button className="admin-text-button admin-text-button--danger" onClick={() => setProfile((current) => ({ ...current, skills: current.skills.filter((item) => item !== skill) }))} type="button">Remove</button></div>)}</div> : null}
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Keep in touch</p><h2>Contact and social links</h2><p className="admin-panel-intro">Add the places where people can reach you or find your work. Email links accept an email address; other links use HTTPS.</p></div></div>
      <label className="admin-profile-form__primary-contact">Primary contact link<input autoComplete="url" onChange={(event) => setProfile((current) => ({ ...current, contact_url: event.target.value || null }))} placeholder="mailto:hello@example.com" value={profile.contact_url ?? ''} /></label>
      <div className="admin-social-links">{profile.social_links.map((link, index) => {
        const platform = knownSocialPlatform(link.label);
        const isEmail = (platform ?? link.label) === 'Email';
        const displayValue = isEmail ? link.url.replace(/^mailto:/i, '') : link.url;
        return <div className="admin-social-link-row" key={`${link.label}-${index}`}>
          <div className="admin-social-link-row__mark"><SocialLinkMark label={platform ?? link.label} url={link.url} /></div>
          <label>Platform<select onChange={(event) => setProfile((current) => ({ ...current, social_links: current.social_links.map((item, itemIndex) => itemIndex === index ? { label: event.target.value === 'Other' ? '' : event.target.value, url: '' } : item) }))} value={platform ?? 'Other'}>{socialPlatforms.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
          {!platform ? <label>Link name<input autoComplete="off" maxLength={40} onChange={(event) => setProfile((current) => ({ ...current, social_links: current.social_links.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) }))} placeholder="Portfolio, Mastodon…" value={link.label} /></label> : null}
          <label className="admin-social-link-row__url">{isEmail ? 'Email address' : 'Profile URL'}<input autoComplete={isEmail ? 'email' : 'url'} maxLength={500} onChange={(event) => {
            const value = event.target.value.trim();
            const url = isEmail ? (value ? `mailto:${value.replace(/^mailto:/i, '')}` : '') : value;
            setProfile((current) => ({ ...current, social_links: current.social_links.map((item, itemIndex) => itemIndex === index ? { ...item, url } : item) }));
          }} placeholder={isEmail ? 'name@example.com' : 'https://…'} required value={displayValue} /></label>
          <button aria-label={`Remove ${link.label || 'contact'} link`} className="admin-text-button admin-text-button--danger" onClick={() => setProfile((current) => ({ ...current, social_links: current.social_links.filter((_, itemIndex) => itemIndex !== index) }))} type="button">Remove</button>
        </div>;
      })}</div>
      {profile.social_links.length < 20 ? <button className="admin-button admin-social-links__add" onClick={() => setProfile((current) => ({ ...current, social_links: [...current.social_links, { label: 'LinkedIn', url: '' }] }))} type="button">+ Add a contact or social link</button> : <p className="admin-field-note">You’ve reached the 20-link limit.</p>}
    </section>
    {message ? <p className="admin-feedback" role="status">{message}</p> : null}{cleanupPaths.length ? <button className="admin-button" disabled={pending} onClick={() => void retryCleanup(cleanupPaths)} type="button">Retry cleanup ({cleanupPaths.length})</button> : null}
    <div className="admin-form-actions"><button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? 'Saving…' : 'Save profile'}</button></div>
  </form>;
}
