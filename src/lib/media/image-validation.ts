import { MAX_PORTFOLIO_MEDIA_BYTES, PORTFOLIO_IMAGE_MIME_TYPES } from '@/lib/media/upload-limits';

const mimeTypes = new Set<string>(PORTFOLIO_IMAGE_MIME_TYPES);

export type ImageValidationResult =
  | { ok: true; extension: 'jpg' | 'png' | 'webp' | 'avif'; width: number; height: number }
  | { ok: false; status: 400 | 413 | 415; code: string; message: string };

function ascii(bytes: Uint8Array, offset: number, value: string): boolean {
  if (offset + value.length > bytes.length) return false;
  return [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0));
}

function read16be(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function read32be(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function dimensionsPng(bytes: Uint8Array): [number, number] | null {
  if (bytes.length < 24 || !ascii(bytes, 12, 'IHDR')) return null;
  return [read32be(bytes, 16), read32be(bytes, 20)];
}

function dimensionsJpeg(bytes: Uint8Array): [number, number] | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;

  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) return null;
    const segmentLength = read16be(bytes, offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    if (frameMarkers.has(marker)) {
      if (segmentLength < 7) return null;
      return [read16be(bytes, offset + 5), read16be(bytes, offset + 3)];
    }
    offset += segmentLength;
  }

  return null;
}

function dimensionsWebp(bytes: Uint8Array): [number, number] | null {
  if (bytes.length < 30 || !ascii(bytes, 0, 'RIFF') || !ascii(bytes, 8, 'WEBP')) return null;
  if (ascii(bytes, 12, 'VP8X')) {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return [width, height];
  }
  if (ascii(bytes, 12, 'VP8L') && bytes[20] === 0x2f) {
    const width = 1 + ((bytes[22] & 0x3f) << 8) + bytes[21];
    const height = 1 + ((bytes[24] & 0x0f) << 10) + (bytes[23] << 2) + ((bytes[22] & 0xc0) >> 6);
    return [width, height];
  }
  if (ascii(bytes, 12, 'VP8 ') && bytes.length >= 30 && ascii(bytes, 23, String.fromCharCode(0x9d, 0x01, 0x2a))) {
    const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
    const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
    return [width, height];
  }
  return null;
}

function dimensionsAvif(bytes: Uint8Array): [number, number] | null {
  if (bytes.length < 32 || !ascii(bytes, 4, 'ftyp')) return null;
  const header = String.fromCharCode(...bytes.subarray(8, Math.min(bytes.length, 64)));
  if (!header.includes('avif') && !header.includes('avis')) return null;
  for (let offset = 4; offset + 16 < bytes.length; offset += 1) {
    if (ascii(bytes, offset, 'ispe')) return [read32be(bytes, offset + 8), read32be(bytes, offset + 12)];
  }
  return null;
}

function imageDimensions(bytes: Uint8Array, mimeType: string): [number, number] | null {
  if (mimeType === 'image/jpeg') return dimensionsJpeg(bytes);
  if (mimeType === 'image/png') return bytes.length >= 8 && ascii(bytes, 0, String.fromCharCode(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) ? dimensionsPng(bytes) : null;
  if (mimeType === 'image/webp') return dimensionsWebp(bytes);
  if (mimeType === 'image/avif') return dimensionsAvif(bytes);
  return null;
}

export function validateImageUpload(bytes: Uint8Array, mimeType: string): ImageValidationResult {
  if (!mimeTypes.has(mimeType)) {
    return { ok: false, status: 415, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Use a JPEG, PNG, WebP, or AVIF image.' };
  }
  if (bytes.length > MAX_PORTFOLIO_MEDIA_BYTES) {
    return { ok: false, status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Images must be 15 MiB or smaller.' };
  }

  const dimensions = imageDimensions(bytes, mimeType);
  if (!dimensions) {
    return { ok: false, status: 400, code: 'INVALID_IMAGE', message: 'The image file could not be validated.' };
  }
  const [width, height] = dimensions;
  if (width < 1 || height < 1 || width > 6000 || height > 6000) {
    return { ok: false, status: 400, code: 'IMAGE_DIMENSIONS_EXCEEDED', message: 'Image dimensions must not exceed 6000 by 6000 pixels.' };
  }

  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.slice('image/'.length) as 'png' | 'webp' | 'avif';
  return { ok: true, extension, width, height };
}
