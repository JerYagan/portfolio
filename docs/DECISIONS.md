# Decisions (ADR-lite)

Short records of durable choices. Add newest decisions at the top.

## 2026-11-08 — Store a reusable entry presentation separately from its category

- **Decision:** Add a constrained `presentation` value to entries (`standard` or `logofolio`). For logofolios, the first ordered gallery image is the tall presentation board and later images are logo variations; the archive thumbnail remains a separate card preview.
- **Reason:** The owner can choose a logofolio treatment without hard-coding category names or changing the category model. The same category can contain entries using different layouts if needed.
- **Trade-off:** Applying one additive database migration is required to save logofolio entries. Older schemas default reads and standard entries to `standard` until migration.

## 2026-11-08 — Keep the gallery native and ratio-preserving

- **Decision:** Measure project image ratios, place each item into the shortest responsive CSS Grid column, and open a contained native `<dialog>` preview when selected.
- **Reason:** The project can present mixed poster, drawing, and interface dimensions without cropping or adding a lightbox dependency.
- **Trade-off:** Image placement can shift while lazy-loaded dimensions become available; keep the owner-defined item order and expose captions and alt text in both contexts.

## 2026-11-08 — Use a searchable, local-logo technology catalog

- **Decision:** Expand the code-owned catalog to 171 available tools across web, DevOps, QA, funnels, SEO, AI, design, media, Microsoft, and productivity groups; store SVG marks locally and expose only owner-selected tools publicly.
- **Reason:** The owner can add future skills from the CMS without letting a long default list overwhelm the public profile or introducing runtime hotlinks.
- **Trade-off:** Adding and maintaining options is a source change; profile selections use stable catalog IDs.

## 2026-11-08 — Separate latest published work from featured curation

- **Decision:** Fetch up to eight latest published entries for the profile landing page using publication time, independently from the featured query.
- **Reason:** Recent work should appear without requiring the owner to mark every new project as featured.
- **Trade-off:** A project can appear in both sections when it is both recent and featured.

## 2026-11-08 — Keep technology choices in a local catalog and profile selections in JSON

- **Decision:** Maintain the curated technology names, groups, stable IDs, and local SVG marks in `src/lib/tech-stack.ts`; store each selected `{id, status}` in the profile JSONB. Start the existing empty profile with HTML, CSS, and PHP marked as known only when the additive migration sees an empty selection.
- **Reason:** The public stack should show only chosen tools while the admin can mark catalog options as in use or learning, without another package, table, or public asset dependency.
- **Trade-off:** Adding/removing catalog choices is a code change. Legacy free-text skill objects remain readable and removable during transition.
- **Asset source:** Most static SVG marks are from Simple Icons using their brand colors; selected multicolor marks are from Devicon, Microsoft's four-color mark uses its official palette, and Playwright's mark is from its official site. The asset folder records source links and warns that brand-specific usage terms still apply.

## 2026-11-08 — Record exact project completion dates separately from display years

- **Decision:** Add nullable `portfolio_entries.completed_on date`; prefer it in public card/detail metadata and keep the existing year field as a fallback.
- **Reason:** A year does not communicate the month or date a project was completed.
- **Trade-off:** The hosted database must apply the additive migration before completion dates can be saved or displayed. Public reads fall back to the existing year field while an older schema is still deployed.

## 2026-11-07 — Keep the Next.js proxy beside the `src/app` directory

- **Decision:** Place the request interceptor at `src/proxy.ts` because the App Router lives at `src/app`.
- **Reason:** A production HTTP check showed a signed-out `/admin` request reached the route and returned a streamed redirect. After moving the proxy, a fresh build returned an early `307` to the login route with no admin page body.
- **Trade-off:** Moving the application directory requires keeping framework entry files such as `proxy.ts` beside `src/app` so they remain part of the build.

## 2026-11-07 — Keep CMS writes on the user's RLS-protected session

- **Decision:** Admin forms call authenticated Route Handlers that verify `admin_users`; handlers use the cookie-aware publishable-key client and rely on database and Storage RLS. Image uploads use generated UUID paths and five-minute admin preview URLs.
- **Reason:** The owner can maintain all current and future categories without exposing a service-role key or tying CMS behavior to category names.
- **Trade-off:** Entry tag/gallery associations use multiple PostgREST operations; the handler applies compensating restoration if an association update fails, and Storage cleanup failures are returned for retry.

