# Architecture

## Shape

One Next.js App Router application serves the public portfolio, the authenticated CMS, and JSON Route Handlers. Supabase Auth, PostgreSQL, and Storage provide identity, persisted content, and media storage. The public site and admin use the same content model, with database RLS as the final data boundary.

## Application folder structure

```text
src/
  proxy.ts
  app/
    (public)/
      about/page.tsx
      work/page.tsx
      work/category/[slug]/page.tsx
      work/[slug]/page.tsx
      preview/[id]/page.tsx
      page.tsx
      layout.tsx
    (auth)/
      admin/login/page.tsx
    (admin)/
      admin/page.tsx
      admin/categories/page.tsx
      admin/entries/page.tsx
      admin/entries/new/page.tsx
      admin/entries/[id]/page.tsx
      admin/profile/page.tsx
      admin/layout.tsx
    api/portfolio/categories/route.ts
    api/portfolio/entries/route.ts
    api/portfolio/entries/[slug]/route.ts
    api/portfolio/profile/route.ts
    api/admin/categories/route.ts
    api/admin/categories/[id]/route.ts
    api/admin/entries/route.ts
    api/admin/entries/[id]/route.ts
    api/admin/media/route.ts
    api/admin/media/signed-url/route.ts
    api/admin/profile/route.ts
    api/auth/login/route.ts
    api/auth/logout/route.ts
    sitemap.ts
    robots.ts
    icon.svg
    globals.css
    layout.tsx
    not-found.tsx
  components/
    public/
      ProjectGallery.tsx
      ProjectDetail.tsx
    admin/
    site-header.tsx
  lib/
    auth/authorization.ts
    data/admin-entries.ts
    data/admin-entry-preview.ts
    data/admin-media.ts
    data/portfolio.ts
    http/public-response.ts
    http/admin-request.ts
    http/admin-response.ts
    supabase/public.ts
    supabase/server.ts
    validation/public-queries.ts
    validation/admin.ts
    validation/auth.ts
supabase/
  migrations/
  seed.sql
```

The admin Route Handlers live in `app/api/admin`. Public, login, and protected admin route groups share URL paths without duplicating the root document shell.

Because the App Router is rooted at `src/app`, the Next.js request proxy lives at `src/proxy.ts` beside `src/app`. This lets Next discover the session refresh and signed-out admin redirect before rendering a route.

## Boundaries

- **Route/UI layer** renders pages, parses route state, and presents loading/error/empty states. It does not embed SQL or authorize only by hiding controls.
- **Data layer** owns typed Supabase queries, visibility rules, ordering, pagination, and public cache policy. Public selectors explicitly filter `status = 'published'` and visible categories.
- **Validation layer** defines Zod schemas for request bodies, URL slugs, query parameters, profile fields, and media constraints.
- **Authorization layer** resolves the current Supabase identity and checks `admin_users`. Every admin Route Handler performs this check. Admin layout and `proxy.ts` provide navigation/session behavior but are additional defenses, not substitutes.
- **Supabase clients** use only the publishable key. Public rendering uses a server-only anonymous client; admin sign-in/out and authenticated operations use the cookie-aware server client. Session cookies are HttpOnly, SameSite=Lax, and Secure in production. Admin forms call Route Handlers and do not handle access or refresh tokens.
- **Database** is the persistence source of truth. SQL migrations define tables, indexes, constraints, functions, and RLS policies.
- **Technology catalog** lives in `src/lib/tech-stack.ts`; stable IDs and local SVG marks are code-owned options, while the profile JSON stores only the selected IDs and `known` / `learning` status. Category and portfolio-entry disciplines remain database-driven.
- **Entry tools and tags** reuse the existing `portfolio_tags` / `entry_tags` association. The admin editor resolves catalog labels from `src/lib/tech-stack.ts` and submits their canonical names through `tag_names`; public detail pages render matches as tools with logos and retain unmatched labels as ordinary project tags. This requires no schema migration and keeps tags extensible.
- **Entry presentation** is a constrained per-entry value (`standard` or `logofolio`) stored on `portfolio_entries`, not inferred from category names. Each `portfolio_media` row has a constrained role: `presentation_board`, `logo_variation`, `supporting_image`, or `page_screenshot`. Website page screenshots store a required page name and device label and render in a dedicated section. A partial unique index permits one board per entry; role-local ordering is preserved. Migration backfill maps existing logofolios' first image to the board and later images to logo variations so current pages retain their layout.
- **Case-study narrative** is an ordered JSON array on `portfolio_entries`, validated at the Route Handler boundary and stored atomically with its entry. The public and private-preview detail renderer uses the same safe Markdown component and omits sections without both a heading and body. Section labels remain content; categories do not select section templates.
- **Project gallery** is a small client boundary around native `<dialog>` for contained image previews. It measures image ratios and places each figure into the shortest CSS Grid column; entry data and signed URLs remain server-provided. Full-page website screenshots use a separate native dialog whose image retains its full aspect ratio in a vertically scrollable viewport.
- **Private project preview** uses `/preview/[id]`, verifies the signed-in user is an `admin_users` member in the server data layer, then reads the saved entry through the user's RLS-backed Supabase session. The shared `ProjectDetail` component renders the same standard/logofolio layout as public work. Preview media uses five-minute admin signed URLs.
- **Storage** stores uploaded media in a private bucket. The database stores object paths and alt text/captions; never store binary data in SQL. The public data layer creates short-lived signed URLs only after it has confirmed the referenced entry is published.

