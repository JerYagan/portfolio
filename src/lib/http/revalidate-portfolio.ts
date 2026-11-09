import { revalidatePath } from 'next/cache';

export function revalidatePortfolio(options: { entrySlug?: string; categorySlug?: string; featured?: boolean } = {}) {
  revalidatePath('/', 'page');
  revalidatePath('/work', 'page');
  revalidatePath('/work/category/[slug]', 'page');
  revalidatePath('/sitemap.xml');
  revalidatePath('/api/portfolio/profile');
  revalidatePath('/api/portfolio/categories');
  revalidatePath('/api/portfolio/entries');
  if (options.categorySlug) revalidatePath(`/work/category/${options.categorySlug}`, 'page');
  if (options.entrySlug) {
    revalidatePath(`/work/${options.entrySlug}`, 'page');
    revalidatePath(`/api/portfolio/entries/${options.entrySlug}`);
  }
  if (options.featured) revalidatePath('/', 'page');
}
