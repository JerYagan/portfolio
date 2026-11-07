# Implementation plan

This checklist tracks implementation. Check an item only when the result exists and has been verified.

## Phase 0 — Specification

- [x] Define public and private product scope in `PRD.md`.
- [x] Choose a versioned stack baseline in `STACK.md`.
- [x] Define architecture, data model, API, conventions, visual system, security, and testing strategy.
- [x] Add `.env.example` with safe local names and defaults.
- [x] Keep owner name, biography, contact, socials, and stack as visible placeholders until the owner supplies details.
- [x] Define the profile-first landing page, completion dates, curated technology selector, and Vercel deployment checklist.

## Phase 1 — App foundation

- [x] Initialize Next.js 16.4.5 App Router with React 19.3.1 and TypeScript 5.9.3; pin dependencies and create lockfile.
- [x] Set up the CSS token system, site shell, responsive navigation, and light/dark/system theme.
- [x] Add the Supabase cookie-aware server client and Next.js 16 `proxy.ts` session refresh behavior.
- [x] Set up local environment loading and validate required variables at startup.
- [x] Add 404, loading, and route error states.

Phase 1 is implemented. The initial dependency install completed with zero reported vulnerabilities. This workspace's system Node is `24.22.0`; Phase 5 checks used the pinned Node.js `24.22.2` runtime. Typecheck and production build now pass; interactive browser acceptance remains incomplete.

## Phase 2 — Database and authorization

- [x] Add SQL migrations for tables, constraints, indexes, updated-at triggers, publication timestamp trigger, and RLS.
- [x] Create private `portfolio-media` bucket and object policies in local config and migration.
- [x] Seed an editable profile placeholder and five empty starter categories without sample work.
- [x] Add a manual development admin-membership seed template that requires a pre-existing Auth user.
- [x] Apply the initial schema migration to the Supabase project through the Dashboard SQL Editor.
- [x] Add the trusted owner account to `admin_users` out of band.
- [ ] Verify anon, non-admin, and admin access using disposable data.

The owner reports applying the initial migration through the Dashboard, and the screenshot shows a successful SQL query. `.env.local` is present and ignored; `.env.example` is the safe placeholder template. Read-only verification confirmed Auth sign-in, matching admin membership, public profile/category reads, and anonymous denial for `admin_users`; the temporary session was signed out. Full non-admin/draft/write/Storage RLS checks remain pending and should use a development project because Supabase marks this project Production. Since Dashboard execution does not update CLI migration history, reconcile the migration before future CLI pushes. Docker is out of scope. See `PHASE2_SETUP.md`.

## Phase 3 — Public portfolio

- [x] Build home, about, work index, category view, entry detail, and not-found routes.
- [x] Build category filters and project cards with responsive image behavior.
- [x] Add profile/skills, dynamic category browsing, and optional project metadata rendering.
- [x] Replace the landing hero with the owner profile, featured work, technology marks/statuses, and optional completion dates.
- [x] Add the documented public portfolio API routes for profile, categories, entry lists, and details.
- [x] Add SEO metadata and public sitemap/robots behavior for published content only.
- [ ] Verify empty states, published-only visibility, theme modes, mobile layout, keyboard use, and reduced motion.

Phase 3 public routes and data access are implemented with explicit published/visible filters and short-lived signed media URLs. `npm run typecheck` and `npm run build` pass. Browser, accessibility, and database behavior checks remain pending; do not use production data for destructive RLS checks.

Phase 5 read-only checks confirmed the public entries API returns its public projection and the public data queries filter to published entries and visible categories. The empty public portfolio state is present. Full theme, mobile, keyboard, and cross-route browser acceptance remains pending.

## Phase 4 — Private CMS

- [x] Build invite-only login, admin shell, overview, and sign-out.
- [x] Build category create/edit/visibility/order/delete flows.
- [x] Build entry list, search/filter, create/edit/publish/unpublish/order/delete flows.
- [x] Build profile and skills editor.
- [x] Replace free-text skills with a curated technology selector and use/learning status.
- [x] Build image upload, alt/caption editing, gallery ordering, and cleanup retry behavior.
- [ ] Verify every admin endpoint and Storage action rejects signed-out and non-admin users.

Phase 4 CMS routes, forms, server-managed HttpOnly sessions, upload validation, private previews, and cleanup retry responses are implemented. `npm run typecheck` and `npm run build` pass. Phase 5 confirmed signed-out admin category, entry, and profile GETs return `401` with `no-store`, and `/admin` returns an early `307` to login. Non-admin/RLS behavior and mutation/upload rejection remain unverified against a disposable development project; the configured Supabase project is marked Production, so no write-based checks were run against it.

Phase 5 read-only HTTP checks against the current build returned `401` with `no-store` for anonymous admin category, entry, and profile GET requests. Other admin methods and Storage/RLS behavior remain unverified; do not probe production with write requests.

## Phase 5 — Production readiness

