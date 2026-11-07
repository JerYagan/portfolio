import type { Metadata } from 'next';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Categories' };

export default async function AdminCategoriesPage() {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.from('portfolio_categories').select('id,name,slug,description,is_visible,sort_order').order('sort_order').order('name');
  let categories: Array<{ id: string; name: string; slug: string; description: string; is_visible: boolean; sort_order: number; entry_count: number }> = [];
  if (!error && data) {
    const counted = await Promise.all(data.map(async (category) => {
      const result = await client.from('portfolio_entries').select('id', { count: 'exact', head: true }).eq('category_id', category.id);
      return { ...category, entry_count: result.count ?? 0 };
    }));
    categories = counted;
  }
  return <main className="admin-page" id="main-content"><header className="admin-page-heading"><div><p className="admin-eyebrow">Structure</p><h1>Categories</h1><p className="admin-page-intro">Add a category whenever you want to show a new kind of work.</p></div></header>{error ? <p className="admin-alert" role="alert">Categories could not be loaded. Check the database connection and try again.</p> : <CategoryManager initialCategories={categories} />}</main>;
}
