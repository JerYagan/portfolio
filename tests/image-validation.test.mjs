import assert from 'node:assert/strict';
import test from 'node:test';
import { validateImageUpload } from '../src/lib/media/image-validation.ts';

function pngHeader(width, height) {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  bytes.set([73, 72, 68, 82], 12);
  bytes[16] = (width >>> 24) & 255;
  bytes[17] = (width >>> 16) & 255;
  bytes[18] = (width >>> 8) & 255;
  bytes[19] = width & 255;
  bytes[20] = (height >>> 24) & 255;
  bytes[21] = (height >>> 16) & 255;
  bytes[22] = (height >>> 8) & 255;
  bytes[23] = height & 255;
  return bytes;
}

test('image validation accepts a supported PNG and reads its dimensions', () => {
  assert.deepEqual(validateImageUpload(pngHeader(1200, 800), 'image/png'), {
    ok: true, extension: 'png', width: 1200, height: 800,
  });
});

test('image validation rejects unsupported formats, invalid signatures, and oversized dimensions', () => {
  assert.equal(validateImageUpload(new Uint8Array(24), 'image/svg+xml').status, 415);
  assert.equal(validateImageUpload(new Uint8Array(24), 'image/png').code, 'INVALID_IMAGE');
  assert.equal(validateImageUpload(pngHeader(6001, 100), 'image/png').code, 'IMAGE_DIMENSIONS_EXCEEDED');
});

test('image validation rejects files larger than 15 MiB before decoding', () => {
  assert.equal(validateImageUpload(new Uint8Array((15 * 1024 * 1024) + 1), 'image/png').status, 413);
});
