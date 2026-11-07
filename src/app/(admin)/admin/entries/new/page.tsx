import type { Metadata } from 'next';
import { EntryEditor } from '@/components/admin/EntryEditor';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'New entry' };

export default async function NewEntryPage() {
  const client = await createSupabaseServerClient();
  const { data } = await client.from('portfolio_categories').select('id,name').order('sort_order').order('name');
  return <main className="admin-page admin-page--wide" id="main-content"><header className="admin-page-heading"><div><p className="admin-eyebrow">The archive</p><h1>New entry</h1></div></header>{data?.length ? <EntryEditor categories={data} initialEntry={null} /> : <section className="admin-panel"><h2>Add a category first</h2><p>Entries need a category. Create one before adding portfolio work.</p><a className="admin-button admin-button--primary" href="/admin/categories">Manage categories</a></section>}</main>;
}
