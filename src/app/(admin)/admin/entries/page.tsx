import type { Metadata } from 'next';
import { EntryManager } from '@/components/admin/EntryManager';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Entries' };

export default async function AdminEntriesPage() {
  const client = await createSupabaseServerClient();
  const { data, error, count } = await client.from('portfolio_entries')
    .select('id,title,slug,summary,status,updated_at,portfolio_categories(name,slug)', { count: 'exact' })
    .order('updated_at', { ascending: false }).range(0, 19);
  const initialEntries = (data ?? []).map((entry) => ({ ...entry, portfolio_categories: Array.isArray(entry.portfolio_categories) ? entry.portfolio_categories[0] ?? null : entry.portfolio_categories }));
  return <main className="admin-page" id="main-content"><header className="admin-page-heading"><div><p className="admin-eyebrow">Manage the archive</p><h1>Entries</h1><p className="admin-page-intro">Create and maintain work across every portfolio category.</p></div></header>{error ? <p className="admin-alert" role="alert">Entries could not be loaded. Check the database connection and try again.</p> : <EntryManager initialEntries={initialEntries} initialTotal={count ?? 0} initialTotalPages={Math.ceil((count ?? 0) / 20)} />}</main>;
}
