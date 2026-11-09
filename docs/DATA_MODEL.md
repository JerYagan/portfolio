# Data model

PostgreSQL is the source of truth. Keep the schema changes in ordered SQL files under `supabase/migrations/`; generated TypeScript types are derived artifacts. IDs are UUIDs. Timestamps are UTC `timestamptz`. Slugs are lowercase URL-safe text.

## Entity map

```text
admin_users (auth.users)
profile (single row)
portfolio_categories 1 ── * portfolio_entries
portfolio_entries 1 ── * portfolio_media
portfolio_entries * ── * portfolio_tags (through entry_tags)
```

## Tables

### `admin_users`

| Column | Type | Rules |
|---|---|---|
| `user_id` | `uuid` | Primary key, references `auth.users(id)` with cascade delete |
| `created_at` | `timestamptz` | Not null, default `now()` |

Only an existing trusted owner can seed this table through the Supabase dashboard/SQL editor. There is no self-service admin invitation endpoint in v1.

### `profile`

Exactly one row, enforced by `id smallint primary key check (id = 1)`.

| Column | Type | Rules |
|---|---|---|
| `id` | `smallint` | Primary key, must equal `1` |
| `display_name` | `text` | Not null, default `Your Name` until edited; 1–120 characters |
| `headline` | `text` | Not null, default empty; maximum 180 characters |
| `bio` | `text` | Not null, default empty; max 12,000 characters; plain text or sanitized limited markdown |
| `location` | `text` | Nullable |
| `contact_url` | `text` | Nullable; database accepts `https:` or `mailto:`; API also validates the URL |
| `avatar_path` | `text` | Nullable Storage object path under `portfolio/`; requires non-empty `avatar_alt` when set |
| `avatar_alt` | `text` | Nullable until avatar path is set; accessible description when avatar is present |
| `skills` | `jsonb` | Not null, default `[]`; ordered array of `{id, status}` catalog selections. `id` is a stable key from the maintained technology catalog; `status` is `known` or `learning`. Display name, discipline, and local logo path come from application catalog metadata. Readers temporarily accept legacy `{name, group?}` values to preserve older profile content. |
| `social_links` | `jsonb` | Not null, default `[]`; JSON array of ordered `{label, url}` objects; API allows safe protocols only |
| `updated_at` | `timestamptz` | Not null, default `now()` |

### `portfolio_categories`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `name` | `text` | Not null, 1–60 characters |
| `slug` | `text` | Not null, unique, lowercase URL-safe, max 60 characters |
| `description` | `text` | Not null, default empty, max 500 characters |
| `is_visible` | `boolean` | Not null, default `true` |
| `sort_order` | `integer` | Not null, default `0` |
| `created_at`, `updated_at` | `timestamptz` | Not null, default `now()` |

Category names are data, not an enum. Entries reference category IDs. A category cannot be deleted while entries reference it (`ON DELETE RESTRICT`).

### `portfolio_entries`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `category_id` | `uuid` | Not null, references `portfolio_categories(id)` with delete restrict |
| `title` | `text` | Not null, 1–120 characters |
| `slug` | `text` | Not null, globally unique, lowercase URL-safe, max 100 characters |
| `summary` | `text` | Not null, 1–240 characters |
| `presentation` | `text` | Not null, default `standard`, check in (`standard`, `logofolio`); chooses a reusable entry layout independently of the category name |
| `body_markdown` | `text` | Not null, default empty, max 30,000 characters; render safely, never allow raw HTML |
| `case_study_sections` | `jsonb` | Not null, default `[]`; ordered array of `{ heading, body_markdown }`, maximum 12 sections; API limits headings to 80 and each body to 8,000 characters |
| `thumbnail_path` | `text` | Nullable Storage object path under `portfolio/` |
| `thumbnail_alt` | `text` | Must be non-empty when a thumbnail path is set |
| `project_url` | `text` | Nullable, database and API accept `https:` only |
| `repository_url` | `text` | Nullable, database and API accept `https:` only |
| `year` | `smallint` | Nullable; database range 1900–2100, API may use a narrower practical range |
| `completed_on` | `date` | Nullable; exact calendar date the project was completed. API accepts years 1900–2100. When supplied it takes precedence over `year` in public display. |
| `project_status` | `text` | Nullable; check in (`in_progress`, `completed`). Describes the work progress, independently of the publication `status`. Existing rows stay unset until the owner selects a value. New CMS entries default to `in_progress`. |
| `client_label` | `text` | Nullable, max 120 characters; public only when supplied intentionally |
| `role` | `text` | Nullable, max 120 characters |
| `status` | `text` | Not null, check in (`draft`, `published`), default `draft`; published entry requires `published_at` |
| `is_featured` | `boolean` | Not null, default `false` |
| `sort_order` | `integer` | Not null, default `0` |
| `seo_title` | `text` | Nullable, max 180 characters |
| `seo_description` | `text` | Nullable, max 320 characters |
| `published_at` | `timestamptz` | Nullable; set on first publish by a database trigger and preserved on later republish |
| `created_at`, `updated_at` | `timestamptz` | Not null, default `now()` |

