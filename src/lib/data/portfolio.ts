import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { isMissingCompletionDateColumn, isMissingPresentationColumn, isMissingMediaRoleColumn, isMissingCaseStudySectionsColumn, isMissingProjectStatusColumn, isMissingWebsitePageMediaColumn } from '@/lib/data/completion-date';
import { normalizeStoredTechnologies, technologyOption, type TechnologyId, type TechnologyStatus } from '@/lib/tech-stack';

const mediaBucket = 'portfolio-media';
const publicMediaTtlSeconds = 60 * 60 * 24;

type ProfileRow = {
  display_name: string;
  headline: string;
  bio: string;
  location: string | null;
  contact_url: string | null;
  avatar_path: string | null;
  avatar_alt: string | null;
  skills: unknown;
  social_links: unknown;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
};

type EntryRow = {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  summary: string;
  body_markdown: string;
  thumbnail_path: string | null;
  thumbnail_alt: string | null;
  project_url: string | null;
  repository_url: string | null;
  year: number | null;
  completed_on: string | null;
  project_status?: 'in_progress' | 'completed' | null;
  presentation?: 'standard' | 'logofolio';
  case_study_sections?: unknown;
  client_label: string | null;
  role: string | null;
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  updated_at: string;
};

type MediaRow = {
  object_path: string;
  alt_text: string;
  caption: string | null;
  sort_order: number;
  media_role?: PortfolioMediaRole;
  page_name?: string | null;
  device_label?: WebsiteScreenshotDevice | null;
};

type TagRow = {
  id: string;
  name: string;
  slug: string;
};

type EntryTagRow = { portfolio_tags: TagRow | TagRow[] | null };

export type ProfileSkill = { id: string; catalogId?: TechnologyId; name: string; group?: string; status: TechnologyStatus };
export type ProfileSocialLink = { label: string; url: string };
export type PublicCategory = Pick<CategoryRow, 'id' | 'name' | 'slug' | 'description' | 'sort_order'>;
export type PublicCategoryWithCount = PublicCategory & { entry_count: number };
export type PublicImage = { url: string; alt: string };
export type PublicTag = TagRow;
export type PortfolioMediaRole = 'presentation_board' | 'logo_variation' | 'supporting_image' | 'page_screenshot';
export type WebsiteScreenshotDevice = 'desktop' | 'tablet' | 'mobile';
export type PublicGalleryImage = PublicImage & { caption: string | null; sort_order: number; media_role: PortfolioMediaRole; page_name: string | null; device_label: WebsiteScreenshotDevice | null };
export type PublicCaseStudySection = { heading: string; bodyMarkdown: string };

export type PublicProfile = {
  displayName: string;
  headline: string;
  bio: string;
  location: string | null;
  contactUrl: string | null;
  avatar: PublicImage | null;
  skills: ProfileSkill[];
  socialLinks: ProfileSocialLink[];
};

export type PublicEntryPreview = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: Pick<PublicCategory, 'id' | 'name' | 'slug'>;
  thumbnail: PublicImage | null;
  year: number | null;
  completedOn: string | null;
  projectStatus: 'in_progress' | 'completed' | null;
  isFeatured: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export type PublicEntry = PublicEntryPreview & {
  presentation: 'standard' | 'logofolio';
  bodyMarkdown: string;
  caseStudySections: PublicCaseStudySection[];
  projectUrl: string | null;
  repositoryUrl: string | null;
  clientLabel: string | null;
  role: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: PublicTag[];
  media: PublicGalleryImage[];
};

export type PublicEntryList = {
  category: PublicCategory | null;
  entries: PublicEntryPreview[];
  total: number;
  page: number;
  limit: number;
};

export class PortfolioDataError extends Error {
  constructor() {
    super('Portfolio data is temporarily unavailable.');
    this.name = 'PortfolioDataError';
  }
}

const placeholderProfile: PublicProfile = {
  displayName: 'Your Name',
  headline: '',
  bio: '',
  location: null,
  contactUrl: null,
  avatar: null,
  skills: [],
  socialLinks: [],
};

function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : [];
}

export function normalizeCaseStudySections(value: unknown): PublicCaseStudySection[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const section = item as Record<string, unknown>;
    if (typeof section.heading !== 'string' || typeof section.body_markdown !== 'string') return [];
    const heading = section.heading.trim();
    const bodyMarkdown = section.body_markdown;
    return heading.length > 0 && heading.length <= 80 && bodyMarkdown.length <= 8000 && bodyMarkdown.trim().length > 0
      ? [{ heading, bodyMarkdown }]
      : [];
  });
}

