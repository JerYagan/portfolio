'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { TechnologyMark } from '@/components/public/TechnologyMark';
import { TECHNOLOGY_OPTIONS, technologyIdForLabel, technologyOption, type TechnologyId } from '@/lib/tech-stack';

type Category = { id: string; name: string };
type MediaRole = 'presentation_board' | 'logo_variation' | 'supporting_image' | 'page_screenshot';
type ScreenshotDevice = 'desktop' | 'tablet' | 'mobile';
type CaseStudySection = { heading: string; body_markdown: string };
type MediaItem = { id?: string; object_path: string; alt_text: string; caption: string | null; media_role: MediaRole; page_name: string | null; device_label: ScreenshotDevice | null; sort_order: number; preview_url: string | null };
type Entry = {
  id: string; category_id: string; title: string; slug: string; summary: string; presentation: 'standard' | 'logofolio'; body_markdown: string;
  case_study_sections: CaseStudySection[];
  thumbnail_path: string | null; thumbnail_alt: string | null; thumbnail_preview_url: string | null;
  project_url: string | null; repository_url: string | null; year: number | null; completed_on: string | null; project_status: 'in_progress' | 'completed' | null; client_label: string | null;
  role: string | null; status: 'draft' | 'published'; is_featured: boolean; sort_order: number;
  seo_title: string | null; seo_description: string | null; tags: Array<{ id: string; name: string; slug: string }>;
  media: MediaItem[];
};
type Envelope<T> = { data?: T; error?: { message?: string; fields?: Record<string, string> }; meta?: { cleanup_pending?: string[] } };
type NewMedia = { key: string; file: File; alt_text: string; caption: string; media_role: MediaRole; page_name: string; device_label: ScreenshotDevice; preview_url: string };

const blankEntry: Omit<Entry, 'id'> = {
  category_id: '', title: '', slug: '', summary: '', presentation: 'standard', body_markdown: '', case_study_sections: [], thumbnail_path: null, thumbnail_alt: null,
  thumbnail_preview_url: null, project_url: null, repository_url: null, year: null, completed_on: null, project_status: 'in_progress', client_label: null, role: null,
  status: 'draft', is_featured: false, sort_order: 0, seo_title: null, seo_description: null, tags: [], media: [],
};