- [x] Run the six Node unit checks, TypeScript typecheck, and production build with pinned Node.js `24.22.2`.
- [ ] Run database/RLS checks and admin write/upload flows against a disposable development Supabase project.
- [x] Verify signed-out `/admin` redirects to login before rendering the admin page; confirm anonymous admin category, entry, and profile GET endpoints return `401` with `no-store`.
- [x] Manually inspect `/`, `/work`, `/about`, and `/work/category/websites`; confirm the empty states and theme control cycles through system, light, and dark.
- [ ] Complete keyboard-only, mobile viewport, reduced-motion, populated entry-detail, and admin workflow checks. No admin login or write flow was attempted.
- [x] Review source-level contrast, focus, reduced-motion, and public image alternative-text rules. Light and dark text/accent contrast ratios meet WCAG AA for normal text; interactive keyboard/mobile review remains pending.
- [ ] Configure production environment values, HTTPS, Supabase redirect URLs, and backups after the owner supplies the production host/domain and backup plan.
- [ ] Complete a restore drill and verify RLS against a disposable database.
- [x] Verify public API cache headers, public published/visible query filters, and `no-store` on anonymous admin read endpoints. No published entries were returned by the public API check.
- [x] Confirm the public work archive has no sample portfolio entries; leave profile fields at the values the owner supplied and keep missing details as placeholders.

Phase 5 unit, typecheck, production build, source-level accessibility, safe read-only API checks, and a partial manual browser pass passed. The production Supabase project was not modified. RLS, full keyboard/mobile/detail/admin acceptance, restore, and deployment configuration checks remain pending. See `TESTING.md` for exact commands and outcomes.

## Phase 6 — Vercel deployment planning

- [x] Document project settings, environment values, Preview/Production boundaries, Supabase redirects, and launch checks in `DEPLOYMENT_VERCEL.md`.
- [ ] Apply the additive completion-date/technology migration to the intended Supabase project.
- [ ] Choose the Git repository, production branch, domain, Preview database, and Supabase backup/restore plan.
- [ ] Create and verify a Vercel Preview deployment after project details are available.
- [ ] Complete the production launch checklist and verify a rollback/restore path.

Phase 6 has a deployment plan only; no Vercel project or deployment has been created.

Phase 3/4 follow-up: the profile-first landing page, local technology catalog, `known` / `learning` selection, featured-entry section, completion-date field, and display are implemented. The public read layer falls back to year-only data until the new migration is applied; no Supabase migration or content write was run in this turn. A clean restart of the existing local dev server changed the rendered public shell from two visible copies to one.

## 2026-11-08 public portfolio refinements

- [x] Add a latest-work section to the profile page, capped at eight published entries and sorted independently of featured work.
- [x] Replace the cropped project gallery with full-ratio masonry placement and a native modal image viewer.
- [x] Expand the searchable, grouped local-logo technology catalog to 171 tools across the requested disciplines.
- [x] Add local tool marks to matching project tags on public detail pages.
- [x] Add a mobile navigation menu and scroll-direction header behavior for desktop and mobile.
- [x] Tighten public project detail responsiveness and gallery layout for small screens.
- [ ] Verify populated project gallery, image dialog interactions, narrow mobile overflow, and header scroll behavior in a browser.

Implementation and the static catalog are present. Typecheck and the production build pass; browser interaction checks are still required before marking the final verification item complete.

## 2026-11-08 gallery and admin refinement

- [x] Place variable-ratio gallery images into balanced masonry columns at desktop and mobile breakpoints.
- [x] Keep local technology marks in their brand colors, including selected multicolor brand logos.
- [x] Present gallery images in a contained modal with a dimmed, blurred backdrop and outside-image dismissal.
- [x] Reduce the project cover image height on mobile.
- [x] Increase admin text, control, and field sizing slightly without changing public typography.
- [ ] Verify the revised modal and layouts in a browser at desktop and mobile sizes.

Browser review confirmed the three-column gallery at 950px, the contained dimmed/blurred modal and Escape close, the shortened cover at 390px, and colored public skill marks. Outside-image dismissal and admin sizing still need a visual pass; typecheck and production build passed. No test suite or database write was run.

## 2026-11-08 project tools and modal frame

- [x] Remove the visible outline and shadow around the gallery image modal while preserving its blurred, dark backdrop.
- [x] Add searchable selection from the technology catalog to the admin entry editor and preserve custom project tags separately.
- [x] Show catalog-matched tools and their logos on public project detail pages.
- [ ] Verify the tool selector and project detail rendering with populated catalog tags in a browser.

The entry tool selector reuses the existing tag associations and API field, so this change requires no database migration. `npm run typecheck` and `npm run build` pass; populated browser verification remains pending.

## 2026-11-08 image-only modal and logofolio layout

- [x] Remove the modal panel and circular close-button styling so the image sits directly over the blurred backdrop.
- [x] Add a per-entry standard/logofolio presentation setting to the CMS and public entry detail.
- [x] Render the first ordered logofolio image as a tall board, selected tools below it, and later images as the logo gallery.
- [x] Add an additive database migration and compatibility handling for projects where it has not yet been applied.
- [ ] Apply the presentation migration to Supabase and verify a populated logofolio entry in the browser.

The feature is implemented in the application. `npm run typecheck` and `npm run build` pass. Standard entries continue to work on the prior schema; selecting logofolio requires applying `20261108020000_entry_presentation_layout.sql` to the connected Supabase project. Populated browser verification remains pending.

## 2026-11-08 legacy schema read fallback

- [x] Handle both missing optional entry columns (`completed_on` and `presentation`) in sequence so public reads continue to work before either additive migration is applied.
- [x] Keep detailed Supabase read diagnostics in development server logs while preserving the generic public error response.
- [ ] Recheck the local public API after a clean dev-server reload.

