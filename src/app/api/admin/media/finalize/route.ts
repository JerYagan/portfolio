import { requireAdmin, badOriginResponse, isSameOriginMutation } from '@/lib/auth/authorization';
import { adminError, adminFailure, adminJson } from '@/lib/http/admin-response';
import { readJsonBody } from '@/lib/http/admin-request';
import { signAdminPath } from '@/lib/data/admin-media';
import { adminMediaPathSchema } from '@/lib/validation/admin';
import { validateImageUpload } from '@/lib/media/image-validation';
import { validatePdfUpload } from '@/lib/media/pdf-validation';
import { MAX_PORTFOLIO_MEDIA_BYTES, PORTFOLIO_MEDIA_EXTENSIONS, type PortfolioMediaMimeType } from '@/lib/media/upload-limits';

export const dynamic = 'force-dynamic';

const bucket = 'portfolio-media';
const mimeTypeByExtension: Record<string, PortfolioMediaMimeType | undefined> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  pdf: 'application/pdf',
};

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const parsed = await readJsonBody(request, adminMediaPathSchema);
  if ('response' in parsed) return parsed.response;

  const objectPath = parsed.data.object_path;
  const extension = objectPath.split('.').at(-1)?.toLowerCase() ?? '';
  const contentType = mimeTypeByExtension[extension];
  if (!contentType || PORTFOLIO_MEDIA_EXTENSIONS[contentType] !== extension) {
    return adminError('UNSUPPORTED_MEDIA_TYPE', 'Use a JPEG, PNG, WebP, AVIF, or PDF file.', 415);
  }

  const { data: file, error } = await auth.client.storage.from(bucket).download(objectPath);
  if (error || !file) return adminError('UPLOAD_NOT_FOUND', 'The uploaded media could not be found. Please try again.', 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_PORTFOLIO_MEDIA_BYTES) {
    await auth.client.storage.from(bucket).remove([objectPath]);
    return adminError('PAYLOAD_TOO_LARGE', 'Files must be 15 MiB or smaller.', 413);
  }

  let invalidFile: { code: string; message: string; status: number } | null = null;
  if (contentType === 'application/pdf') {
    const validation = validatePdfUpload(bytes, contentType);
    if (!validation.ok) invalidFile = validation;
  } else {
    const validation = validateImageUpload(bytes, contentType);
    if (!validation.ok) invalidFile = validation;
    else if (validation.extension !== extension) {
      invalidFile = { code: 'INVALID_IMAGE', message: 'The uploaded file could not be validated.', status: 400 };
    }
  }
  if (file.type && file.type !== contentType) {
    invalidFile = { code: 'INVALID_MEDIA_TYPE', message: 'The uploaded file type does not match its file extension.', status: 415 };
  }
  if (invalidFile) {
    await auth.client.storage.from(bucket).remove([objectPath]);
    return adminError(invalidFile.code, invalidFile.message, invalidFile.status);
  }

  const previewUrl = await signAdminPath(auth.client, objectPath);
  if (!previewUrl) {
    await auth.client.storage.from(bucket).remove([objectPath]);
    return adminFailure();
  }
  return adminJson({ object_path: objectPath, preview_url: previewUrl }, 201);
}
