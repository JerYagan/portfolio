import { requireAdmin, badOriginResponse, isSameOriginMutation } from '@/lib/auth/authorization';
import { adminError, adminJson } from '@/lib/http/admin-response';
import { readJsonBody } from '@/lib/http/admin-request';
import { signAdminPath } from '@/lib/data/admin-media';
import { adminMediaPathSchema } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  if (!isSameOriginMutation(request)) return badOriginResponse();
  const parsed = await readJsonBody(request, adminMediaPathSchema);
  if ('response' in parsed) return parsed.response;
  const url = await signAdminPath(auth.client, parsed.data.object_path);
  if (!url) return adminError('NOT_FOUND', 'Image not found.', 404);
  return adminJson({ url });
}
