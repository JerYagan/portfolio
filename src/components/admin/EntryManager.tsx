'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

type Entry = { id: string; title: string; slug: string; summary: string; status: 'draft' | 'published'; updated_at: string; portfolio_categories?: { name: string; slug: string } | null };
type Envelope<T> = { data?: T; error?: { message?: string }; meta?: { cleanup_pending?: string[]; page?: number; total?: number; total_pages?: number } };

export function EntryManager({ initialEntries, initialTotal, initialTotalPages }: { initialEntries: Entry[]; initialTotal: number; initialTotalPages: number }) {
  const [entries, setEntries] = useState(initialEntries);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [message, setMessage] = useState('');
  const [cleanupPaths, setCleanupPaths] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  async function loadEntries(nextPage: number) {
    setPending(true); setMessage('');
    const params = new URLSearchParams({ status, q: search, page: String(nextPage), limit: '20' });
    try {
      const response = await fetch(`/api/admin/entries?${params}`, { cache: 'no-store' });
      const result = await response.json() as Envelope<Entry[]>;
      if (!response.ok || !result.data) throw new Error(result.error?.message ?? 'Entries could not be loaded.');
      setEntries(result.data); setTotal(result.meta?.total ?? result.data.length); setTotalPages(result.meta?.total_pages ?? 1); setPage(nextPage);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Entries could not be loaded.'); }
    finally { setPending(false); }
  }

  async function searchEntries(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadEntries(1);
  }

  async function remove(entry: Entry) {
    if (!window.confirm(`Delete “${entry.title}” and its portfolio record? This cannot be undone.`)) return;
    setPending(true); setMessage('');
    try {
      const response = await fetch(`/api/admin/entries/${entry.id}`, { method: 'DELETE' });
      const result = response.status === 204 ? null : await response.json() as Envelope<{ deleted: boolean }>;
      if (!response.ok) throw new Error(result?.error?.message ?? 'Entry could not be deleted.');
      const pendingPaths = result?.meta?.cleanup_pending ?? [];
      const stillPending: string[] = [];
      for (const object_path of pendingPaths) {
        const cleanup = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ object_path }) });
        if (!cleanup.ok) stillPending.push(object_path);
      }
      setCleanupPaths(stillPending);
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.ceil(nextTotal / 20);
      setTotal(nextTotal); setTotalPages(nextTotalPages);
      if (entries.length === 1 && page > 1) await loadEntries(page - 1);
      setMessage(stillPending.length ? `Entry deleted. Image cleanup needs another try (${stillPending.length} image${stillPending.length === 1 ? '' : 's'}).` : 'Entry deleted.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Entry could not be deleted.'); }
    finally { setPending(false); }
  }

  async function retryCleanup() {
    setPending(true);
    const remaining: string[] = [];
    for (const object_path of cleanupPaths) {
      const response = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ object_path }) }).catch(() => null);
      if (!response?.ok) remaining.push(object_path);
    }
    setCleanupPaths(remaining);
    setMessage(remaining.length ? `Cleanup still pending for ${remaining.length} image${remaining.length === 1 ? '' : 's'}.` : 'Image cleanup finished.');
    setPending(false);
  }

  return (
    <section className="admin-panel" aria-labelledby="entry-list-title">
      <div className="admin-panel-heading"><div><p className="admin-eyebrow">The archive</p><h2 id="entry-list-title">Entries <span className="admin-count">{total}</span></h2></div><Link className="admin-button admin-button--primary" href="/admin/entries/new">New entry</Link></div>
      <form className="admin-filter-form" onSubmit={searchEntries}>
        <label>Status<select onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="all">All</option><option value="draft">Drafts</option><option value="published">Published</option></select></label>
        <label className="admin-filter-search">Search<input maxLength={100} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Title or summary" value={search} /></label>
        <button className="admin-button" disabled={pending} type="submit">Filter</button>
      </form>
      {entries.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Updated</th><th><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td><Link href={`/admin/entries/${entry.id}`}>{entry.title}</Link><small>{entry.slug}</small></td><td>{entry.portfolio_categories?.name ?? '—'}</td><td><span className={`status-pill status-pill--${entry.status}`}>{entry.status}</span></td><td>{new Date(entry.updated_at).toLocaleDateString()}</td><td><button className="admin-text-button admin-text-button--danger" disabled={pending} onClick={() => void remove(entry)} type="button">Delete</button></td></tr>)}</tbody></table></div> : <p className="admin-empty-inline">No entries match these filters.</p>}
      {totalPages > 1 ? <nav aria-label="Entry pages" className="admin-pagination"><button className="admin-button" disabled={pending || page <= 1} onClick={() => void loadEntries(page - 1)} type="button">← Previous</button><span>Page {page} of {totalPages}</span><button className="admin-button" disabled={pending || page >= totalPages} onClick={() => void loadEntries(page + 1)} type="button">Next →</button></nav> : null}
      {message ? <p className="admin-feedback" role="status">{message}</p> : null}
      {cleanupPaths.length ? <button className="admin-button" disabled={pending} onClick={() => void retryCleanup()} type="button">Retry image cleanup ({cleanupPaths.length})</button> : null}
    </section>
  );
}