## 2026-11-07 — Keep Supabase session tokens out of browser JavaScript

- **Decision:** Perform sign-in and sign-out in same-origin server Route Handlers and set Supabase SSR cookies as HttpOnly, SameSite=Lax, and Secure in production. CMS forms use the application's own authorized endpoints.
- **Reason:** The project security rules require server-managed sessions that browser scripts cannot read.
- **Trade-off:** CMS authentication depends on the configured site origin and Next.js server cookie handling; no client-side Supabase auth client is used.

## 2026-11-07 — Keep the generic admin seed manual

- **Decision:** Provide `supabase/seed_admin.example.sql` as an opt-in development template that grants membership only to a matching, pre-existing Supabase Auth user. Do not include it in automatic database seeds.
- **Reason:** The owner account must be created through trusted Auth setup, and credentials must never be hard-coded in SQL or committed to the repository.
- **Trade-off:** Initial owner provisioning requires editing the placeholder email and running the SQL manually in the intended Supabase project.

## 2026-11-07 — Keep the database policy boundary inside Postgres

- **Decision:** Use explicit grants and RLS for every portfolio table, with a restricted `private.is_portfolio_admin()` helper to check the trusted admin table. Keep `private` outside the PostgREST exposed schemas.
- **Reason:** Public and signed-in queries share the same publishable key; database policies must enforce draft privacy and admin writes regardless of UI or Route Handler behavior.
- **Trade-off:** The hosted project must apply the migration and seed the owner UUID out of band before admin features can work.

## 2026-11-07 — Seed only empty portfolio structure

- **Decision:** The initial migration creates the placeholder profile, five editable categories, and a private media bucket, but no example projects.
- **Reason:** The site can render a useful starting profile without presenting invented work as the owner’s real portfolio.
- **Trade-off:** Categories are initially suggestions and may be renamed, hidden, reordered, or deleted by the owner.

## 2026-11-07 — Pin patched Zod release

- **Decision:** Use Zod `4.6.7` instead of the initially planned `4.6.5`.
- **Reason:** `npm audit` reported a high-severity memory exhaustion advisory affecting versions below `4.6.6`; `4.6.7` is the available patched release selected by the package audit. The dependency and lockfile now use the patched version.
- **Trade-off:** The validation version differs from the original stack snapshot; `STACK.md` and the lockfile are the source of truth.

## 2026-11-07 — One Next.js application for public site and CMS

- **Decision:** Use one App Router application with public routes, admin routes, and Route Handlers.
- **Reason:** Shared content and design system, one deployment, and one authorization boundary are sufficient for a single-owner portfolio.
- **Trade-off:** Keep public cache rules separate from private admin/session behavior.

## 2026-11-07 — Supabase for Auth, PostgreSQL, and media

- **Decision:** Use Supabase Auth, Postgres, and Storage with RLS; SQL migrations define the schema.
- **Reason:** A single service supplies managed persistence, owner authentication, image storage, and row-level authorization without another ORM.
- **Trade-off:** Policies must be designed and verified carefully; the app must not depend on service-role bypass.

## 2026-11-07 — Categories are rows, not an enum

- **Decision:** Store categories in `portfolio_categories` and reference them by ID.
- **Reason:** The owner needs to add QA automation, funnels, and future portfolio disciplines without code changes.
- **Trade-off:** Category deletion and visibility need explicit validation and public filtering.

## 2026-11-07 — Single owner, invite-only admin

- **Decision:** Support one trusted admin account in v1, tracked in `admin_users`; no public registration or multi-tenancy.
- **Reason:** The request is for a private CMS to maintain one personal portfolio.
- **Trade-off:** Adding collaborators later will require a deliberate role model and policy update.

## 2026-11-07 — Native CSS and system fonts

- **Decision:** Use CSS custom properties, system sans-serif, and Georgia display text without a component or CSS framework.
- **Reason:** The visual direction is restrained and the app has a small component surface; native CSS keeps the stack lean and robust.
- **Trade-off:** Shared component and token discipline must be maintained in project-owned code.

## 2026-11-07 — Pin a stable stack baseline before implementation

- **Decision:** Record exact runtime and core direct dependency versions in `STACK.md`; update only through an explicit compatibility decision.
- **Reason:** The stack file is intended to prevent agents from guessing versions or silently changing technologies.
- **Trade-off:** Re-check releases and compatibility when implementation begins; this document is a baseline, not automatic upgrades.

