import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adminEntryListQuerySchema,
  createCategorySchema,
  createEntrySchema,
  updateProfileSchema,
} from '../src/lib/validation/admin.ts';

test('category schemas accept valid data and reject non-url-safe slugs and unknown fields', () => {
  assert.equal(createCategorySchema.safeParse({ name: 'QA Automation', slug: 'qa-automation' }).success, true);
  assert.equal(createCategorySchema.safeParse({ name: 'QA', slug: 'QA' }).success, false);
  assert.equal(createCategorySchema.safeParse({ name: 'QA', slug: 'qa', is_admin: true }).success, false);
});

test('entry schema requires descriptive alt text and safe project URLs', () => {
  const base = {
    title: 'Portfolio site',
    slug: 'portfolio-site',
    summary: 'A responsive portfolio.',
    category_id: '6a8e9db4-6b6d-4a4b-9b4f-bd94d8a5b83a',
  };
  assert.equal(createEntrySchema.safeParse(base).success, true);
  assert.equal(createEntrySchema.safeParse({ ...base, project_url: 'javascript:alert(1)' }).success, false);
  assert.equal(createEntrySchema.safeParse({ ...base, thumbnail_path: 'portfolio/6a8e9db4-6b6d-4a4b-9b4f-bd94d8a5b83a.png' }).success, false);
  assert.equal(createEntrySchema.safeParse({ ...base, tag_names: ['Next.js'], tag_ids: ['6a8e9db4-6b6d-4a4b-9b4f-bd94d8a5b83a'] }).success, false);
});

test('profile links require HTTPS and entry list filters apply documented defaults', () => {
  assert.equal(updateProfileSchema.safeParse({ social_links: [{ label: 'Portfolio', url: 'https://example.test' }] }).success, true);
  assert.equal(updateProfileSchema.safeParse({ social_links: [{ label: 'Portfolio', url: 'http://example.test' }] }).success, false);
  assert.deepEqual(adminEntryListQuerySchema.parse({}), { status: 'all', page: 1, limit: 20 });
  assert.equal(adminEntryListQuerySchema.safeParse({ status: 'private' }).success, false);
});
