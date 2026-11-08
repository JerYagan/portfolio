import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ProjectDetail } from '@/components/public/ProjectDetail';
import { getAdminEntryPreview } from '@/lib/data/admin-entry-preview';
import { uuidSchema } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Private project preview',
  robots: { index: false, follow: false, noarchive: true },
};

export default async function EntryPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const previewPath = `/preview/${parsedId.data}`;
  const result = await getAdminEntryPreview(parsedId.data);
  if (result.status === 'unauthenticated') {
    redirect(`/admin/login?next=${encodeURIComponent(previewPath)}`);
  }
  if (result.status === 'not-found') notFound();
  if (result.status === 'error') throw new Error('The private preview could not be loaded.');

  return <ProjectDetail entry={result.entry} preview />;
}
