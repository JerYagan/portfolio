import { z } from 'zod';
import { adminError } from '@/lib/http/admin-response';

const maximumJsonBytes = 1024 * 1024;

async function readBodyWithin(request: Request, maximumBytes: number): Promise<{ bytes: Uint8Array } | { tooLarge: true } | { failed: true }> {
  const reader = request.body?.getReader();
  if (!reader) return { bytes: new Uint8Array() };
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel().catch(() => undefined);
        return { tooLarge: true };
      }
      chunks.push(value);
    }
  } catch {
    return { failed: true };
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return { bytes };
}

export async function readJsonBody<T>(request: Request, schema: z.ZodType<T>) {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maximumJsonBytes) {
    return { response: adminError('PAYLOAD_TOO_LARGE', 'The request is too large.', 413) } as const;
  }

  const bodyResult = await readBodyWithin(request, maximumJsonBytes);
  if ('tooLarge' in bodyResult) return { response: adminError('PAYLOAD_TOO_LARGE', 'The request is too large.', 413) } as const;
  if ('failed' in bodyResult) return { response: adminError('VALIDATION_ERROR', 'Send a valid JSON request body.', 400) } as const;

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(bodyResult.bytes)) as unknown;
  } catch {
    return { response: adminError('VALIDATION_ERROR', 'Send a valid JSON request body.', 400) } as const;
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && !fields[field]) fields[field] = issue.message;
    }
    return { response: adminError('VALIDATION_ERROR', 'Check the submitted fields.', 400, fields) } as const;
  }

  return { data: parsed.data } as const;
}
