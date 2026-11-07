# Phase 2 Supabase setup

The initial schema migration was run in the Supabase Dashboard SQL Editor, as reported by the owner and shown by the successful query screenshot. `.env.local` is present with the public application/Supabase variable names; its values are private and ignored by Git. Read-only checks verified a successful Supabase Auth sign-in, matching membership in `admin_users`, one public profile row, five public categories, and anonymous denial when querying `admin_users`. The temporary test session was signed out. The workspace has no Supabase CLI login or database connection string.

The migration was applied through the Dashboard, so Supabase CLI migration history may not include it. The public URL and publishable key in `.env.local` are not database credentials. Full RLS verification with non-admin users, drafts, writes, and Storage remains pending; do not create disposable records on the project marked Production. Phase 4 now includes server-managed app sign-in and protected CMS routes; verify those against a disposable development project along with the remaining RLS checks. Docker is intentionally out of scope for this setup.

## Reconcile migration history for future CLI use

Do not run the initial migration again. Before a future CLI `db push`, mark the Dashboard-applied migration as applied in CLI history. With Supabase CLI v3, a direct PostgreSQL connection URL does not require CLI account authentication. Keep it private and do not add it to `.env.example` or source control. Set `SUPABASE_DB_URL` in the current PowerShell session to the same project, then run:

```powershell
npm exec -- supabase migration repair 20261107010000 --status applied --yes --remote="$env:SUPABASE_DB_URL"
```

After reconciling, review pending migrations before applying them to a hosted project:

```powershell
npm exec -- supabase db push --dry-run --skip-vault --remote="$env:SUPABASE_DB_URL"
npm exec -- supabase db push --yes --skip-vault --remote="$env:SUPABASE_DB_URL"
```

The migration creates the schema, RLS policies, private media bucket, placeholder profile, and empty starter categories. It inserts no sample portfolio entries. Confirm the URL targets the intended project before running a hosted command.

## Owner account and admin membership

The configured owner account is already verified as a Supabase Auth user with a matching `admin_users` row. The following steps are for a new development project or a replacement owner account.

1. In the Supabase Dashboard, create or invite the owner through **Authentication → Users**. Use the real owner email and a password chosen privately by the owner. Hosted Auth should keep public sign-up disabled.
2. Open `supabase/seed_admin.example.sql` and replace `admin@example.test` with the exact email used for that Auth user.
3. Run the edited SQL in the Dashboard SQL Editor against the same project. The script finds the pre-existing `auth.users` row and inserts its UUID into `public.admin_users`. It is safe to run again for the same account.

The template does not create an Auth account, set a password, or grant admin access to an email without a matching Auth user. It is not included in `supabase/seed.sql` or the automatic reset seed list. Never use the example address or run the template against production.

## Configure the application

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the intended project in the local application environment. Keep database passwords and Supabase secret/service-role keys out of browser-facing variables and source control. `.env.example` should contain only safe names/defaults.

## Verification still required

- Verify draft privacy, authenticated non-admin denial, admin writes, and Storage access with disposable data in a development project.
- Verify app-layer sign-in, signed-out/non-admin rejection, admin writes, and Storage access in a development project.

## References

- [Supabase database migrations](https://supabase.com/docs/guides/local-development/database-migrations)
- [Running Supabase CLI commands against local and hosted projects](https://supabase.com/docs/guides/local-development/local-and-hosted-projects)
- [Supabase migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Private Storage buckets and signed URLs](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
