import { getPublishedEntryBySlug } from '@/lib/data/portfolio';
import { apiError, apiFailure, mediaExpirationMeta, publicCacheHeaders } from '@/lib/http/public-response';
import { publicSlugSchema } from '@/lib/validation/public-queries';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!publicSlugSchema.safeParse(slug).success) return apiError('NOT_FOUND', 'Work not found.', 404, true);

  try {
    const entry = await getPublishedEntryBySlug(slug);
    if (!entry) return apiError('NOT_FOUND', 'Work not found.', 404, true);
    const hasMedia = entry.thumbnail !== null || entry.media.length > 0;

    return Response.json({
      data: {
        id: entry.id,
        title: entry.title,
        slug: entry.slug,
        summary: entry.summary,
        presentation: entry.presentation,
        category: { name: entry.category.name, slug: entry.category.slug },
        thumbnail: entry.thumbnail,
        year: entry.year,
        completed_on: entry.completedOn,
        project_status: entry.projectStatus,
        is_featured: entry.isFeatured,
        published_at: entry.publishedAt,
        body_markdown: entry.bodyMarkdown,
        case_study_sections: entry.caseStudySections.map((section) => ({ heading: section.heading, body_markdown: section.bodyMarkdown })),
        project_url: entry.projectUrl,
        repository_url: entry.repositoryUrl,
        client_label: entry.clientLabel,
        role: entry.role,
        seo_title: entry.seoTitle,
        seo_description: entry.seoDescription,
        tags: entry.tags,
        media: entry.media.map((image) => ({
          url: image.url,
          alt: image.alt,
          caption: image.caption,
          sort_order: image.sort_order,
          media_role: image.media_role,
          page_name: image.page_name,
          device_label: image.device_label,
        })),
      },
      ...(hasMedia ? { meta: mediaExpirationMeta(true) } : {}),
    }, { headers: publicCacheHeaders });
  } catch {
    return apiFailure();
  }
}
