# Testing strategy

Testing is part of implementation acceptance. Pure-function checks use Node's built-in test runner, so no test framework dependency is needed. Browser automation remains manual until a browser test package and exact pinned version are approved in `STACK.md`.

## Test layers

### Unit checks

Use Node's built-in `node:test` runner for pure functions and schema behavior. The current checks cover:

- Category, entry, profile, and admin query schemas.
- URL, alt-text, and mutually-exclusive tag input rules.
- Image signature, MIME type, dimension, and 8 MiB size validation.

The current unit suite does not verify Supabase queries, theme behavior, RLS, or browser interactions.

### Database and RLS checks

Against a disposable Supabase project or local Supabase stack:

- Anonymous can read only published entries, visible categories, public profile fields, and media for published work.
- Anonymous cannot insert, update, or delete any content.
- Authenticated non-admin can neither read drafts nor write CMS records/storage objects.
- An authenticated admin can preview draft media through a short-lived signed URL; anon cannot read or sign a draft object's URL.
- `admin_users` member can manage the profile, categories, entries, tags, and portfolio media.
- A category with entries cannot be deleted; foreign keys and uniqueness constraints work.
- Deleting an entry removes related rows and storage cleanup can be retried safely.

Never run destructive database checks against production data.

### Browser acceptance checks

Before production, exercise:

1. Public home, about, category filter, list, and detail page with real content and with an empty database; confirm the landing page latest-work section renders at most eight published entries.
2. Light/dark/system theme, persistence, and no unreadable flash during initial render.
3. Signed-out admin redirect and direct request rejection.
4. Owner creates a category and a draft entry, edits it, publishes it, sees it publicly, then unpublishes/deletes it.
5. Image upload validation, gallery ordering, deletion cleanup, and descriptive alt text; confirm the staggered masonry preserves portrait/landscape image ratios and the modal opens, closes from outside the image or with Escape, and works with keyboard focus.
6. Slug collision, missing required fields, URL rejection, and oversized file error states.
7. Keyboard-only navigation, visible focus, mobile viewport, reduced-motion preference, mobile menu open/close behavior, and header scroll-direction behavior at mobile and desktop widths.
8. Profile editor technology search, grouped selection/status changes across disciplines, technology mark rendering, featured and latest work on the profile landing page, and date formatting for projects with a completion date.
9. Confirm a schema without `completed_on` still renders public work using its existing year field; setting a completion date should explain that the additive migration is required.
10. Open an existing saved draft from the CMS preview link; verify the public detail layout, noindex/no-store headers, five-minute media URLs, and successful return-to-editor navigation. Open the same preview signed out and as a non-admin; verify no entry data is returned and public pages/APIs remain published-only.

## Commands

- Unit checks: `npm test` with the pinned Node.js `24.22.2` runtime. The package script uses `node --experimental-strip-types --test`.
- Browser checks: choose a browser automation package and exact pinned version before adding it; until then, record manual browser checks and avoid claiming automated E2E coverage.
- Run the framework's production build after implementation changes that affect app compilation. A build is not a substitute for RLS or interaction checks.

## Reporting

Report the exact commands run and their outcomes. Distinguish unit, database/RLS, browser, accessibility, and build checks. Do not say a layer passed if it was not run.

## Phase 5 verification record

- Unit checks: 6 passed with Node.js `24.22.2` using `npm exec --yes --package=node@24.22.2 -- node --experimental-strip-types --test`.
- Typecheck: passed with Node.js `24.22.2` using `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Production build: passed with Node.js `24.22.2` using `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`.
- Read-only HTTP checks against the fresh production build: anonymous `/admin` returned `307` to `/admin/login?next=%2Fadmin` before rendering admin content; anonymous admin category, entry, and profile GET routes returned `401` with `no-store`; the anonymous public entries endpoint returned `200` with the documented shared-cache header and no entries. The home response contained one header and one footer. No production writes or sign-ins were attempted.
- Manual browser checks on the fresh build verified `/`, `/work`, `/about`, and `/work/category/websites`, their empty states, and the theme selector cycling through system, light, and dark. At the time, the process already serving port `3000` was stale. After a clean local dev-server restart on 2026-11-08, the browser DOM has one `.site-header` and one `.site-footer`.
- RLS checks and admin write/upload flows still require a disposable development project. Restore drills and deployment settings still require production host/domain/backup details.

## 2026-11-08 profile, portfolio, and deployment-plan changes

- Typecheck passed with pinned Node.js `24.22.2`: `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Production build passed with pinned Node.js `24.22.2`: `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`.
- Browser check on the restarted local dev server showed the profile landing page, empty featured-work state, and a single public navigation/footer pair. No CMS login, profile save, project mutation, or Supabase write was performed.
- Read-only `GET /api/portfolio/entries?featured=true` returned `200` and zero entries. Existing Supabase schema still predates `completed_on`; no real completion date could be rendered before the additive migration is applied.
- Keyboard-only, mobile viewport, populated project detail, reduced-motion, technology-selector interaction, and admin workflow checks remain incomplete. The Vercel guide is planning documentation only; no Vercel project was created.

## 2026-11-08 gallery, tool catalog, and responsive navigation changes

