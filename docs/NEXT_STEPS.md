# Next steps

This checklist continues from the current implementation. The immediate blocker is that the Supabase project queried by the local app does not have the `completed_on` and `presentation` entry columns. A clean local server reload and the additive migrations are needed to finish verification and use logofolio entries.

## 1. Reload and verify the local app

- [ ] Stop and restart the local Next.js development server so it loads the latest schema-fallback changes.
- [ ] Open `/` and confirm the page renders without the `PortfolioDataError` screen.
- [ ] Open `/api/portfolio/entries` and confirm it returns a successful JSON response, including an empty list when there is no published work.
- [ ] If either request still fails, inspect the local Next.js server log for the development-only `[portfolio-data]` diagnostic and resolve the reported Supabase read error before continuing.

## 2. Bring Supabase up to date

In the Supabase project connected to `.env.local`, inspect the `public.portfolio_entries` columns. Apply any missing migration using the Supabase SQL Editor, in timestamp order:

1. `supabase/migrations/20261108010000_profile_tech_and_entry_completion.sql`
2. `supabase/migrations/20261108020000_entry_presentation_layout.sql`

Confirm that `completed_on` and `presentation` exist afterward. Do not run these migrations against a different project by mistake. Keep the code's backward-compatible `standard` fallback for older schemas.

## 3. Create and review a logofolio entry

- [ ] Add or choose a portfolio category for logofolios in the CMS. Category names remain editable and do not control the entry layout.
- [ ] Create an entry and set **Project presentation** to **Logofolio**.
- [ ] Set a thumbnail for the work card, then upload the tall presentation board first in the ordered gallery and upload logo variations after it.
- [ ] Select the tools used and enter the year, short description, and alt text for each image.
- [ ] Save as a draft first. Review the public layout with a real entry before publishing it.
- [ ] Confirm the title/category/year, full-height board, colored tool marks, masonry logo gallery, image-only modal, plain close icon, and outside-click/Escape dismissal.

## 4. Finish public and CMS acceptance

- [ ] Check the logofolio and standard project detail pages on desktop and narrow mobile screens.
- [ ] Check light, dark, and system themes, keyboard navigation, visible focus, and reduced-motion behavior.
- [ ] Confirm the entries API and public pages include published work only; confirm drafts stay private.
- [ ] Verify the signed-out admin redirect and tool search/selection in the CMS.
- [ ] Update `docs/PLAN.md` with actual results; leave anything not manually checked unchecked.

## 5. Prepare deployment when project details are ready

- [ ] Choose the Git repository, production branch, domain, Preview database, and backup/restore plan.
- [ ] Follow `docs/DEPLOYMENT_VERCEL.md` to configure separate Preview and Production variables, Supabase redirect URLs, and a Preview deployment.
- [ ] Complete the production checks and restore drill before launch. Do not use production data for destructive verification.
