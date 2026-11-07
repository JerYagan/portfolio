'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { TechnologyMark } from '@/components/public/TechnologyMark';
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
      const response = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ object_path }) }).catch(() => null);
      if (!response?.ok) remaining.push(object_path);
    }
    setCleanupPaths(remaining);
    return remaining.length;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage('');
    const formElement = event.currentTarget;
    let uploadedPath = '';
    try {
      let avatarPath = profile.avatar_path;
      if (avatarFile) {
        const form = new FormData(); form.set('file', avatarFile);
        const upload = await fetch('/api/admin/media', { method: 'POST', body: form });
        const uploadResult = await upload.json() as Envelope<{ object_path: string }>;
        if (!upload.ok || !uploadResult.data) throw new Error(uploadResult.error?.message ?? 'Avatar could not be uploaded.');
        avatarPath = uploadedPath = uploadResult.data.object_path;
      }
      const payload = {
        display_name: profile.display_name, headline: profile.headline, bio: profile.bio,
        location: profile.location || null, contact_url: profile.contact_url || null,
        avatar_path: avatarPath, avatar_alt: avatarPath ? profile.avatar_alt : null,
        skills: profile.skills,
        social_links: parseLinks((formElement.elements.namedItem('social_links') as HTMLTextAreaElement).value),
      };
      const response = await fetch('/api/admin/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
      <div className="admin-profile-grid"><div className="admin-avatar-control">{avatarPreview ? <img alt="" src={avatarPreview} /> : <div className="admin-avatar-empty">YN</div>}<label className="admin-file-picker">{avatarPreview ? 'Replace portrait' : 'Choose portrait'}<input accept="image/jpeg,image/png,image/webp,image/avif" onChange={changeAvatar} type="file" /></label>{avatarPreview ? <button className="admin-text-button admin-text-button--danger" onClick={() => { setAvatarFile(null); setAvatarPreview(''); setProfile((current) => ({ ...current, avatar_path: null, avatar_alt: null })); }} type="button">Remove portrait</button> : null}</div>
        <div className="admin-stack"><label>Display name<input maxLength={120} onChange={(event) => setProfile((current) => ({ ...current, display_name: event.target.value }))} required value={profile.display_name} /></label><label>Headline<input maxLength={180} onChange={(event) => setProfile((current) => ({ ...current, headline: event.target.value }))} value={profile.headline} /></label>{avatarPreview ? <label>Portrait alternative text<input maxLength={300} onChange={(event) => setProfile((current) => ({ ...current, avatar_alt: event.target.value }))} required value={profile.avatar_alt ?? ''} /></label> : null}</div>
      </div>
      <label>Biography<textarea maxLength={12000} onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))} rows={8} value={profile.bio} /></label>
      <div className="admin-form-grid"><label>Location<input maxLength={120} onChange={(event) => setProfile((current) => ({ ...current, location: event.target.value || null }))} value={profile.location ?? ''} /></label><label>Contact URL or email link<input onChange={(event) => setProfile((current) => ({ ...current, contact_url: event.target.value || null }))} placeholder="mailto:hello@example.test" value={profile.contact_url ?? ''} /></label></div>
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
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Elsewhere</p><h2>Social links</h2></div></div><label>One per line: label | HTTPS URL<textarea defaultValue={profile.social_links.map((link) => `${link.label} | ${link.url}`).join('\n')} maxLength={10000} name="social_links" rows={7} /></label></section>
    {message ? <p className="admin-feedback" role="status">{message}</p> : null}{cleanupPaths.length ? <button className="admin-button" disabled={pending} onClick={() => void retryCleanup(cleanupPaths)} type="button">Retry cleanup ({cleanupPaths.length})</button> : null}
    <div className="admin-form-actions"><button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? 'Saving…' : 'Save profile'}</button></div>
  </form>;
}

function parseLinks(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [label, ...url] = line.split('|').map((part) => part.trim());
    return { label, url: url.join('|').trim() };
  });
}
