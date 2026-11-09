# Product requirements

## Product summary

A personal portfolio site with a public work showcase and a private owner-only content management area. The public site presents websites, graphic design, drawings, QA automation systems, funnels, and future kinds of work with the same reusable category and project-detail system.

## Goals

- Present the owner’s profile, curated technology stack, selected work, and contact paths clearly.
- Let visitors browse and filter a visual portfolio, open a dedicated detail page, and follow a project’s external link where available.
- Let the owner create, categorize, edit, publish, unpublish, reorder, and delete portfolio entries without editing code.
- Let the owner create, edit, reorder, hide, and delete categories. New categories must not require a code deployment.
- Support image thumbnails and ordered detail galleries for visual work, plus optional project metadata and links for software work.
- Deliver a responsive, accessible editorial visual style with light, dark, and system themes.

## Audiences and access

### Public visitor

Unauthenticated. Can read only published profile, visible categories, and published entries. Cannot see drafts, admin routes, or editing controls.

### Owner / administrator

One invited Supabase Auth account, explicitly registered in the `admin_users` table. Can manage the profile, categories, entries, and portfolio media. There is no public sign-up or multi-tenant organization model in this release.

## Public experience

- **Home (`/`)**: a profile-first page with portrait, name, personal headline/biography, location, contact/social links, a curated stack, featured work, up to eight latest published works, and category links. Use an honest, conversational fallback when the owner has not filled in their own copy.
- **Work index (`/work`)**: all published entries, category filters, and clear empty states. Cards show thumbnail, title, category, short description, and optional completion date (or year when no date is supplied).
- **Category view (`/work/category/[slug]`)**: entries for one visible category; unknown/hidden categories return not found.
- **Entry detail (`/work/[slug]`)**: standard entries show title, category, summary, cover image, long-form case-study content, optional ordered case-study sections, a dedicated Website pages group for labeled full-page desktop/tablet/mobile screenshots, Pinterest-style masonry gallery, completion date (or year), optional project progress (completed or in progress), role, selected catalog tools with local brand-color logos, additional project tags, and external project link. Screenshot previews open an accessible full-screen viewer with the original image at page width and vertical scrolling; it contains only the image and viewer controls, not an iframe or browser mockup. Logofolio entries show category/title/summary, a full-width presentation-board image independent of gallery order, then separate masonry galleries for logo variations and supporting images. Completion details, project progress, narrative, case-study sections, tools, and tags are grouped in a compact responsive project-information panel after the galleries. Both gallery layouts preserve each image's full aspect ratio and open an accessible image-only preview modal. Hide absent optional fields rather than showing empty labels.
- **About (`/about`)**: full owner profile, current stacks/skills, and contact/social paths.
- **Theme**: user can choose light, dark, or system preference. Persist an explicit choice locally; do not require an account.
- **Not found**: a designed 404 page with a route back to the work index.

Content must be sourced from the database. If the profile or portfolio is not yet populated, show a calm empty state and editable placeholders in the CMS. Do not claim that sample content is real work.

Initial empty categories may include **Websites**, **Graphic Design**, **Drawings**, **QA Automation**, and **Funnels**. These are starter records only; the owner can rename, hide, reorder, add, or delete categories at any time, subject to the rule that a category with assigned entries must be emptied first.

## Private CMS experience

- Login is invite-only; there is no public registration route.
- Admin layout has navigation for overview, entries, categories, and profile/settings, with a sign-out action.
- Overview shows counts and a short list of recently updated entries.
- Entry editor supports title, slug, summary, standard/logofolio presentation, detail markdown, up to 12 optional ordered case-study sections with suggested or custom headings and Markdown bodies, category, draft/published state, completed/in-progress project status, featured flag, sort order, year, completion date, role, client label, searchable catalog tool selection, additional free-form tags, project/repository links, thumbnail, alt text, and an ordered media gallery. Every gallery image has a selectable presentation-board, logo-variation, supporting-image, or website-page-screenshot role. Website page screenshots require a page name and device label. Only one board can be selected; reorder controls stay within each role.
- For an existing saved entry, the owner can open a private preview in a new tab. It uses the public detail layout for both standard and logofolio entries and may render saved drafts only after server-side owner authorization.
- Category editor supports name, slug, description, visibility, and sort order. It must support arbitrary future disciplines.
- Profile editor supports display name, headline, biography, location, public email/contact URL, avatar, a searchable and grouped technology catalog with local logos and “I use this” / “I’m learning this” status, and social links. Start with HTML, CSS, and PHP marked as current; keep additional catalog choices available without showing them by default.
- Media is uploaded to the configured Supabase Storage bucket. Enforce an explicit accepted image format and size limit in `SECURITY.md`.
- Deletion has a confirmation step. A category with assigned entries cannot be deleted until entries are reassigned or removed.
- After a successful mutation, the owner sees a success state and public cached pages are revalidated where relevant.
- Validation errors are attached to fields where possible; failed saves preserve the user's input.

## Non-functional requirements

- Responsive from 320 CSS pixels through desktop widths. Public navigation has an accessible mobile menu and hides while scrolling down, then returns while scrolling up on both mobile and desktop.
- Keyboard-operable navigation, filters, forms, theme toggle, and dialogs; visible focus states; labels and useful error text.
- Respect `prefers-reduced-motion` and maintain readable contrast in both themes.
- Public pages should be server-rendered for shareable URLs and search indexing. Use descriptive metadata and social preview metadata for public entry pages.
- Public data access must not return drafts. CMS reads/writes must be authenticated and authorized.
- Provide meaningful loading, empty, error, and not-found states.

## Acceptance criteria

1. A visitor can view the owner profile and browse published work across dynamically created categories.
2. A visitor can open an individual entry and view its summary, details, media, category, and any supplied metadata.
3. Switching between light, dark, and system theme works across public and admin screens, and an explicit selection persists.
4. A signed-out visitor cannot read or mutate admin-only data. Draft entries are inaccessible via public pages and public API routes.
5. The owner can create, edit, publish/unpublish, and delete entries; edit their category and display order; and manage their thumbnail and gallery.
6. The owner can add a new category and assign entries to it without a code change.
7. The owner can update profile and stack information without editing code.
8. Forms report validation and server errors clearly and retain unsaved input after a failed request.
9. Public pages and CMS are usable on mobile, keyboard-only navigation, and reduced-motion settings.
10. The home page reads as the owner's profile and can feature published entries selected in the CMS; projects can show an exact completion date.
11. The profile editor can select technologies from a maintained catalog, classify each as in-use or learning, and display local technology marks on the public site.
12. The profile landing page shows no more than eight latest published works; the detail gallery keeps image ratios intact and opens images in a modal dismissed by Escape or by clicking outside the image.
13. The owner can preview a saved draft with the public detail layout while signed out visitors, non-admins, public APIs, and crawlers cannot access or index the draft.
14. The owner can add, edit, remove, and reorder up to 12 optional case-study sections; public details preserve the summary introduction and omit sections without body content.

## Out of scope for the first release

- Multiple owners, tenant workspaces, public author accounts, and role hierarchies.
- Visitor comments, likes, ratings, analytics dashboards, and lead-management CRM.
- Rich collaborative editing, arbitrary plugins, and per-category bespoke page templates.
- A built-in funnel builder or QA automation runner. Those systems can be presented as portfolio entries; this CMS stores their descriptions, media, and links only.
- Automatic import of projects from external services.

