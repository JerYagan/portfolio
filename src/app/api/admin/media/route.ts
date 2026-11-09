import { randomUUID } from 'node:crypto';
import { requireAdmin, badOriginResponse, isSameOriginMutation } from '@/lib/auth/authorization';
import { adminError, adminFailure, adminJson } from '@/lib/http/admin-response';
import { readJsonBody } from '@/lib/http/admin-request';
import { adminMediaPathSchema, adminMediaUploadTicketSchema } from '@/lib/validation/admin';
import { MAX_PORTFOLIO_MEDIA_BYTES, PORTFOLIO_MEDIA_EXTENSIONS, type PortfolioMediaMimeType } from '@/lib/media/upload-limits';

export const dynamic = 'force-dynamic';

const bucket = 'portfolio-media';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();

  const parsed = await readJsonBody(request, adminMediaUploadTicketSchema);
  if ('response' in parsed) return parsed.response;
  if (parsed.data.file_size > MAX_PORTFOLIO_MEDIA_BYTES) {
    return adminError('PAYLOAD_TOO_LARGE', 'Files must be 15 MiB or smaller.', 413);
  }
  const extension = PORTFOLIO_MEDIA_EXTENSIONS[parsed.data.content_type as PortfolioMediaMimeType];
  if (!extension) {
    return adminError('UNSUPPORTED_MEDIA_TYPE', 'Use a JPEG, PNG, WebP, AVIF, or PDF file.', 415);
  }
  if (extension === 'pdf' && parsed.data.media_role !== 'presentation_board') {
    return adminError('UNSUPPORTED_MEDIA_TYPE', 'PDF files can only be used as presentation boards.', 415);
  }

  const objectPath = `portfolio/${randomUUID()}.${extension}`;
  const { data, error } = await auth.client.storage.from(bucket).createSignedUploadUrl(objectPath, { upsert: false });
  if (error || !data) return adminFailure();

  return adminJson({ object_path: objectPath, token: data.token }, 201);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const parsed = await readJsonBody(request, adminMediaPathSchema);
  if ('response' in parsed) return parsed.response;
  const objectPath = parsed.data.object_path;

  const [profile, entries, media] = await Promise.all([
    auth.client.from('profile').select('avatar_path').eq('avatar_path', objectPath),
    auth.client.from('portfolio_entries').select('thumbnail_path').eq('thumbnail_path', objectPath),
    auth.client.from('portfolio_media').select('object_path').eq('object_path', objectPath),
  ]);
  if (profile.error || entries.error || media.error) return adminFailure();
  if (profile.data.length || entries.data.length || media.data.length) {
    return adminError('MEDIA_IN_USE', 'Remove this media file from the profile or a project before deleting it.', 409);
  }

  const { error } = await auth.client.storage.from(bucket).remove([objectPath]);
  if (error && String(error.statusCode ?? '') !== '404') {
    return adminError('STORAGE_DELETE_FAILED', 'The media file could not be removed. Retry the cleanup.', 500);
  }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
