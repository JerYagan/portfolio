'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { MAX_PORTFOLIO_MEDIA_BYTES, PORTFOLIO_MEDIA_MIME_TYPES } from '@/lib/media/upload-limits';

type Envelope<T> = { data?: T; error?: { message?: string } };
type UploadTicket = { object_path: string; token: string };
type UploadedImage = { object_path: string; preview_url: string };
type UploadPurpose = 'avatar' | 'thumbnail' | 'presentation_board' | 'logo_variation' | 'supporting_image' | 'page_screenshot';

const bucket = 'portfolio-media';
let uploadClient: SupabaseClient | null = null;

function getUploadClient() {
  if (uploadClient) return uploadClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error('Portfolio media storage is not configured.');

  uploadClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: {
      fetch: (input, init) => {
        const timeout = AbortSignal.timeout(5 * 60 * 1000);
        const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
        return fetch(input, { ...init, signal });
      },
    },
  });
  return uploadClient;
}

async function readEnvelope<T>(response: Response) {
  try {
    return await response.json() as Envelope<T>;
  } catch {
    throw new Error('The media upload response could not be read.');
  }
}

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(url, { ...init, signal });
}

async function discardUpload(objectPath: string) {
  await fetchWithTimeout('/api/admin/media', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ object_path: objectPath }),
  }, 15_000).catch(() => undefined);
}

export async function uploadPortfolioImage(file: File, mediaRole: UploadPurpose): Promise<UploadedImage> {
  const contentType = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    ? 'application/pdf'
    : file.type;
  if (file.size < 1 || file.size > MAX_PORTFOLIO_MEDIA_BYTES) {
    throw new Error('Files must be larger than 0 bytes and 15 MiB or smaller.');
  }
  if (!PORTFOLIO_MEDIA_MIME_TYPES.includes(contentType as typeof PORTFOLIO_MEDIA_MIME_TYPES[number])) {
    throw new Error('Use a JPEG, PNG, WebP, AVIF, or PDF file.');
  }
  if (contentType === 'application/pdf' && mediaRole !== 'presentation_board') {
    throw new Error('PDF files can only be used as presentation boards.');
  }

  const ticketResponse = await fetchWithTimeout('/api/admin/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_size: file.size, content_type: contentType, media_role: mediaRole }),
  }, 30_000);
  const ticketResult = await readEnvelope<UploadTicket>(ticketResponse);
  if (!ticketResponse.ok || !ticketResult.data) {
    throw new Error(ticketResult.error?.message ?? 'An upload could not be started.');
  }

  const { object_path: objectPath, token } = ticketResult.data;
  try {
    const { error } = await getUploadClient().storage.from(bucket).uploadToSignedUrl(objectPath, token, file, {
      contentType,
      cacheControl: '3600',
    });
    if (error) {
      const details = error.message.toLocaleLowerCase();
      if (/size|limit|413|maximum|exceed/.test(details)) {
        throw new Error('Supabase Storage rejected this file size. Apply the 15 MiB bucket migration and raise the project-wide Storage limit to at least 15 MiB.');
      }
      throw new Error(`The file could not be transferred to storage: ${error.message}`);
    }

    const finalizeResponse = await fetchWithTimeout('/api/admin/media/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ object_path: objectPath }),
    }, 120_000);
    const result = await readEnvelope<UploadedImage>(finalizeResponse);
    if (!finalizeResponse.ok || !result.data) {
      throw new Error(result.error?.message ?? 'The uploaded file could not be verified.');
    }
    return result.data;
  } catch (error) {
    await discardUpload(objectPath);
    throw error;
  }
}
