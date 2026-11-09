import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { getPublicCategories, getPublishedSitemapEntries } from '@/lib/data/portfolio';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, entries] = await Promise.all([getPublicCategories(), getPublishedSitemapEntries()]);
  const staticRoutes = ['', '/work'].map((path) => ({
    url: new URL(path, env.siteUrl).toString(),
  }));
  const categoryRoutes = categories.map((category) => ({
    url: new URL(`/work/category/${category.slug}`, env.siteUrl).toString(),
  }));
  const entryRoutes = entries.map((entry) => ({
    url: new URL(`/work/${entry.slug}`, env.siteUrl).toString(),
    lastModified: entry.updatedAt,
  }));
  return [...staticRoutes, ...categoryRoutes, ...entryRoutes];
}