export function EntryEditor({ categories, initialEntry }: { categories: Category[]; initialEntry: Entry | null }) {
  const router = useRouter();
  const [entry, setEntry] = useState<Omit<Entry, 'id'>>(initialEntry ?? blankEntry);
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(initialEntry?.thumbnail_preview_url ?? '');
  const [newGallery, setNewGallery] = useState<NewMedia[]>([]);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [cleanupPaths, setCleanupPaths] = useState<string[]>([]);
  const [toolSearch, setToolSearch] = useState('');
  const isEditing = Boolean(initialEntry);

  function setField<K extends keyof Omit<Entry, 'id'>>(key: K, value: Omit<Entry, 'id'>[K]) {
    setEntry((current) => ({ ...current, [key]: value }));
  }

  function setTool(id: TechnologyId, checked: boolean) {
    const option = technologyOption(id);
    if (!option) return;
    setEntry((current) => {
      const tags = current.tags.filter((tag) => technologyIdForLabel(tag.name) !== id);
      return { ...current, tags: checked ? [...tags, { id: '', name: option.name, slug: option.id }] : tags };
    });
  }

  function updateCaseStudySection(index: number, patch: Partial<CaseStudySection>) {
    setField('case_study_sections', entry.case_study_sections.map((section, sectionIndex) => sectionIndex === index ? { ...section, ...patch } : section));
  }

  function moveCaseStudySection(index: number, direction: -1 | 1) {
    const next = [...entry.case_study_sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setField('case_study_sections', next);
  }

  function moveExistingMedia(index: number, direction: -1 | 1) {
    const next = [...entry.media];
    const matchingIndexes = next.flatMap((item, itemIndex) => item.media_role === next[index]?.media_role ? [itemIndex] : []);
    const position = matchingIndexes.indexOf(index);
    const target = matchingIndexes[position + direction];
    if (target === undefined) return;
    [next[index], next[target]] = [next[target], next[index]];
    setField('media', next.map((item, order) => ({ ...item, sort_order: order })));
  }

  function moveNewMedia(index: number, direction: -1 | 1) {
    const next = [...newGallery];
    const matchingIndexes = next.flatMap((item, itemIndex) => item.media_role === next[index]?.media_role ? [itemIndex] : []);
    const position = matchingIndexes.indexOf(index);
    const target = matchingIndexes[position + direction];
    if (target === undefined) return;
    [next[index], next[target]] = [next[target], next[index]];
    setNewGallery(next);
  }

  function changeExistingMediaRole(index: number, media_role: MediaRole) {
    const fallbackRole = entry.presentation === 'logofolio' ? 'logo_variation' : 'supporting_image';
    setField('media', entry.media.map((media, mediaIndex) => ({
      ...media,
      media_role: mediaIndex === index ? media_role : media_role === 'presentation_board' && media.media_role === 'presentation_board' ? fallbackRole : media.media_role,
      page_name: mediaIndex === index ? media_role === 'page_screenshot' ? media.page_name ?? '' : null : media.page_name,
      device_label: mediaIndex === index ? media_role === 'page_screenshot' ? media.device_label ?? 'desktop' : null : media.device_label,
    })));
    if (media_role === 'presentation_board') setNewGallery((current) => current.map((media) => media.media_role === 'presentation_board' ? { ...media, media_role: fallbackRole } : media));
  }

  function changeNewMediaRole(key: string, media_role: MediaRole) {
    const fallbackRole = entry.presentation === 'logofolio' ? 'logo_variation' : 'supporting_image';
    setNewGallery((current) => current.map((media) => ({
      ...media,
      media_role: media.key === key ? media_role : media_role === 'presentation_board' && media.media_role === 'presentation_board' ? fallbackRole : media.media_role,
      page_name: media.key === key ? media_role === 'page_screenshot' ? media.page_name : '' : media.page_name,
      device_label: media.key === key ? media_role === 'page_screenshot' ? media.device_label : 'desktop' : media.device_label,
    })));
    if (media_role === 'presentation_board') setField('media', entry.media.map((media) => media.media_role === 'presentation_board' ? { ...media, media_role: fallbackRole } : media));
  }

  function thumbnailChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setNewThumbnail(file);
    if (file) setThumbnailPreview(URL.createObjectURL(file));
  }

  function galleryChanged(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    const mapped = files.map((file) => ({ key: crypto.randomUUID(), file, alt_text: '', caption: '', media_role: 'supporting_image' as MediaRole, page_name: '', device_label: 'desktop' as ScreenshotDevice, preview_url: URL.createObjectURL(file) }));
    setNewGallery((current) => [...current, ...mapped]);
    event.target.value = '';
  }

  async function upload(file: File) {
    const form = new FormData(); form.set('file', file);
    const response = await fetch('/api/admin/media', { method: 'POST', body: form });
    const result = await response.json() as Envelope<{ object_path: string; preview_url: string | null }>;
    if (!response.ok || !result.data) throw new Error(result.error?.message ?? 'An image could not be uploaded.');
    return result.data;
  }

  async function cleanPaths(paths: string[]) {
    const remaining: string[] = [];
    for (const object_path of paths) {
      try {
        const response = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ object_path }) });
        if (!response.ok) remaining.push(object_path);
      } catch { remaining.push(object_path); }
    }
    setCleanupPaths(remaining);
    return remaining.length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setPending(true);
    const uploaded: string[] = [];
    try {
      let thumbnailPath = entry.thumbnail_path;
      let thumbnailAlt = entry.thumbnail_alt;
      let nextThumbnailPreview = thumbnailPreview;
      if (newThumbnail) {
        const result = await upload(newThumbnail);
        uploaded.push(result.object_path);
        thumbnailPath = result.object_path;
        nextThumbnailPreview = result.preview_url ?? thumbnailPreview;
      }

      const gallery = [...entry.media];
      for (const item of newGallery) {
        const result = await upload(item.file);
        uploaded.push(result.object_path);
        gallery.push({ object_path: result.object_path, alt_text: item.alt_text.trim(), caption: item.caption.trim() || null, media_role: item.media_role, page_name: item.media_role === 'page_screenshot' ? item.page_name.trim() : null, device_label: item.media_role === 'page_screenshot' ? item.device_label : null, sort_order: gallery.length, preview_url: result.preview_url });
      }

      const payload = {
        title: entry.title, slug: entry.slug, summary: entry.summary, presentation: entry.presentation, body_markdown: entry.body_markdown,
        case_study_sections: entry.case_study_sections,
        category_id: entry.category_id, thumbnail_path: thumbnailPath, thumbnail_alt: thumbnailPath ? thumbnailAlt : null,
        project_url: entry.project_url || null, repository_url: entry.repository_url || null,
        year: entry.year ? Number(entry.year) : null, completed_on: entry.completed_on || null, project_status: entry.project_status,
        client_label: entry.client_label || null, role: entry.role || null,
        status: entry.status, is_featured: entry.is_featured, sort_order: Number(entry.sort_order),
        seo_title: entry.seo_title || null, seo_description: entry.seo_description || null,
        tag_names: entry.tags.map((tag) => tag.name),
        media: gallery.map(({ object_path, alt_text, caption, media_role, page_name, device_label }, sort_order) => ({ object_path, alt_text, caption, media_role, page_name: media_role === 'page_screenshot' ? page_name : null, device_label: media_role === 'page_screenshot' ? device_label : null, sort_order })),
      };
      const response = await fetch(isEditing ? `/api/admin/entries/${initialEntry!.id}` : '/api/admin/entries', {
        method: isEditing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json() as Envelope<Entry>;
      if (!response.ok || !result.data) {
        const detail = result.error?.fields ? ` ${Object.entries(result.error.fields).map(([key, value]) => `${key}: ${value}`).join(' ')}` : '';
        throw new Error(`${result.error?.message ?? 'Entry could not be saved.'}${detail}`);
      }
      setEntry((current) => ({ ...current, thumbnail_path: thumbnailPath, thumbnail_alt: thumbnailPath ? thumbnailAlt : null, media: gallery.map((item, sort_order) => ({ ...item, sort_order })) }));
      setThumbnailPreview(nextThumbnailPreview);
      setNewThumbnail(null);
      setNewGallery([]);
      const remaining = await cleanPaths(result.meta?.cleanup_pending ?? []);
      if (remaining) {
        setMessage('Entry saved. Some old images still need cleanup; use Retry cleanup below.');
      } else {
        setMessage('Entry saved.');
      }
      if (!isEditing) router.replace(`/admin/entries/${result.data.id}`);
      router.refresh();
    } catch (error) {
      await cleanPaths(uploaded);
      setMessage(error instanceof Error ? error.message : 'Entry could not be saved.');
    } finally { setPending(false); }
  }

  const selectedToolIds = new Set<TechnologyId>(entry.tags.flatMap((tag) => {
    const id = technologyIdForLabel(tag.name);
    return id ? [id] : [];
  }));
  const additionalTags = entry.tags.filter((tag) => !technologyIdForLabel(tag.name));
  const matchingTools = toolSearch.trim()
    ? TECHNOLOGY_OPTIONS.filter((tool) => `${tool.name} ${tool.group}`.toLocaleLowerCase().includes(toolSearch.trim().toLocaleLowerCase())).slice(0, 48)
    : [];

  return (
    <form className="admin-form admin-entry-form" onSubmit={submit}>
      <div className="admin-editor-topline">
        <p className="admin-eyebrow">{isEditing ? 'Edit portfolio entry' : 'Create a portfolio entry'}</p>
        <div className="admin-editor-topline__actions">
          {initialEntry ? <Link href={`/preview/${initialEntry.id}`} rel="noreferrer" target="_blank">Preview saved version ↗</Link> : null}
          <Link href="/admin/entries">← Back to entries</Link>
        </div>
      </div>
      <div className="admin-editor-grid">
        <div className="admin-editor-main">
          <label>Project presentation<select onChange={(event) => setField('presentation', event.target.value as Entry['presentation'])} value={entry.presentation ?? 'standard'}><option value="standard">Standard project</option><option value="logofolio">Logofolio</option></select></label>
          {entry.presentation === 'logofolio' ? <p className="admin-field-note">Choose each image role below. The presentation board is displayed full-width, followed by tools and the logo/supporting gallery.</p> : null}
          <label>Title<input maxLength={120} onChange={(event) => { const title = event.target.value; setField('title', title); if (!entry.slug) setField('slug', slugify(title)); }} required value={entry.title} /></label>
          <label>URL slug<div className="admin-input-with-button"><input maxLength={100} onChange={(event) => setField('slug', event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required value={entry.slug} /><button className="admin-text-button" onClick={() => setField('slug', slugify(entry.title))} type="button">From title</button></div></label>
          <label>Short description<textarea maxLength={240} onChange={(event) => setField('summary', event.target.value)} required rows={3} value={entry.summary} /></label>
          <label>Full details <span className="admin-field-note">Markdown is supported; HTML is displayed as text.</span><textarea className="admin-markdown-input" maxLength={30000} onChange={(event) => setField('body_markdown', event.target.value)} rows={15} value={entry.body_markdown} /></label>
          <section aria-labelledby="case-study-sections-title" className="admin-subsection admin-case-study-editor">
            <h2 id="case-study-sections-title">Case study sections</h2>
            <p className="admin-field-note">The short description stays as the project introduction. Add optional sections such as Context, Approach, Outcome, or Reflection. Incomplete sections stay private until they have body text.</p>
            <datalist id="case-study-section-headings">
              <option value="Context" /><option value="Approach" /><option value="Outcome" /><option value="Reflection" />
            </datalist>
            {entry.case_study_sections.map((section, index) => <fieldset className="admin-case-study-section" key={`case-study-${index}`}>
              <legend>Section {index + 1}</legend>
              <label>Heading<input autoComplete="off" list="case-study-section-headings" maxLength={80} onChange={(event) => updateCaseStudySection(index, { heading: event.target.value })} required value={section.heading} /></label>
              <label>Body <span className="admin-field-note">Markdown is supported; HTML is displayed as text.</span><textarea className="admin-markdown-input" maxLength={8000} onChange={(event) => updateCaseStudySection(index, { body_markdown: event.target.value })} rows={7} value={section.body_markdown} /></label>
              <div className="admin-row-actions">
                <button aria-label={`Move section ${section.heading || index + 1} up`} className="admin-text-button" disabled={index === 0} onClick={() => moveCaseStudySection(index, -1)} type="button">↑ Move up</button>
                <button aria-label={`Move section ${section.heading || index + 1} down`} className="admin-text-button" disabled={index === entry.case_study_sections.length - 1} onClick={() => moveCaseStudySection(index, 1)} type="button">↓ Move down</button>
                <button aria-label={`Remove section ${section.heading || index + 1}`} className="admin-text-button admin-text-button--danger" onClick={() => setField('case_study_sections', entry.case_study_sections.filter((_, sectionIndex) => sectionIndex !== index))} type="button">Remove section</button>
              </div>
            </fieldset>)}
            <button className="admin-button admin-button--secondary" disabled={entry.case_study_sections.length >= 12} onClick={() => setField('case_study_sections', [...entry.case_study_sections, { heading: 'Context', body_markdown: '' }])} type="button">Add section</button>
            <p className="admin-field-note">Maximum 12 sections, with headings up to 80 characters and body text up to 8,000 characters each.</p>
          </section>
          <section className="admin-subsection"><h2>Gallery</h2>
            <p className="admin-field-note">Choose “Website page screenshot” for a full-page capture. Add its page name and device size; visitors can scroll the complete image in a full-screen viewer.</p>
            {entry.media.map((item, index) => <div className="admin-media-edit-row" key={item.id ?? item.object_path}>{item.preview_url ? <img alt="" src={item.preview_url} /> : <div className="admin-image-missing">Preview unavailable</div>}<div><label>Image role<select onChange={(event) => changeExistingMediaRole(index, event.target.value as MediaRole)} value={item.media_role}><option value='presentation_board'>Presentation board</option><option value='logo_variation'>Logo variation</option><option value='supporting_image'>Supporting image</option><option value='page_screenshot'>Website page screenshot</option></select></label>{item.media_role === 'page_screenshot' ? <><label>Page name<input maxLength={80} onChange={(event) => setField('media', entry.media.map((media, mediaIndex) => mediaIndex === index ? { ...media, page_name: event.target.value } : media))} placeholder="Home" required value={item.page_name ?? ''} /></label><label>Device size<select onChange={(event) => setField('media', entry.media.map((media, mediaIndex) => mediaIndex === index ? { ...media, device_label: event.target.value as ScreenshotDevice } : media))} required value={item.device_label ?? 'desktop'}><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select></label></> : null}<label>Alternative text<input maxLength={300} onChange={(event) => setField('media', entry.media.map((media, mediaIndex) => mediaIndex === index ? { ...media, alt_text: event.target.value } : media))} required value={item.alt_text} /></label><label>Caption<input maxLength={300} onChange={(event) => setField('media', entry.media.map((media, mediaIndex) => mediaIndex === index ? { ...media, caption: event.target.value || null } : media))} value={item.caption ?? ''} /></label></div><div className="admin-gallery-actions"><button aria-label={`Move gallery image ${index + 1} up`} className="admin-text-button" disabled={!entry.media.slice(0, index).some((media) => media.media_role === item.media_role)} onClick={() => moveExistingMedia(index, -1)} type="button">↑ Up</button><button aria-label={`Move gallery image ${index + 1} down`} className="admin-text-button" disabled={!entry.media.slice(index + 1).some((media) => media.media_role === item.media_role)} onClick={() => moveExistingMedia(index, 1)} type="button">↓ Down</button><button className="admin-text-button admin-text-button--danger" onClick={() => setField('media', entry.media.filter((_, mediaIndex) => mediaIndex !== index))} type="button">Remove</button></div></div>)}
            {newGallery.map((item, index) => <div className="admin-media-edit-row" key={item.key}><img alt="" src={item.preview_url} /><div><p className="admin-file-name">{item.file.name}</p><label>Image role<select onChange={(event) => changeNewMediaRole(item.key, event.target.value as MediaRole)} value={item.media_role}><option value='presentation_board'>Presentation board</option><option value='logo_variation'>Logo variation</option><option value='supporting_image'>Supporting image</option><option value='page_screenshot'>Website page screenshot</option></select></label>{item.media_role === 'page_screenshot' ? <><label>Page name<input maxLength={80} onChange={(event) => setNewGallery((current) => current.map((media) => media.key === item.key ? { ...media, page_name: event.target.value } : media))} placeholder="Home" required value={item.page_name} /></label><label>Device size<select onChange={(event) => setNewGallery((current) => current.map((media) => media.key === item.key ? { ...media, device_label: event.target.value as ScreenshotDevice } : media))} value={item.device_label}><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select></label></> : null}<label>Alternative text<input maxLength={300} onChange={(event) => setNewGallery((current) => current.map((media) => media.key === item.key ? { ...media, alt_text: event.target.value } : media))} required value={item.alt_text} /></label><label>Caption<input maxLength={300} onChange={(event) => setNewGallery((current) => current.map((media) => media.key === item.key ? { ...media, caption: event.target.value } : media))} value={item.caption} /></label></div><div className="admin-gallery-actions"><button aria-label={`Move new gallery image ${index + 1} up`} className="admin-text-button" disabled={!newGallery.slice(0, index).some((media) => media.media_role === item.media_role)} onClick={() => moveNewMedia(index, -1)} type="button">↑ Up</button><button aria-label={`Move new gallery image ${index + 1} down`} className="admin-text-button" disabled={!newGallery.slice(index + 1).some((media) => media.media_role === item.media_role)} onClick={() => moveNewMedia(index, 1)} type="button">↓ Down</button><button className="admin-text-button admin-text-button--danger" onClick={() => setNewGallery((current) => current.filter((media) => media.key !== item.key))} type="button">Remove</button></div></div>)}
            <label className="admin-file-picker">{entry.presentation === 'logofolio' ? 'Add presentation / logo images' : 'Add gallery images'}<input accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={galleryChanged} type="file" /></label>
            <p className="admin-field-note">JPEG, PNG, WebP, or AVIF. Each image can be up to 8 MiB.</p>
          </section>
          <section className="admin-subsection"><h2>Tools used</h2>
            <p className="admin-field-note">Choose matching tools to show their logos on the public project page.</p>
            <label>Search the tool catalog<input autoComplete="off" onChange={(event) => setToolSearch(event.target.value)} placeholder="Search 170+ tools" type="search" value={toolSearch} /></label>
            <div aria-label="Selected project tools" className="admin-entry-selected-tools">
              {entry.tags.flatMap((tag) => {
                const id = technologyIdForLabel(tag.name);
                if (!id) return [];
                return [<span className="admin-entry-tool-chip" key={id}><TechnologyMark id={id} label={tag.name} />{tag.name}</span>];
              })}
              {selectedToolIds.size === 0 ? <span className="admin-field-note">No tools selected yet.</span> : null}
            </div>
            {toolSearch.trim() ? <div aria-label="Tool search results" className="admin-entry-tool-results">
              {matchingTools.map((tool) => <label className="admin-entry-tool-option" key={tool.id}>
                <input checked={selectedToolIds.has(tool.id)} onChange={(event) => setTool(tool.id, event.target.checked)} type="checkbox" />
                <TechnologyMark id={tool.id} label={tool.name} />
                <span>{tool.name}<small>{tool.group}</small></span>
              </label>)}
              {matchingTools.length === 0 ? <p className="admin-field-note">No tools match that search.</p> : null}
            </div> : <p className="admin-field-note">Type a tool name or discipline to find an option.</p>}
          </section>
        </div>
        <aside className="admin-editor-aside">
          <section className="admin-subsection"><h2>Publishing</h2>
            <label>Publishing status<select onChange={(event) => setField('status', event.target.value as Entry['status'])} value={entry.status}><option value="draft">Draft</option><option value="published">Published</option></select></label>
            <label>Category<select onChange={(event) => setField('category_id', event.target.value)} required value={entry.category_id}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="admin-switch"><input checked={entry.is_featured} onChange={(event) => setField('is_featured', event.target.checked)} type="checkbox" /><span>Feature on the home page</span></label>
            <label>Display order<input max={100000} min={-100000} onChange={(event) => setField('sort_order', Number(event.target.value))} type="number" value={entry.sort_order} /></label>
          </section>
          <section className="admin-subsection"><h2>Thumbnail</h2>
            {thumbnailPreview ? <img className="admin-thumbnail-preview" alt="" src={thumbnailPreview} /> : <div className="admin-thumbnail-empty">No thumbnail selected</div>}
            <label className="admin-file-picker">{thumbnailPreview ? 'Replace thumbnail' : 'Choose thumbnail'}<input accept="image/jpeg,image/png,image/webp,image/avif" onChange={thumbnailChanged} type="file" /></label>
            {thumbnailPreview ? <button className="admin-text-button admin-text-button--danger" onClick={() => { setNewThumbnail(null); setThumbnailPreview(''); setField('thumbnail_path', null); setField('thumbnail_alt', null); }} type="button">Remove thumbnail</button> : null}
            {thumbnailPreview ? <label>Thumbnail alternative text<input maxLength={300} onChange={(event) => setField('thumbnail_alt', event.target.value)} required value={entry.thumbnail_alt ?? ''} /></label> : null}
          </section>
          <section className="admin-subsection"><h2>Project details</h2>
            <label>Year<input max={2100} min={1900} onChange={(event) => setField('year', event.target.value ? Number(event.target.value) : null)} type="number" value={entry.year ?? ''} /></label>
            <label>Completed on<input onChange={(event) => setField('completed_on', event.target.value || null)} type="date" value={entry.completed_on ?? ''} /></label>
            <label>Project progress<select onChange={(event) => setField('project_status', (event.target.value || null) as Entry['project_status'])} value={entry.project_status ?? ''}><option value="">Not set</option><option value="in_progress">Still in progress</option><option value="completed">Completed</option></select></label>
            <label>Client or project label<input maxLength={120} onChange={(event) => setField('client_label', event.target.value || null)} value={entry.client_label ?? ''} /></label>
            <label>Your role<input maxLength={120} onChange={(event) => setField('role', event.target.value || null)} value={entry.role ?? ''} /></label>
            <label>Live project URL<input onChange={(event) => setField('project_url', event.target.value || null)} placeholder="https://" type="url" value={entry.project_url ?? ''} /></label>
            <label>Repository URL<input onChange={(event) => setField('repository_url', event.target.value || null)} placeholder="https://" type="url" value={entry.repository_url ?? ''} /></label>
            <label>Additional tags <span className="admin-field-note">Separate with commas; tools are selected above.</span><input onChange={(event) => {
              const custom = parseTags(event.target.value).filter((tag) => !technologyIdForLabel(tag.name));
              setEntry((current) => ({ ...current, tags: [...current.tags.filter((tag) => technologyIdForLabel(tag.name)), ...custom] }));
            }} value={additionalTags.map((tag) => tag.name).join(', ')} /></label>
          </section>
          <section className="admin-subsection"><h2>Search preview</h2>
            <label>SEO title<input maxLength={180} onChange={(event) => setField('seo_title', event.target.value || null)} value={entry.seo_title ?? ''} /></label>
            <label>SEO description<textarea maxLength={320} onChange={(event) => setField('seo_description', event.target.value || null)} rows={3} value={entry.seo_description ?? ''} /></label>
          </section>
        </aside>
      </div>
      {message ? <p className="admin-feedback" role="status">{message}</p> : null}
      {cleanupPaths.length ? <button className="admin-button" disabled={pending} onClick={() => void cleanPaths(cleanupPaths)} type="button">Retry cleanup ({cleanupPaths.length})</button> : null}
      <div className="admin-form-actions"><button className="admin-button admin-button--primary" disabled={pending || categories.length === 0} type="submit">{pending ? 'Saving…' : isEditing ? 'Save changes' : 'Create entry'}</button><Link className="admin-button" href="/admin/entries">Cancel</Link></div>
    </form>
  );
}

function parseTags(input: string) {
  return [...new Set(input.split(',').map((name) => name.trim()).filter(Boolean))].map((name) => ({ id: '', name, slug: '' }));
}

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100).replace(/-$/g, '');
}
