'use client';

import { useState, type FormEvent } from 'react';

type Category = { id: string; name: string; slug: string; description: string; is_visible: boolean; sort_order: number; entry_count: number };
type Envelope<T> = { data?: T; error?: { message?: string } };

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setPending(true);
    const form = new FormData(event.currentTarget);
    const formElement = event.currentTarget;
    const payload = { name: String(form.get('name')), slug: String(form.get('slug')), description: String(form.get('description') ?? ''), is_visible: true, sort_order: categories.length };
    try {
      const response = await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json() as Envelope<Category>;
      if (!response.ok || !result.data) throw new Error(result.error?.message ?? 'Category could not be created.');
      setCategories((current) => [...current, { ...result.data!, entry_count: 0 }]);
      formElement.reset();
      setMessage('Category created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Category could not be created.');
    } finally { setPending(false); }
  }

  async function update(category: Category, patch: Partial<Category>) {
    setMessage(''); setPending(true);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const result = await response.json() as Envelope<Category>;
      if (!response.ok || !result.data) throw new Error(result.error?.message ?? 'Category could not be updated.');
      setCategories((current) => current.map((item) => item.id === category.id ? { ...item, ...result.data, entry_count: item.entry_count } : item));
      setMessage('Category updated.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Category could not be updated.'); }
    finally { setPending(false); }
  }

  async function remove(category: Category) {
    if (!window.confirm(`Delete “${category.name}”? This cannot be undone.`)) return;
    setMessage(''); setPending(true);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json() as Envelope<never>;
        throw new Error(result.error?.message ?? 'Category could not be deleted.');
      }
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setMessage('Category deleted.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Category could not be deleted.'); }
    finally { setPending(false); }
  }

  return (
    <div className="admin-stack">
      <section className="admin-panel" aria-labelledby="create-category-title">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Add a discipline</p><h2 id="create-category-title">New category</h2></div></div>
        <form className="admin-form admin-form--inline" onSubmit={submit}>
          <label>Name<input name="name" maxLength={60} required /></label>
          <label>URL slug<input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={60} required /></label>
          <label className="admin-form__wide">Description<textarea name="description" maxLength={500} rows={2} /></label>
          <button className="admin-button admin-button--primary" disabled={pending} type="submit">Add category</button>
        </form>
      </section>

      <section className="admin-panel" aria-labelledby="category-list-title">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Organize the archive</p><h2 id="category-list-title">Categories <span className="admin-count">{categories.length}</span></h2></div></div>
        {categories.length ? <div className="admin-category-list">{categories.map((category) => <CategoryRow key={category.id} category={category} pending={pending} onUpdate={update} onDelete={remove} />)}</div> : <p className="admin-empty-inline">No categories yet.</p>}
      </section>
      {message ? <p className="admin-feedback" role="status">{message}</p> : null}
    </div>
  );
}

function CategoryRow({ category, pending, onUpdate, onDelete }: { category: Category; pending: boolean; onUpdate: (category: Category, patch: Partial<Category>) => Promise<void>; onDelete: (category: Category) => Promise<void> }) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(category.description);
  const [sortOrder, setSortOrder] = useState(String(category.sort_order));
  return (
    <form className="admin-category-row" onSubmit={(event) => { event.preventDefault(); void onUpdate(category, { name, slug, description, sort_order: Number(sortOrder) }); }}>
      <label>Name<input aria-label={`Name for ${category.name}`} maxLength={60} onChange={(event) => setName(event.target.value)} required value={name} /></label>
      <label>Slug<input aria-label={`Slug for ${category.name}`} maxLength={60} onChange={(event) => setSlug(event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required value={slug} /></label>
      <label>Description<input aria-label={`Description for ${category.name}`} maxLength={500} onChange={(event) => setDescription(event.target.value)} value={description} /></label>
      <label className="admin-order-field">Order<input aria-label={`Sort order for ${category.name}`} max={100000} min={-100000} onChange={(event) => setSortOrder(event.target.value)} type="number" value={sortOrder} /></label>
      <label className="admin-switch"><input checked={category.is_visible} disabled={pending} onChange={(event) => void onUpdate(category, { is_visible: event.target.checked })} type="checkbox" /><span>Visible</span></label>
      <span className="admin-category-count">{category.entry_count} {category.entry_count === 1 ? 'entry' : 'entries'}</span>
      <div className="admin-row-actions"><button className="admin-button" disabled={pending} type="submit">Save</button><button className="admin-button admin-button--danger" disabled={pending || category.entry_count > 0} onClick={() => void onDelete(category)} title={category.entry_count ? 'Move or delete its entries first' : undefined} type="button">Delete</button></div>
    </form>
  );
}
