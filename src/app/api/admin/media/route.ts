import { randomUUID } from 'node:crypto';
import { requireAdmin, badOriginResponse, isSameOriginMutation } from '@/lib/auth/authorization';
import { adminError, adminFailure, adminJson } from '@/lib/http/admin-response';
import { readFormBody, readJsonBody } from '@/lib/http/admin-request';
import { findReferencedPaths, removeStoragePaths, signAdminPath } from '@/lib/data/admin-media';
import { adminMediaPathSchema } from '@/lib/validation/admin';
import { validateImageUpload } from '@/lib/media/image-validation';

export const dynamic = 'force-dynamic';

const bucket = 'portfolio-media';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > 9 * 1024 * 1024) {
    return adminError('PAYLOAD_TOO_LARGE', 'Images must be 8 MiB or smaller.', 413);
  }

  const parsedForm = await readFormBody(request, 9 * 1024 * 1024);
  if ('response' in parsedForm) return parsedForm.response;
  const file = parsedForm.data;
  if (file.size > 8 * 1024 * 1024) return adminError('PAYLOAD_TOO_LARGE', 'Images must be 8 MiB or smaller.', 413);
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) return adminError('UNSUPPORTED_MEDIA_TYPE', 'Use a JPEG, PNG, WebP, or AVIF image.', 415);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateImageUpload(bytes, file.type);
  if (!validation.ok) return adminError(validation.code, validation.message, validation.status);

  const objectPath = `portfolio/${randomUUID()}.${validation.extension}`;
  const { error } = await auth.client.storage.from(bucket).upload(objectPath, bytes, {
    contentType: file.type,
    upsert: false,
    cacheControl: '3600',
  });
  if (error) return adminFailure();

  const previewUrl = await signAdminPath(auth.client, objectPath);
  return adminJson({ object_path: objectPath, preview_url: previewUrl }, 201);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const parsed = await readJsonBody(request, adminMediaPathSchema);
  if ('response' in parsed) return parsed.response;
  const objectPath = parsed.data.object_path;

  const references = await findReferencedPaths(auth.client, [objectPath]);
  if (!references) return adminFailure();
  if (references.has(objectPath)) {
    return adminError('MEDIA_IN_USE', 'Remove this image from the profile or a project before deleting it.', 409);
  }

  const cleanup = await removeStoragePaths(auth.client, [objectPath]);
  if (cleanup.length > 0) return adminError('STORAGE_DELETE_FAILED', 'The image could not be removed. Retry the cleanup.', 500);
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
