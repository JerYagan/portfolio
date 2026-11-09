import { z } from 'zod';
import { TECHNOLOGY_OPTIONS } from '@/lib/tech-stack';

const slug = (maximum: number) => z.string().trim().min(1).max(maximum).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const safeHttpsUrl = z.string().trim().url().refine((value) => {
  const parsed = new URL(value);
  return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
});
const safeContactUrl = z.string().trim().max(500).refine((value) => {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'https:' && !parsed.username && !parsed.password) || (parsed.protocol === 'mailto:' && Boolean(parsed.pathname));
  } catch {
    return false;
  }
});
const rasterObjectPath = z.string().regex(/^portfolio\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i);
const objectPath = z.string().regex(/^portfolio\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp|avif|pdf)$/i);
const catalogTechnologyId = z.enum(TECHNOLOGY_OPTIONS.map((technology) => technology.id) as [string, ...string[]]);
const completionDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysInMonth[month - 1];
}, 'Use a valid calendar date between 1900 and 2100.').nullable();

export const uuidSchema = z.string().uuid();

const categoryFields = {
  name: z.string().trim().min(1).max(60),
  slug: slug(60),
  description: z.string().max(500),
  is_visible: z.boolean(),
  sort_order: z.number().int().min(-100000).max(100000),
};

export const createCategorySchema = z.object({
  name: categoryFields.name,
  slug: categoryFields.slug,
  description: categoryFields.description.optional(),
  is_visible: categoryFields.is_visible.optional(),
  sort_order: categoryFields.sort_order.optional(),
}).strict();

export const updateCategorySchema = z.object(categoryFields).partial().strict().refine((value) => Object.keys(value).length > 0);

const galleryItemSchema = z.object({
  object_path: objectPath,
  alt_text: z.string().trim().min(1).max(300),
  caption: z.string().max(300).nullable().optional(),
  media_role: z.enum(['presentation_board', 'logo_variation', 'supporting_image', 'page_screenshot']).default('supporting_image'),
  page_name: z.string().trim().min(1).max(80).nullable().optional(),
  device_label: z.enum(['desktop', 'tablet', 'mobile']).nullable().optional(),
  sort_order: z.number().int().min(-100000).max(100000),
}).strict().superRefine((value, context) => {
  if (value.object_path.toLowerCase().endsWith('.pdf') && value.media_role !== 'presentation_board') {
    context.addIssue({ code: 'custom', path: ['media_role'], message: 'PDF files can only be used as presentation boards.' });
  }
  if (value.media_role === 'page_screenshot') {
    if (!value.page_name?.trim()) context.addIssue({ code: 'custom', path: ['page_name'], message: 'Enter the page name for this screenshot.' });
    if (!value.device_label) context.addIssue({ code: 'custom', path: ['device_label'], message: 'Choose the device size for this screenshot.' });
  } else if (value.page_name || value.device_label) {
    context.addIssue({ code: 'custom', path: ['media_role'], message: 'Page and device labels are only used for website screenshots.' });
  }
});

const tagNamesSchema = z.array(z.string().trim().min(1).max(40)).max(20).refine(
  (values) => new Set(values.map((value) => value.toLocaleLowerCase())).size === values.length,
  'Tag names must be unique.',
);

const tagIdsSchema = z.array(uuidSchema).max(20).refine((values) => new Set(values).size === values.length);
const caseStudySectionsSchema = z.array(z.object({
  heading: z.string().trim().min(1).max(80),
  body_markdown: z.string().max(8000),
}).strict()).max(12);

const entryFields = {
  title: z.string().trim().min(1).max(120),
  slug: slug(100),
  summary: z.string().trim().min(1).max(240),
  presentation: z.enum(['standard', 'logofolio']),
  body_markdown: z.string().max(30000),
  case_study_sections: caseStudySectionsSchema,
  category_id: uuidSchema,
  thumbnail_path: rasterObjectPath.nullable(),
  thumbnail_alt: z.string().trim().min(1).max(300).nullable(),
  project_url: safeHttpsUrl.nullable(),
  repository_url: safeHttpsUrl.nullable(),
  year: z.number().int().min(1900).max(2100).nullable(),
  completed_on: completionDate,
  project_status: z.enum(['in_progress', 'completed']).nullable(),
  client_label: z.string().trim().max(120).nullable(),
  role: z.string().trim().max(120).nullable(),
  status: z.enum(['draft', 'published']),
  is_featured: z.boolean(),
  sort_order: z.number().int().min(-100000).max(100000),
  seo_title: z.string().trim().max(180).nullable(),
  seo_description: z.string().trim().max(320).nullable(),
  tag_names: tagNamesSchema,
  tag_ids: tagIdsSchema,
  media: z.array(galleryItemSchema).max(30).refine(
    (values) => new Set(values.map((value) => value.object_path)).size === values.length,
    'Gallery image paths must be unique.',
  ).refine(
    (values) => values.filter((value) => value.media_role === 'presentation_board').length <= 1,
    'Only one image can be the presentation board.',
  ),
};