### `portfolio_media`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `entry_id` | `uuid` | Not null, references entries with cascade delete |
| `object_path` | `text` | Not null, unique Storage path under `portfolio/`, max 512 characters |
| `alt_text` | `text` | Not null, trimmed length 1–300 characters |
| `caption` | `text` | Nullable, max 300 characters |
| `media_role` | `text` | Not null, defaults to `supporting_image`; one of `presentation_board`, `logo_variation`, `supporting_image`, `page_screenshot` |
| `page_name` | `text` | Nullable; required for `page_screenshot`, trimmed length 1–80 characters; identifies the website page, such as Home or Contact |
| `device_label` | `text` | Nullable; required for `page_screenshot`, one of `desktop`, `tablet`, `mobile` |
| `sort_order` | `integer` | Not null, default `0` |
| `created_at` | `timestamptz` | Not null, default `now()` |

Images only in v1. The thumbnail may also appear in the gallery, but the gallery ordering is stored independently. Use object paths, not public URLs, so the URL can be derived from configured storage.

For `logofolio` presentation, exactly zero or one `presentation_board` media item is rendered full-width before the tools section. `logo_variation` items render in the logo gallery and `supporting_image` items render in a separate supporting gallery; each gallery preserves image ratios and role-local `sort_order`. A partial unique index allows at most one presentation board per entry. The entry thumbnail remains the archive-card preview. The additive migration backfills existing logofolios by marking their first ordered image as the board and later images as logo variations, preserving the current appearance.

`page_screenshot` media items are shown in a dedicated Website pages section. Each requires a page name and device label; the full-page image is opened in a scrollable, image-only viewer. This role is independent of the entry's category so future disciplines can reuse it where appropriate.

### `portfolio_tags`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `name` | `text` | Not null, 1–40 characters, unique case-insensitively |
| `slug` | `text` | Not null, unique, lowercase URL-safe, max 50 characters |

### `entry_tags`

Composite primary key (`entry_id`, `tag_id`). Both are foreign keys with cascade delete. Stores the many-to-many relationship between entries and technology/skill tags.

## Indexes and constraints

- Unique indexes on category slug, entry slug, media object path, and tag slug/name (case-insensitive name index).
- Index entries by `(status, is_featured desc, sort_order, published_at desc)`, `(category_id, status, sort_order)`, and non-null `thumbnail_path`.
- Index media by `(entry_id, sort_order)` and entry_tags by `tag_id`; a partial unique index on `portfolio_media(entry_id)` where `media_role = 'presentation_board'` permits at most one board per entry.
- `page_screenshot` media requires `page_name` and `device_label`; non-screenshot media must leave both fields null.
- `updated_at` is updated by a database trigger for `profile`, `portfolio_categories`, and `portfolio_entries`.
- Entry slug and category slug are normalized and validated in the application and constrained unique in SQL.
- `completed_on` uses PostgreSQL `date`, with strict `YYYY-MM-DD` calendar validation at the API boundary.
- `project_status` is nullable to avoid guessing the progress of existing work. When supplied, it is constrained to `in_progress` or `completed`; it is separate from the draft/published visibility status.
- `case_study_sections` must be a JSON array with at most 12 elements; the API validates each heading/body pair. Keeping the ordered sections on the entry row makes edits atomic with the rest of the entry and inherits its RLS policy.
- Public reads are limited with RLS to published entries, visible categories, and visible media belonging to published entries.

## Row Level Security

Enable RLS on every public-schema table and the Storage bucket. Public/anon can select the profile, visible categories, published entries, their tags, and media attached to published entries only. Public has no insert/update/delete rights. `private.is_portfolio_admin()` is a restricted `SECURITY DEFINER` helper with an empty search path; it checks `auth.uid()` against `admin_users`, whose rows are not publicly readable. An authenticated user can manage content only when this check succeeds. Policies cover both `USING` and `WITH CHECK` for writes. The private `portfolio-media` bucket accepts JPEG, PNG, WebP, and AVIF up to 8 MiB. Storage object reads are allowed to anon only when the object path is referenced by a published entry's thumbnail/gallery or the public profile avatar. Authenticated admins can read any object under `portfolio/`; uploads, updates, and deletes require an authenticated `admin_users` member and a path inside `portfolio/`. Public page rendering creates short-lived signed URLs only for paths already authorized by these rules.

## Deletion and media lifecycle

Deleting an entry removes its relational media/tag rows via foreign-key cascades. Before or after the database deletion, the CMS must remove associated Storage objects; storage cleanup is idempotent and reports failures for retry. Category deletion is rejected while entries exist. Reassign entries first, then delete the now-empty category.

