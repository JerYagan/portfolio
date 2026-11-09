import { requireAdmin } from '@/lib/auth/authorization';
import { streamPdfResponse } from '@/lib/media/pdf-response';
import { adminMediaPathSchema } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const path = new URL(request.url).searchParams.get('path') ?? '';
  const parsed = adminMediaPathSchema.safeParse({ object_path: path });
  if (!parsed.success || !path.toLowerCase().endsWith('.pdf')) return new Response(null, { status: 404 });

  const { data: media, error: mediaError } = await auth.client.from('portfolio_media').select('object_path')
    .eq('object_path', path).eq('media_role', 'presentation_board').maybeSingle();
  if (mediaError || !media) return new Response(null, { status: 404 });

  const { data: signed, error: signError } = await auth.client.storage.from('portfolio-media').createSignedUrl(path, 120);
  if (signError || !signed?.signedUrl) return new Response(null, { status: 404 });

  try {
    return await streamPdfResponse(request, signed.signedUrl, 'private, no-store');
  } catch {
    return new Response('The PDF could not be loaded.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
