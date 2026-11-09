import { MAX_PORTFOLIO_MEDIA_BYTES } from '@/lib/media/upload-limits';

export type PdfValidationResult =
  | { ok: true }
  | { ok: false; status: 400 | 413 | 415; code: string; message: string };

export function validatePdfUpload(bytes: Uint8Array, mimeType: string): PdfValidationResult {
  if (mimeType !== 'application/pdf') {
    return { ok: false, status: 415, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Use a PDF file for a presentation board.' };
  }
  if (bytes.length > MAX_PORTFOLIO_MEDIA_BYTES) {
    return { ok: false, status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Files must be 15 MiB or smaller.' };
  }
  const headerLength = Math.min(bytes.length - 4, 1024);
  let hasPdfHeader = false;
  for (let offset = 0; offset < headerLength; offset += 1) {
    if (bytes[offset] === 0x25 && bytes[offset + 1] === 0x50 && bytes[offset + 2] === 0x44 && bytes[offset + 3] === 0x46 && bytes[offset + 4] === 0x2d) {
      hasPdfHeader = true;
      break;
    }
  }
  const tailStart = Math.max(0, bytes.length - 1024);
  let hasPdfEndMarker = false;
  for (let offset = tailStart; offset + 4 < bytes.length; offset += 1) {
    if (bytes[offset] === 0x25 && bytes[offset + 1] === 0x25 && bytes[offset + 2] === 0x45 && bytes[offset + 3] === 0x4f && bytes[offset + 4] === 0x46) {
      hasPdfEndMarker = true;
      break;
    }
  }
  if (!hasPdfHeader || !hasPdfEndMarker) {
    return { ok: false, status: 400, code: 'INVALID_PDF', message: 'The PDF file could not be validated.' };
  }
  return { ok: true };
}
