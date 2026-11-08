# Next steps

This checklist tracks the remaining verification and release work after the local runtime and logofolio layout updates.

## 1. Reload and verify the local app

- [x] Stop and restart the local Next.js development server so it loads the latest changes.
- [x] Open `/` and confirm the page renders without the `PortfolioDataError` screen (HTTP 200).
- [x] Open `/api/portfolio/entries` and confirm it returns successful JSON (HTTP 200; two published entries).
- [x] Open `/work/november-2026-logofolio` and confirm the detail route renders (HTTP 200).
- [x] Check the server log for data-read errors after restart; none appeared during these requests.

## 2. Confirm the Supabase schema

Read-only checks against the project configured in `.env.local` show that `presentation` is available on `public.portfolio_entries`. Selecting `completed_on` returns a schema error, so the completion-date migration is still needed. No database write was made.

- [x] Confirm `presentation` is available to the public API role.
- [ ] Apply `supabase/migrations/20261108010000_profile_tech_and_entry_completion.sql` in the Supabase Dashboard SQL Editor and verify `completed_on` is available.
- [x] Confirm `presentation` is available; verify migration history in the Dashboard if needed.
- [x] Keep the code's backward-compatible `standard` fallback for older schemas.

Apply only the missing migration, in timestamp order, to the project connected to `.env.local`. The configured project is Production, so review its target and backup status before writing. The Supabase CLI is not authenticated; this agent did not apply the SQL.

## 3. Review the existing logofolio entry

The public API already contains `november-2026-logofolio`, and its detail route returns HTTP 200. Do not create a duplicate. Review the current entry in the CMS and retain its content unless you intend to replace its placeholder values with final copy and artwork.

- [x] Confirm an existing public entry uses the logofolio slug and has a thumbnail.
- [x] Confirm its Graphic Design category, Logofolio presentation, and current first image in the CMS.
- [x] Confirm the current board has alternative text; the entry has no additional logo variation images yet.
- [ ] Confirm the selected tool names and completion year/date are accurate.
- [x] Review the full-width board on desktop and mobile; the board matches the page container without horizontal overflow.
- [x] Review an existing project image modal: image-only presentation, blurred/dark backdrop, plain close icon, outside-click dismissal, and Escape dismissal.
- [ ] Review a populated logofolio logo gallery; the existing logofolio entry currently has no logo variation images.

## 4. Finish public and CMS acceptance

- [x] Check the standard project detail and gallery modal at a narrow mobile viewport.
- [x] Check the logofolio detail layout on desktop and at 390px mobile width; confirm no horizontal overflow.
- [x] Cycle through light, dark, and system themes and verify keyboard focus visibility.
- [x] Confirm the reduced-motion stylesheet disables smooth scrolling and reduces animation/transition duration.
- [ ] Enable the reduced-motion preference and visually verify the page behavior in a browser.
- [x] Confirm the public entries API returns published portfolio items (two entries were returned).
- [ ] Confirm drafts stay private from public pages and APIs.
- [x] Confirm signed-out `/admin` redirects (307) and anonymous category, entry, and profile APIs return 401.
- [x] Verify tool search and selection in the authenticated CMS; discard the unsaved test selection without saving.
- [x] Confirm the CMS entry editor exposes presentation, gallery, tool, year, completion-date, and publication fields.
- [ ] Update `docs/PLAN.md` with remaining manual results.

Browser checks were completed against `http://localhost:3000`. No CMS content was saved or changed.

## 5. Prepare deployment when project details are ready

- [ ] Choose the Git repository, production branch, domain, Preview database, and backup/restore plan.
- [ ] Follow `docs/DEPLOYMENT_VERCEL.md` to configure separate Preview and Production variables, Supabase redirect URLs, and a Preview deployment.
- [ ] Complete production checks and a restore drill before launch. Do not use production data for destructive verification.
