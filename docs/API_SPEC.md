# API specification

All handlers are Next.js App Router Route Handlers under `src/app/api`. JSON is UTF-8. The browser must not receive database internals, drafts, secrets, or stack traces. Admin endpoints require a valid Supabase session and membership in `admin_users`; every write also relies on RLS.

The private HTML page `/preview/[id]` is not a JSON endpoint. It validates a UUID, requires a valid session and `admin_users` membership, and renders the saved entry through the same detail component as public work. Signed-out requests redirect to `/admin/login` with a validated return path; unknown entries return the standard 404 page. Responses are dynamic, `private, no-store`, and `noindex`/`nofollow`/`noarchive`. It does not alter the public entry API contract or publish drafts.

## Common response shapes

Success:

```json
{ "data": {}, "meta": {} }
```

`meta` is omitted when there is no pagination or ancillary result.

Error:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Check the highlighted fields.", "fields": { "title": "Required." } } }
```

`fields` is optional. Never return stack traces or SQL text.

## Session endpoints

- `POST /api/auth/login` — same-origin JSON `{ "email": "…", "password": "…" }`; signs in through the server, verifies membership in `admin_users`, and sets server-managed session cookies. Returns `200` `{ "data": { "authenticated": true } }`; invalid credentials return generic `401`, and a valid non-admin account returns `403` after its local session is cleared. There is no sign-up endpoint.
- `POST /api/auth/logout` — same-origin sign-out; clears the local Supabase session and returns `204`.

## Public endpoints

### `GET /api/portfolio/categories`

Returns visible categories sorted by `sort_order`, then name. No auth required.

```json
{ "data": [{ "id": "uuid", "name": "Websites", "slug": "websites", "description": "", "entry_count": 3 }] }
```

### `GET /api/portfolio/entries`

Query parameters: `category` (category slug, optional), `featured` (`true|false`, optional), `q` (search title/summary, optional), `page` (default `1`), `limit` (default `12`, maximum `48`). Returns only published entries in visible categories. Sort featured first, then `sort_order`, then `published_at desc`.

Each list item includes `id`, `title`, `slug`, `summary`, `category` (`name`, `slug`), `thumbnail` (`url`, `alt` or null), `year`, `completed_on` (`YYYY-MM-DD` or null), `project_status` (`in_progress|completed` or null), `is_featured`, `published_at`. Media `url` is a 24-hour signed URL generated server-side after publication/visibility checks; `meta.media_expires_at` communicates its expiry when the response includes media. Public cache lifetime must not exceed 12 hours.

```json
{ "data": [], "meta": { "page": 1, "limit": 12, "total": 0, "total_pages": 0 } }
```

Unknown category slug returns `404 NOT_FOUND`. Invalid query values return `400 VALIDATION_ERROR`.

### `GET /api/portfolio/entries/[slug]`

Returns one published entry and its visible category, tags, and ordered gallery. Unknown and draft slugs both return `404 NOT_FOUND`. Gallery URLs expire after 24 hours; include `meta.media_expires_at`.

Detail fields include the list fields plus `presentation` (`standard|logofolio`), `body_markdown`, `case_study_sections[]` (`heading`, `body_markdown`), `project_url`, `repository_url`, `client_label`, `role`, `seo_title`, `seo_description`, and `media[]` (`url`, `alt`, `caption`, `sort_order`, `media_role`, `page_name`, `device_label`). Page screenshot media uses `media_role: page_screenshot` and includes a page name plus `desktop|tablet|mobile` device label; other media has null page metadata. Sections are returned in saved order; incomplete sections are omitted. Existing `summary` remains the short introduction.

### `GET /api/portfolio/profile`

Returns the public profile (`display_name`, `headline`, `bio`, `location`, `contact_url`, `avatar`, `skills[]`, `social_links[]`). No auth required. `avatar` is `{ "url": "https://…", "alt": "…" }` or `null`; skills are ordered `{ "id": "html5", "name": "HTML", "group": "Web foundations", "status": "known|learning", "icon_path": "/technologies/html5.svg" }` objects (`group` and `icon_path` can be null/omitted for preserved legacy skills), and social links are ordered `{ "label": "…", "url": "https://…" }` objects. Avatar URLs expire after 24 hours; include `meta.media_expires_at` when an avatar exists.

## Admin endpoints

All admin routes return `401 UNAUTHENTICATED` when signed out and `403 FORBIDDEN` when signed in but not listed in `admin_users`.

### Entries

- `GET /api/admin/entries?status=draft|published|all&page=1&limit=20&q=` — paginated owner list, newest-updated first. `limit` is 1–100; `q` searches title and summary.
- `POST /api/admin/entries` — create draft or published entry. Required: `title`, `slug`, `summary`, `category_id`; optional remaining `portfolio_entries` fields including `presentation` (`standard|logofolio`, defaults to `standard`), `completed_on` (`YYYY-MM-DD` or null), `project_status` (`in_progress|completed|null`, defaults to `in_progress`), `case_study_sections[]` (`heading`, `body_markdown`), `tag_names[]` or `tag_ids[]`, and `media[]` (`object_path`, `alt_text`, `caption`, `media_role`, `page_name`, `device_label`, `sort_order`). Case-study sections allow at most 12 items, headings up to 80 characters, and Markdown bodies up to 8,000 characters. `media_role` is `presentation_board|logo_variation|supporting_image|page_screenshot`, defaults to `supporting_image`, and at most one media item may be the presentation board. A `page_screenshot` requires a page name (1–80 characters) and a device label (`desktop|tablet|mobile`). Tag names are resolved to reusable tags.
- `GET /api/admin/entries/[id]` — fetch full editable entry, category, tags, ordered gallery, and five-minute signed preview URLs.
- The CMS editor links to `/preview/[id]` in a new tab for an existing saved entry. The preview displays the last saved state, including drafts; unsaved form changes are not included.
- `PATCH /api/admin/entries/[id]` — partial update. Unknown fields are rejected. `presentation` accepts `standard|logofolio`; `completed_on` accepts a valid `YYYY-MM-DD` calendar date or null; `project_status` accepts `in_progress|completed|null`; `case_study_sections[]` has the same count and text limits as create and preserves array order. Category, tags, and gallery are validated; each media item accepts `media_role` from `presentation_board|logo_variation|supporting_image|page_screenshot`, with at most one board per entry. A `page_screenshot` requires a page name and device label. `tag_names[]` may contain canonical names from the code-owned technology catalog (shown as project tools with local logos) or free-form project labels. The handler compensates by restoring entry associations if a multi-step association write fails. Unreferenced old-image cleanup failures are included in `meta.cleanup_pending[]` for retry.
- `DELETE /api/admin/entries/[id]` — permanently delete entry and relation rows, then remove unreferenced Storage objects. If cleanup fails, returns `200` with `meta.cleanup_pending[]` so the client can retry; successful cleanup returns `204`.

Successful create returns `201`; update `200`; delete `204`. Slug collision returns `409 SLUG_TAKEN`. Invalid category, body, or tag references return `400 VALIDATION_ERROR`.

When the optional `completed_on` column is missing on an older schema, public reads temporarily fall back to `year`; attempts to set a non-null completion date return `503 MIGRATION_REQUIRED` until the additive migration is applied.

When `presentation` is missing on an older schema, public reads and standard CMS entries default to `standard`; attempts to save `logofolio` return `503 MIGRATION_REQUIRED` until `20261108020000_entry_presentation_layout.sql` is applied.

When `portfolio_media.media_role` is missing, public pages and editor reads fall back to the prior first-image logofolio convention. Admin saves that include gallery images return `503 MIGRATION_REQUIRED` until `20261108030000_portfolio_media_roles.sql` is applied.

When `portfolio_entries.case_study_sections` is missing, public pages continue to render without structured sections. Saving non-empty sections returns `503 MIGRATION_REQUIRED` until `20261108040000_case_study_sections.sql` is applied; empty section arrays remain compatible with older schemas.

When `portfolio_entries.project_status` is missing, public pages omit the progress label. Admin create requires migration `20261108050000_entry_project_status.sql`; admin updates that only clear the optional status remain compatible with older schemas.

When `portfolio_media.page_name` or `device_label` is missing, public/admin reads fall back to existing media fields and display no website screenshot entries. Saving `page_screenshot` media returns `503 MIGRATION_REQUIRED` until `20261108060000_website_page_screenshots.sql` is applied. Other media roles remain compatible with the prior schema.

### Categories

- `GET /api/admin/categories` — all categories, including hidden, and entry counts.
- `POST /api/admin/categories` — create with required `name`, `slug`; optional `description`, `is_visible`, `sort_order`.
- `PATCH /api/admin/categories/[id]` — partial update; slug collision returns `409 SLUG_TAKEN`.
- `DELETE /api/admin/categories/[id]` — delete only if no entries are assigned; otherwise `409 CATEGORY_IN_USE`.

Category create returns `201`; list/update return `200`; delete returns `204`.

### Profile

- `GET /api/admin/profile` — current editable profile, object paths, and five-minute signed avatar preview URL.
- `PATCH /api/admin/profile` — update supported profile fields. `skills[]` accepts catalog `{ "id": "…", "status": "known|learning" }` selections plus preserved legacy `{ "name": "…", "group": "…" }` objects. New catalog IDs must exist in the code-owned option list. Validate all URLs and bounded string/list lengths. A failed old-avatar cleanup returns the unreferenced path in `meta.cleanup_pending[]` for retry.

Profile read/update return `200`.

### Media

- `POST /api/admin/media` — multipart form with one `file`; validates admin, image type, signature, dimensions, and size; uploads to `portfolio/` in the private `portfolio-media` bucket; returns `{data:{object_path,preview_url}}` with `201`.
- `POST /api/admin/media/signed-url` — JSON `{ "object_path": "portfolio/..." }`; validates admin and path, returns a five-minute preview URL with `200`. This endpoint is `no-store`.
- `DELETE /api/admin/media` — JSON `{ "object_path": "portfolio/..." }`; only deletes an unreferenced object under the configured portfolio prefix. Referenced files return `409 MEDIA_IN_USE`.

Media upload returns `201`; successful delete returns `204`.

## Status codes

| Status | Meaning |
|---|---|
| `200` | Successful read/update |
| `201` | Created |
| `204` | Successfully deleted; no body |
| `400` | Malformed input or validation error |
| `401` | Missing/invalid session |
| `403` | Authenticated user is not an administrator |
| `404` | Resource does not exist or is not public |
| `409` | Unique conflict, category still in use, or invalid state transition |
| `503` | A required additive database migration is not yet applied |
| `413` | Upload exceeds limit |
| `415` | Unsupported upload media type |
| `500` | Unexpected server error; generic message only |

## Cache behavior

Public GET responses may use short-lived caching; entry detail responses should be tagged by entry slug and category. Successful admin writes revalidate the public index, changed category, changed entry, and home page when the entry is featured or profile content changes. Admin endpoints are `no-store`.

