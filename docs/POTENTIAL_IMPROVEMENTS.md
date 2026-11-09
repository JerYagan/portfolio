# Next portfolio improvements

This document tracks the three prioritized additions and their implementation status.

## 1. Private draft preview — implemented

The CMS now opens the latest saved entry in a private preview route that reuses the public project detail layout.

### Delivered

- `/preview/[id]` validates the entry UUID and verifies the current session and `admin_users` membership before reading the saved entry through the authenticated Supabase client.
- Public and preview routes share the `ProjectDetail` renderer for standard and logofolio layouts.
- The CMS **Preview saved version** link opens a separate tab. It previews the last saved state; unsaved editor changes are not included.
- Preview pages use five-minute admin-signed media URLs, `private, no-store`, and `noindex`/`nofollow`/`noarchive` metadata and headers.
- Signed-out requests return through the existing login page to the validated preview path. Public pages, APIs, and sitemap remain published-only.

### Acceptance criteria

- [x] A signed-out visitor cannot load a preview page.
- [x] An authenticated owner can preview saved entries without changing their publication state.
- [x] Preview layout changes automatically with the public entry layout.
- [x] Private cache and crawler directives are set.

## 2. Explicit logofolio image roles — implemented

Replace the current ordering convention, where the first gallery image is the presentation board, with explicit roles managed in the CMS.

### Delivered

- Add a role for each media item: **Presentation board**, **Logo variation**, or **Supporting image**.
- Added `media_role` with a safe `supporting_image` default, a partial unique index for one board per entry, and a data-preserving migration backfill.
- Added CMS role selection and role-local move controls for saved and newly selected images.
- Rendered the explicit board before tools and separate masonry galleries for logo variations and supporting images.
- Updated Zod validation, API/data-model/design documentation, and a clear `503 MIGRATION_REQUIRED` response until the migration is applied.

### Acceptance criteria

- [x] The selected board is independent of gallery order and only one board can be saved per entry.
- [x] Existing logofolios retain their current appearance after the backfill.
- [x] The CMS makes each image's role clear, allows role changes, and keeps reordering within a role.
- [ ] Apply the migration to the configured Supabase project and verify role changes on a non-production logofolio.

## 3. Reusable case-study sections — implemented

Give project pages optional structured sections for a clearer project story without creating a separate page design for each portfolio category.

### Implementation

- Added optional ordered `case_study_sections` JSON on each entry, capped at 12; each heading is up to 80 characters and each Markdown body up to 8,000 characters.
- Added suggested Context, Approach, Outcome, and Reflection headings while allowing custom headings.
- Added accessible add, edit, remove, and keyboard-operable move controls to the CMS entry editor.
- Rendered completed sections on standard and logofolio public/preview details through the safe Markdown renderer. The existing short summary remains the introduction; incomplete sections are omitted.
- Added the additive schema migration and updated validation, API, data-model, security, architecture, design, and product documentation.

### Acceptance criteria

- [x] Owners can add, edit, remove, and reorder sections without changing the entry category or presentation type.
- [x] Empty/incomplete sections are omitted from public pages.
- [x] Existing projects render unchanged until sections are added.
- [ ] Apply the migration to the configured Supabase project and verify saved sections on a non-production entry.