- Typecheck passed with pinned Node.js `24.22.2`: `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Production build passed with pinned Node.js `24.22.2`: `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`.
- The local technology catalog contains 171 options and every catalog SVG path exists in `public/technologies/`.
- Browser interaction checks for populated gallery images, the image preview modal, mobile overflow, and scroll-direction header behavior have not been run. No unit tests or database writes were run for this change.

## 2026-11-08 portfolio modal, brand colors, and admin sizing refinement

- Typecheck passed with pinned Node.js `24.22.2`: `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Production build passed with pinned Node.js `24.22.2`: `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`.
- Browser review at 950px showed three masonry columns for the three project images. The preview dialog appeared contained, with a dark blurred backdrop and close button; Escape closed it and restored focus.
- Browser review at 390px confirmed the cover stays within a short mobile frame and the public skill marks retain brand colors. Outside-image dismissal and admin field sizing were not visually checked; no database writes or unit tests were run.
- No database writes or content changes were made.

## 2026-11-08 private saved-entry preview

- Pinned-runtime typecheck passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Pinned-runtime production build passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`. The build includes the dynamic `/preview/[id]` route.
- Browser review confirmed a signed-out preview request redirects to the login page with the exact UUID preview path, and an authenticated owner can render the saved project through the shared public detail layout.
- CMS review confirmed **Preview saved version** opens `/preview/[id]` in a new tab with `rel="noreferrer"`. The route showed the private preview notice and editor return link. No editor form was saved.
- Anonymous HTTP verification returned `307` before content rendering with `Cache-Control: private, no-store, max-age=0, must-revalidate` and `X-Robots-Tag: noindex, nofollow, noarchive`. The rendered preview document includes matching robots metadata.
- No draft entry was available in the configured Production database, so a draft record was not created. Testing the preview with a saved draft and confirming draft exclusion against that record remain pending; no database or portfolio content was changed.
- The local dev server was restarted after the production build and is available at `http://localhost:3000`.

## 2026-11-08 media roles and branding

- Pinned Node.js `24.22.2` typecheck passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Pinned Node.js `24.22.2` production build passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`.
- `GET /` returned `200`; the server-rendered head referenced the 16×16 and 32×32 favicon PNGs, ICO, Apple touch icon, and manifest. The SVG logo, ICO, and manifest URLs each returned `200`.
- Role selector and reorder controls were not checked in a browser; they need the migration applied to be fully exercised.
- Migration `20261108030000_portfolio_media_roles.sql` was added to the repository but was not applied to the configured Supabase project. The existing first-image convention is used for reads until migration; gallery writes require the migration and return `503 MIGRATION_REQUIRED`.
- No portfolio content or database rows were modified.

## 2026-11-08 reusable case-study sections

- Pinned Node.js `24.22.2` typecheck passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Pinned Node.js `24.22.2` production build passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`.
- Read-only HTTP checks on the local server returned `200` for the home page and the existing `fresh-eats` detail API. The response includes an empty `case_study_sections` array while the additive column is absent, preserving existing project behavior.
- The additive migration `20261108040000_case_study_sections.sql` has not been applied to Supabase. Compatibility preserves public rendering and entry edits with no sections until migration; saving non-empty sections returns `503 MIGRATION_REQUIRED` before the schema is ready.
- No database or portfolio content was changed. Browser persistence/order checks remain pending a development database with the migration applied.

## 2026-11-08 logofolio information layout

- Pinned Node.js `24.22.2` typecheck passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Pinned Node.js `24.22.2` production build passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`.
- Browser review of the existing logofolio at desktop width confirmed both image galleries precede the grouped project information, metadata, tools, and tags.
- Mobile viewport review is pending. No database or portfolio content was changed.


## 2026-11-08 page title suffix

- Removed the root metadata title template that appended “— Portfolio” to route titles. Route-specific titles remain sourced from each page; the root fallback remains “Portfolio”.
- Pinned Node.js 24.22.2 typecheck passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Pinned Node.js 24.22.2 production build passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`.

## 2026-11-08 project progress and demo seed

- Pinned Node.js 24.22.2 typecheck passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Pinned Node.js 24.22.2 production build passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`.
- On the configured schema before the project-status migration, read-only public list and project-detail API requests returned `200`; the new status field was `null`, preserving unknown legacy progress instead of guessing.
- The demo website seed is intentionally not run against the configured database. Apply the migration and seed only in a local/development project, then verify the entry remains a draft, its progress selector saves, and the public detail shows the selected progress after publishing a non-demo entry.

## Full-page website screenshots

- Pinned Node.js 24.22.2 typecheck passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/typescript/bin/tsc --noEmit`.
- Pinned Node.js 24.22.2 production build passed: `npm exec --yes --package=node@24.22.2 -- node node_modules/next/dist/bin/next build`.
- Read-only `GET /api/portfolio/entries/demo-studio-website` returned `200` with its four existing gallery images. None are assigned the new page-screenshot role yet.
- Verify CMS uploads with page name and each device label persist and remain editable; standard gallery uploads should continue to work without the migration until screenshot media is selected.
- Verify a published entry renders screenshot previews separately from its regular gallery; open a very tall image and scroll to both ends on desktop and mobile.
- Verify close button, click outside the image, Escape, focus restoration, and previous/next controls; confirm no iframe or browser chrome is rendered and reduced-motion preferences are respected.
- Migration `20261108060000_website_page_screenshots.sql` has not been applied to Supabase. No gallery upload or database write was performed for this change.
