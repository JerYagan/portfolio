import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectDetail } from '@/components/public/ProjectDetail';
import { getPublishedEntryBySlug } from '@/lib/data/portfolio';
import { publicSlugSchema } from '@/lib/validation/public-queries';

export const dynamic = 'force-dynamic';

type RouteParams = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { slug } = await params;
  if (!publicSlugSchema.safeParse(slug).success) return { title: 'Work' };
  const entry = await getPublishedEntryBySlug(slug);
  if (!entry) return { title: 'Work' };
  return {
    title: entry.seoTitle || entry.title,
    description: entry.seoDescription || entry.summary,
    openGraph: entry.thumbnail ? { images: [{ url: entry.thumbnail.url, alt: entry.thumbnail.alt }] } : undefined,
  };
}

export default async function WorkDetailPage({ params }: { params: RouteParams }) {
  const { slug } = await params;
  if (!publicSlugSchema.safeParse(slug).success) notFound();
  const entry = await getPublishedEntryBySlug(slug);
  if (!entry) notFound();
  return <ProjectDetail entry={entry} />;
}
