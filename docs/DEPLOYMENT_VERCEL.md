# Vercel deployment plan

This is a deployment checklist, not a completed deployment. The production domain, Git provider/repository, and Supabase backup plan still need to be chosen. Do not copy `.env.local` into Git or a public issue.

## Current application settings

| Setting | Value |
|---|---|
| Framework | Next.js (App Router, detected by Vercel) |
| Root directory | Repository root (`.`) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Next.js default; leave unset |
| Runtime | Node.js 24.x. Local development is pinned to 24.22.2; Vercel selects a major version and can roll minor/patch updates independently. |
| Docker | Not used |

The Vercel Node selector exposes major versions, not an exact patch. Keep the repository's exact local Node pin and select `24.x` in Vercel to match its major; verify the deployed build/runtime when Vercel settings change. [Vercel Node.js version support](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

## Before connecting a repository

- [ ] Push the project and lockfile to the Git provider you intend to use.
- [ ] Pick which repository branch Vercel should treat as production; do not assume the branch name.
- [ ] Confirm the database migration `20261108010000_profile_tech_and_entry_completion.sql` is applied to the intended Supabase project before deploying this application version.
- [ ] Apply all later pending schema migrations in timestamp order, including `20261108060000_website_page_screenshots.sql`, before saving full-page screenshot media.
- [ ] Decide whether a separate development Supabase project is available for Preview deployments. Do not point untrusted Preview branches at the production database.
- [ ] Choose the production hostname and confirm who controls its DNS.
- [ ] Review the Supabase backup/restore plan and complete the restore drill described in `TESTING.md` before launch.

## Create the Vercel project

1. Import the repository in Vercel and select Next.js as the framework preset if it is not detected automatically.
2. Set the root directory to the repository root. Keep the default Next.js output settings.
3. Select Node.js `24.x` in Project Settings → Build and Deployment.
4. Set the production branch after choosing the intended branch. Vercel creates production deployments from that branch and Preview deployments for other branches. [Git-based deployments](https://vercel.com/docs/git)
5. Set the production and Preview environment values separately, then create a Preview deployment first. Vercel's Local, Preview, and Production environments have separate variable scopes; variables changed after a deployment require a new deployment. [Vercel environments](https://vercel.com/docs/deployments/environments) · [Environment variables](https://vercel.com/docs/environment-variables)

## Environment values

Add these exact names in the Vercel project dashboard. Use the production Supabase URL/key only in the Production scope. For Preview, use a separate development project when available. Preview deployment URLs belong in the Supabase redirect allowlist; never add a service-role/secret key because this application uses the publishable key with RLS.

| Variable | Production value | Preview value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | The final HTTPS site origin, for example `https://portfolio.example.com` | The Preview site's HTTPS URL, if the branch deployment needs profile canonical URLs or auth redirects |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase project URL | Development Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production publishable/anon key | Development publishable/anon key |

These are the only required application variables in `.env.example`. Do not add `SUPABASE_SERVICE_ROLE_KEY` or any Supabase secret key. Vercel provides system variables such as deployment URL and environment name, but the app's canonical origin must still be set explicitly for each environment.

## Supabase Auth URLs

In Supabase Auth → URL Configuration:

- Set the production Site URL to the chosen canonical HTTPS hostname.
- Add that exact production URL to allowed redirects.
- Add localhost for development and a scoped Vercel Preview URL pattern for Preview sign-in if those flows are enabled. Supabase recommends exact production redirect paths and permits a wildcard for preview hosts. [Supabase redirect URL guidance](https://supabase.com/docs/guides/auth/redirect-urls)
- Keep Preview sign-in on the development Supabase project whenever possible; a production admin account should not be used to validate arbitrary Preview builds.

## Preview acceptance checklist

- [ ] The homepage renders once with one `.site-header` and one `.site-footer`.
- [ ] Profile content, local technology icons, featured work, completion dates, categories, and empty states render correctly.
- [ ] `/work`, category pages, and published detail pages load; draft records do not appear in HTML or public API responses.
- [ ] Light, dark, and system themes work at desktop and mobile widths, and reduced-motion preference removes entrance/transition movement.
- [ ] Signed-out `/admin` redirects to login; anonymous admin APIs return `401` and `no-store`.
- [ ] An authorized owner can create/update a draft and publish only after the Preview environment is confirmed to use the intended development database.
- [ ] Browser console, deployment logs, accessibility basics, public metadata, and image alternative text have been reviewed.

Vercel creates a unique URL for each Preview deployment, which is useful for review before changing the production branch. [Preview environments](https://vercel.com/docs/deployments/environments)

## Production launch checklist

- [ ] Confirm the Supabase migration and schema match the checked-in `DATA_MODEL.md`.
- [ ] Enter production variables in the Production environment and trigger a new deployment.
- [ ] Assign the chosen domain to the production deployment and configure its requested DNS records.
- [ ] Set Supabase Site URL and exact allowed production redirect URLs to the canonical HTTPS hostname.
- [ ] Verify the public site, profile, featured entries, media signing, and theme behavior on the production domain.
- [ ] Verify owner login and safe CMS flows; confirm RLS and published-only access against the intended project.
- [ ] Confirm database backup retention and restore procedure with the chosen Supabase plan. Record the date and result of a restore drill in `TESTING.md`.
- [ ] Keep a known-good deployment available for Vercel rollback; a code rollback does not reverse a database migration.

## Deployment and rollback notes

- A failed build should be corrected in a Preview deployment before it reaches the production branch.
- A Vercel rollback restores an application deployment, not a prior Supabase schema or data snapshot. Plan backward-compatible migrations and database restore separately.
- If an environment variable changes, trigger a new deployment so the new value is present.
- Do not deploy until the domain, branch, production environment values, database migration, and backup/restore owner are all known.
