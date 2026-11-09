import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { publicSlugSchema } from '@/lib/validation/public-queries';
import { streamPdfResponse } from '@/lib/media/pdf-response';

export const dynamic = 'force-dynamic';

const pdfObjectPath = /^portfolio\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$/i;

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const path = new URL(request.url).searchParams.get('path') ?? '';
  if (!publicSlugSchema.safeParse(slug).success || !pdfObjectPath.test(path)) return new Response(null, { status: 404 });

  const client = createPublicSupabaseClient();
  if (!client) return new Response(null, { status: 503 });

  const { data: entry, error: entryError } = await client.from('portfolio_entries').select('id,category_id')
    .eq('slug', slug).eq('status', 'published').maybeSingle();
  if (entryError || !entry) return new Response(null, { status: 404 });

  const [category, media] = await Promise.all([
    client.from('portfolio_categories').select('id').eq('id', entry.category_id).eq('is_visible', true).maybeSingle(),
    client.from('portfolio_media').select('object_path').eq('entry_id', entry.id).eq('object_path', path)
      .eq('media_role', 'presentation_board').maybeSingle(),
  ]);
  if (category.error || media.error || !category.data || !media.data) return new Response(null, { status: 404 });

  const { data: signed, error: signError } = await client.storage.from('portfolio-media').createSignedUrl(path, 120);
  if (signError || !signed?.signedUrl) return new Response(null, { status: 404 });

  try {
    return await streamPdfResponse(request, signed.signedUrl, 'public, max-age=900');
  } catch {
    return new Response('The PDF could not be loaded.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