## Data flow

### Public read

Browser requests a public route → Server Component calls the public repository → Supabase query is constrained to published entries and visible categories → RLS independently permits public reads only for those records → server creates short-lived signed URLs for referenced media → Next renders page metadata and HTML. Public JSON routes set bounded shared-cache headers; future admin mutations must revalidate any affected public response.

### Admin mutation

Owner submits credentials → same-origin Route Handler signs in on the server and confirms `admin_users` membership → HttpOnly session cookies are returned → owner submits a CMS form → Route Handler verifies session/membership and Zod validates input → RLS-protected user-scoped Supabase client writes the row/object → multi-table entry associations are restored on a failed association update where possible → handler returns the documented result and any cleanup paths → relevant public routes are revalidated.

### Media upload

CMS selects an image → handler checks auth, MIME type, byte size, signature, and dimensions → upload to the private `portfolio-media` bucket using the signed-in user's client and storage RLS → store object path and accessible metadata → admin preview URLs expire after five minutes; public signed URLs are created only when the associated entry/profile reference is public.

### Private entry preview

Owner opens **Preview saved version** in the CMS → `/preview/[id]` validates the UUID and verifies the Supabase session plus `admin_users` membership → user-scoped RLS queries read the saved entry, category, tags, and media → private five-minute signed URLs are created for media → shared `ProjectDetail` renders the public layout with a private preview notice → response is `private, no-store` and marked `noindex`. Signed-out owners are redirected through the existing login flow to the exact validated preview path. Public selectors and APIs continue to filter to published entries.

## Rendering and caching

- Public portfolio pages are server-rendered on demand. Public API responses use a one-hour shared-cache lifetime with a one-hour stale window, within the 12-hour limit. Public media URLs expire after 24 hours. Admin preview URLs expire after five minutes and are never cached.
- Admin routes and user-specific session data are dynamic and must not be shared through public caches.
- `/preview/[id]` is force-dynamic, sends `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow, noarchive`, and is omitted from the sitemap.
- A published detail URL is `/work/[slug]`; a category-filter URL is `/work/category/[slug]`.
- `completed_on` is an optional database `date` projected through public/admin entry responses and formatted in UTC without shifting the stored calendar date.
- The home route queries the latest eight published entries independently of the featured-work query; the public entries API retains its documented default ordering.
- Draft entries must not be included in public server fetches, generated metadata, sitemap, or JSON-LD.

## Error handling

Route Handlers return the common API envelope in `API_SPEC.md`. UI boundaries display useful but non-sensitive messages. Server logs may carry request IDs and diagnostic details, never credentials, cookie values, or full uploaded file contents.