function parseSkills(value: unknown): ProfileSkill[] {
  return normalizeStoredTechnologies(value).flatMap((skill, index) => {
    if ('id' in skill) {
      const option = technologyOption(skill.id);
      return option ? [{ id: skill.id, catalogId: skill.id, name: option.name, group: option.group, status: skill.status }] : [];
    }
    return [{ id: `legacy-${index}`, name: skill.name, ...(skill.group ? { group: skill.group } : {}), status: skill.status }];
  });
}

function safeUrl(value: string | null, allowMailto = false): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'https:' || (allowMailto && parsed.protocol === 'mailto:')) return value;
  } catch {
    return null;
  }

  return null;
}

function safeSearchTerm(value: string): string {
  return value.replace(/[^\p{L}\p{M}\p{N}\s'’&+\-]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function parseSocialLinks(value: unknown): ProfileSocialLink[] {
  return asRecords(value).flatMap((item) => {
    if (typeof item.label !== 'string' || typeof item.url !== 'string' || !item.label.trim()) return [];
    const url = safeUrl(item.url);
    return url ? [{ label: item.label.trim(), url }] : [];
  });
}

async function signImage(
  client: SupabaseClient,
  objectPath: string | null,
  alt: string | null,
): Promise<PublicImage | null> {
  if (!objectPath?.startsWith('portfolio/') || !alt?.trim()) return null;
  const { data, error } = await client.storage.from(mediaBucket).createSignedUrl(objectPath, publicMediaTtlSeconds);
  if (error || !data?.signedUrl) return null;
  return { url: data.signedUrl, alt: alt.trim() };
}

function ensureNoError(error: unknown) {
  if (!error) return;
  if (process.env.NODE_ENV !== 'production' && typeof error === 'object' && error !== null) {
    const diagnostic = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
    console.error(`[portfolio-data] Supabase read failed ${JSON.stringify({
      type: Object.prototype.toString.call(error),
      text: String(error),
      keys: Object.keys(error),
      ownKeys: Reflect.ownKeys(error).map(String),
      serialized: JSON.stringify(error),
      code: diagnostic.code,
      message: diagnostic.message,
      details: diagnostic.details,
      hint: diagnostic.hint,
    })}`);
  }
  throw new PortfolioDataError();
}

export const getPublicProfile = cache(async (): Promise<PublicProfile> => {
  const client = createPublicSupabaseClient();
  if (!client) return placeholderProfile;

  const { data, error } = await client
    .from('profile')
    .select('display_name,headline,bio,location,contact_url,avatar_path,avatar_alt,skills,social_links')
    .eq('id', 1)
    .maybeSingle();
  ensureNoError(error);
  if (!data) return placeholderProfile;

  const row = data as unknown as ProfileRow;
  return {
    displayName: row.display_name || placeholderProfile.displayName,
    headline: row.headline || '',
    bio: row.bio || '',
    location: row.location || null,
    contactUrl: safeUrl(row.contact_url, true),
    avatar: await signImage(client, row.avatar_path, row.avatar_alt),
    skills: parseSkills(row.skills),
    socialLinks: parseSocialLinks(row.social_links),
  };
});

export const getPublicCategories = cache(async (): Promise<PublicCategory[]> => {
  const client = createPublicSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('portfolio_categories')
    .select('id,name,slug,description,sort_order')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  ensureNoError(error);
  return (data ?? []) as unknown as PublicCategory[];
});

export async function getPublicCategoriesWithCounts(): Promise<PublicCategoryWithCount[]> {
  const client = createPublicSupabaseClient();
  const categories = await getPublicCategories();
  if (!client || categories.length === 0) return categories.map((category) => ({ ...category, entry_count: 0 }));

  const counted = await Promise.all(categories.map(async (category) => {
    const { count, error } = await client
      .from('portfolio_entries')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category.id)
      .eq('status', 'published');
    ensureNoError(error);
    return { ...category, entry_count: count ?? 0 };
  }));
  return counted;
}

const entryColumns =
  'id,category_id,title,slug,summary,body_markdown,thumbnail_path,thumbnail_alt,project_url,repository_url,year,completed_on,project_status,presentation,client_label,role,is_featured,sort_order,seo_title,seo_description,published_at,updated_at';

function toPreview(row: EntryRow, categoriesById: Map<string, PublicCategory>): PublicEntryPreview | null {
  const category = categoriesById.get(row.category_id);
  if (!category) return null;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    category: { id: category.id, name: category.name, slug: category.slug },
    thumbnail: null,
    year: row.year,
    completedOn: row.completed_on ?? null,
    projectStatus: row.project_status ?? null,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

async function withThumbnails(
  client: SupabaseClient,
  rows: EntryRow[],
  categoriesById: Map<string, PublicCategory>,
): Promise<PublicEntryPreview[]> {
  const previews = rows.flatMap((row) => {
    const preview = toPreview(row, categoriesById);
    return preview ? [{ row, preview }] : [];
  });
  return Promise.all(previews.map(async ({ row, preview }) => ({
    ...preview,
    thumbnail: await signImage(client, row.thumbnail_path, row.thumbnail_alt),
  })));
}

export async function getPublishedEntries(options: {
  categorySlug?: string;
  featured?: boolean;
  sort?: 'featured' | 'latest';
  query?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PublicEntryList> {
  const client = createPublicSupabaseClient();
  const page = options.page ?? 1;
  const limit = options.limit ?? 12;
  const categories = await getPublicCategories();
  const selectedCategory = options.categorySlug
    ? categories.find((category) => category.slug === options.categorySlug) ?? null
    : null;

  if (options.categorySlug && !selectedCategory) return { category: null, entries: [], total: 0, page, limit };
  if (!client || categories.length === 0) return { category: selectedCategory, entries: [], total: 0, page, limit };

  const categoryIds = selectedCategory ? [selectedCategory.id] : categories.map((category) => category.id);
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const searchTerm = options.query ? safeSearchTerm(options.query) : '';
  if (options.query && !searchTerm) return { category: selectedCategory, entries: [], total: 0, page, limit };
  const offset = (page - 1) * limit;
  const fetchEntries = (columns: string) => {
    let query = client.from('portfolio_entries').select(columns, { count: 'exact' })
      .eq('status', 'published').in('category_id', categoryIds);
    if (typeof options.featured === 'boolean') query = query.eq('is_featured', options.featured);
    if (searchTerm) query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
    const ordered = options.sort === 'latest'
      ? query.order('published_at', { ascending: false }).order('updated_at', { ascending: false })
      : query.order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('published_at', { ascending: false });
    return ordered.range(offset, offset + limit - 1);
  };
  let columns = entryColumns;
  let result = await fetchEntries(columns);
  for (let attempts = 0; attempts < 6; attempts += 1) {
    if (isMissingPresentationColumn(result.error) && columns.includes(',presentation')) {
      columns = columns.replace(',presentation', '');
    } else if (isMissingCompletionDateColumn(result.error) && columns.includes(',completed_on,')) {
      columns = columns.replace('year,completed_on,', 'year,');
    } else if (isMissingProjectStatusColumn(result.error) && columns.includes(',project_status')) {
      columns = columns.replace(',project_status', '');
    } else {
      break;
    }
    result = await fetchEntries(columns);
  }
  const { data, count, error } = result;
  ensureNoError(error);

  const rows = (data ?? []) as unknown as EntryRow[];
  return {
    category: selectedCategory,
    entries: await withThumbnails(client, rows, categoriesById),
    total: count ?? 0,
    page,
    limit,
  };
}

export async function getPublishedEntryBySlug(slug: string): Promise<PublicEntry | null> {
  const client = createPublicSupabaseClient();
  if (!client) return null;

  const categories = await getPublicCategories();
  if (categories.length === 0) return null;
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const categoryIds = categories.map((category) => category.id);
  const fetchEntry = (columns: string) => client
    .from('portfolio_entries')
    .select(columns)
    .eq('slug', slug)
    .eq('status', 'published')
    .in('category_id', categoryIds)
    .maybeSingle();
  let columns = `${entryColumns},case_study_sections`;
  let result = await fetchEntry(columns);
  for (let attempts = 0; attempts < 6; attempts += 1) {
    if (isMissingPresentationColumn(result.error) && columns.includes(',presentation')) {
      columns = columns.replace(',presentation', '');
    } else if (isMissingCaseStudySectionsColumn(result.error) && columns.includes(',case_study_sections')) {
      columns = columns.replace(',case_study_sections', '');
    } else if (isMissingCompletionDateColumn(result.error) && columns.includes(',completed_on,')) {
      columns = columns.replace('year,completed_on,', 'year,');
    } else if (isMissingProjectStatusColumn(result.error) && columns.includes(',project_status')) {
      columns = columns.replace(',project_status', '');
    } else {
      break;
    }
    result = await fetchEntry(columns);
  }
  const { data, error } = result;
  ensureNoError(error);
  if (!data) return null;

  const row = data as unknown as EntryRow;
  const preview = toPreview(row, categoriesById);
  if (!preview) return null;

  const [thumbnail, mediaResult, tagsResult] = await Promise.all([
    signImage(client, row.thumbnail_path, row.thumbnail_alt),
    client
      .from('portfolio_media')
      .select('object_path,alt_text,caption,sort_order,media_role,page_name,device_label')
      .eq('entry_id', row.id)
      .order('sort_order', { ascending: true }),
    client.from('entry_tags').select('portfolio_tags(id,name,slug)').eq('entry_id', row.id),
  ]);
  ensureNoError(tagsResult.error);

  let mediaRows: MediaRow[];
  if (isMissingWebsitePageMediaColumn(mediaResult.error)) {
    const roleOnlyMedia = await client.from('portfolio_media').select('object_path,alt_text,caption,sort_order,media_role')
      .eq('entry_id', row.id).order('sort_order', { ascending: true });
    if (isMissingMediaRoleColumn(roleOnlyMedia.error)) {
      const legacyMedia = await client.from('portfolio_media').select('object_path,alt_text,caption,sort_order')
        .eq('entry_id', row.id).order('sort_order', { ascending: true });
      ensureNoError(legacyMedia.error);
      mediaRows = (legacyMedia.data ?? []).map((image, index) => ({
        ...image,
        media_role: row.presentation === 'logofolio' ? (index === 0 ? 'presentation_board' : 'logo_variation') : 'supporting_image',
      })) as MediaRow[];
    } else {
      ensureNoError(roleOnlyMedia.error);
      mediaRows = (roleOnlyMedia.data ?? []) as unknown as MediaRow[];
    }
  } else if (isMissingMediaRoleColumn(mediaResult.error)) {
    const legacyMedia = await client.from('portfolio_media').select('object_path,alt_text,caption,sort_order')
      .eq('entry_id', row.id).order('sort_order', { ascending: true });
    ensureNoError(legacyMedia.error);
    mediaRows = (legacyMedia.data ?? []).map((image, index) => ({
      ...image,
      media_role: row.presentation === 'logofolio' ? (index === 0 ? 'presentation_board' : 'logo_variation') : 'supporting_image',
    })) as MediaRow[];
  } else {
    ensureNoError(mediaResult.error);
    mediaRows = (mediaResult.data ?? []) as unknown as MediaRow[];
  }
  const media = await Promise.all(mediaRows.map(async (image) => {
    const signedImage = await signImage(client, image.object_path, image.alt_text);
    return signedImage ? { ...signedImage, caption: image.caption, sort_order: image.sort_order, media_role: image.media_role ?? 'supporting_image', page_name: image.page_name ?? null, device_label: image.device_label ?? null } : null;
  }));
  const tagRows = (tagsResult.data ?? []) as unknown as EntryTagRow[];
  const tags = tagRows.flatMap((row) => {
    const related = Array.isArray(row.portfolio_tags) ? row.portfolio_tags[0] : row.portfolio_tags;
    return related ? [related] : [];
  });

  return {
    ...preview,
    thumbnail,
    bodyMarkdown: row.body_markdown,
    caseStudySections: normalizeCaseStudySections(row.case_study_sections),
    projectUrl: safeUrl(row.project_url),
    repositoryUrl: safeUrl(row.repository_url),
    clientLabel: row.client_label,
    role: row.role,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    presentation: row.presentation === 'logofolio' ? 'logofolio' : 'standard',
    tags,
    media: media.flatMap((image) => (image ? [image] : [])),
  };
}

export async function getPublishedSitemapEntries(): Promise<Array<{ slug: string; updatedAt: string }>> {
  const client = createPublicSupabaseClient();
  const categories = await getPublicCategories();
  if (!client || categories.length === 0) return [];

  const results: Array<{ slug: string; updatedAt: string }> = [];
  const categoryIds = categories.map((category) => category.id);
  const batchSize = 1000;
  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await client
      .from('portfolio_entries')
      .select('slug,updated_at')
      .eq('status', 'published')
      .in('category_id', categoryIds)
      .order('published_at', { ascending: false })
      .range(offset, offset + batchSize - 1);
    ensureNoError(error);
    const rows = (data ?? []) as unknown as Array<{ slug: string; updated_at: string }>;
    results.push(...rows.map((row) => ({ slug: row.slug, updatedAt: row.updated_at })));
    if (rows.length < batchSize) break;
  }
  return results;
}
