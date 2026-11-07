import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const client = await createSupabaseServerClient();
  const [allEntries, drafts, published, categories, recent] = await Promise.all([
    client.from('portfolio_entries').select('id', { count: 'exact', head: true }),
    client.from('portfolio_entries').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    client.from('portfolio_entries').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    client.from('portfolio_categories').select('id', { count: 'exact', head: true }),
    client.from('portfolio_entries').select('id,title,slug,status,updated_at').order('updated_at', { ascending: false }).limit(5),
  ]);
  const hasError = [allEntries.error, drafts.error, published.error, categories.error, recent.error].some(Boolean);

  return (
    <main className="admin-page" id="main-content">
      <header className="admin-page-heading">
        <div><p className="admin-eyebrow">Portfolio workspace</p><h1>Overview</h1></div>
        <Link className="admin-button admin-button--primary" href="/admin/entries/new">New entry</Link>
      </header>
      {hasError ? <p className="admin-alert" role="alert">Some workspace information could not be loaded.</p> : null}
      <section aria-label="Portfolio counts" className="admin-stats">
        <article><span>All entries</span><strong>{allEntries.count ?? '—'}</strong></article>
        <article><span>Drafts</span><strong>{drafts.count ?? '—'}</strong></article>
        <article><span>Published</span><strong>{published.count ?? '—'}</strong></article>
        <article><span>Categories</span><strong>{categories.count ?? '—'}</strong></article>
      </section>
      <section aria-labelledby="recent-title" className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">Recently changed</p><h2 id="recent-title">Recent entries</h2></div><Link href="/admin/entries">All entries ↗</Link></div>
        {recent.data && recent.data.length > 0 ? (
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Title</th><th>Status</th><th>Updated</th><th><span className="visually-hidden">Edit</span></th></tr></thead>
            <tbody>{recent.data.map((entry) => <tr key={entry.id}><td>{entry.title}</td><td><span className={`status-pill status-pill--${entry.status}`}>{entry.status}</span></td><td>{new Date(entry.updated_at).toLocaleDateString()}</td><td><Link href={`/admin/entries/${entry.id}`}>Edit</Link></td></tr>)}</tbody>
          </table></div>
        ) : <p className="admin-empty-inline">No entries yet. Start with a draft to build your archive.</p>}
      </section>
    </main>
  );
}