export const createEntrySchema = z.object({
  title: entryFields.title,
  slug: entryFields.slug,
  summary: entryFields.summary,
  presentation: entryFields.presentation.optional(),
  body_markdown: entryFields.body_markdown.optional(),
  case_study_sections: entryFields.case_study_sections.optional(),
  category_id: entryFields.category_id,
  thumbnail_path: rasterObjectPath.nullable().optional(),
  thumbnail_alt: entryFields.thumbnail_alt.optional(),
  project_url: entryFields.project_url.optional(),
  repository_url: entryFields.repository_url.optional(),
  year: entryFields.year.optional(),
  completed_on: entryFields.completed_on.optional(),
  project_status: entryFields.project_status.optional(),
  client_label: entryFields.client_label.optional(),
  role: entryFields.role.optional(),
  status: entryFields.status.optional(),
  is_featured: entryFields.is_featured.optional(),
  sort_order: entryFields.sort_order.optional(),
  seo_title: entryFields.seo_title.optional(),
  seo_description: entryFields.seo_description.optional(),
  tag_names: tagNamesSchema.optional(),
  tag_ids: tagIdsSchema.optional(),
  media: entryFields.media.optional(),
}).strict().refine((value) => !(value.tag_names && value.tag_ids), {
  message: 'Use either tag_names or tag_ids.',
  path: ['tag_names'],
}).refine((value) => !value.thumbnail_path || Boolean(value.thumbnail_alt?.trim()), {
  message: 'Thumbnail alt text is required when a thumbnail is selected.',
  path: ['thumbnail_alt'],
}).refine((value) => Boolean(value.thumbnail_path) || value.thumbnail_alt == null, {
  message: 'Clear thumbnail alt text when no thumbnail is selected.',
  path: ['thumbnail_alt'],
});

export const updateEntrySchema = z.object(entryFields).partial().strict().refine((value) => Object.keys(value).length > 0).refine(
  (value) => !(value.tag_names && value.tag_ids),
  { message: 'Use either tag_names or tag_ids.', path: ['tag_names'] },
).refine((value) => !value.thumbnail_path || Boolean(value.thumbnail_alt?.trim()), {
  message: 'Thumbnail alt text is required when a thumbnail is selected.',
  path: ['thumbnail_alt'],
}).refine((value) => value.thumbnail_path !== null || value.thumbnail_alt == null, {
  message: 'Clear thumbnail alt text when no thumbnail is selected.',
  path: ['thumbnail_alt'],
});

const catalogSkillSchema = z.object({
  id: catalogTechnologyId,
  status: z.enum(['known', 'learning']),
}).strict();

const legacySkillSchema = z.object({
  name: z.string().trim().min(1).max(80),
  group: z.string().trim().max(80).optional(),
  status: z.enum(['known', 'learning']).optional(),
}).strict();

const socialLinkSchema = z.object({
  label: z.string().trim().min(1).max(40),
  url: safeContactUrl,
}).strict();

export const updateProfileSchema = z.object({
  display_name: z.string().trim().min(1).max(120).optional(),
  headline: z.string().max(180).optional(),
  bio: z.string().max(12000).optional(),
  location: z.string().trim().max(120).nullable().optional(),
  contact_url: safeContactUrl.nullable().optional(),
  avatar_path: rasterObjectPath.nullable().optional(),
  avatar_alt: z.string().trim().min(1).max(300).nullable().optional(),
  skills: z.array(z.union([catalogSkillSchema, legacySkillSchema])).max(40).refine(
    (skills) => new Set(skills.map((skill) => 'id' in skill ? skill.id : skill.name.toLocaleLowerCase())).size === skills.length,
    'Technology selections must be unique.',
  ).optional(),
  social_links: z.array(socialLinkSchema).max(20).optional(),
}).strict().refine((value) => Object.keys(value).length > 0).refine(
  (value) => value.avatar_path !== null || value.avatar_alt == null,
  { message: 'Avatar alt text must be cleared when removing the avatar.', path: ['avatar_alt'] },
).refine(
  (value) => value.avatar_path === undefined || value.avatar_path === null || Boolean(value.avatar_alt?.trim()),
  { message: 'Avatar alt text is required when an avatar is selected.', path: ['avatar_alt'] },
);

export const adminMediaPathSchema = z.object({ object_path: objectPath }).strict();

export const adminMediaUploadTicketSchema = z.object({
  file_size: z.number().int().min(1),
  content_type: z.string().trim().min(1).max(100),
  media_role: z.enum(['avatar', 'thumbnail', 'presentation_board', 'logo_variation', 'supporting_image', 'page_screenshot']),
}).strict();

export const adminEntryListQuerySchema = z.object({
  status: z.enum(['draft', 'published', 'all']).default('all'),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
}).strict();
