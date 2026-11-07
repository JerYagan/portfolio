# Personal portfolio

A personal portfolio site with a public profile/work showcase and a private owner-only CMS. The implementation status and remaining checks are tracked in `docs/PLAN.md`.

## Local setup

Use the exact runtime and package-manager versions in `docs/STACK.md` (`.nvmrc` is included): Node.js `24.22.2` and npm `11.19.1`.

```powershell
nvm install 24.22.2
nvm use 24.22.2
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`. The Phase 1 starter page works before Supabase is configured. Keep both Supabase variables in `.env.local` blank until there is a Supabase project; when configured, provide both the project URL and publishable key. Never add a service-role key to this application.

## Supabase database

The initial schema was applied to the hosted Supabase project through the Dashboard. SQL migrations in `supabase/migrations/` remain the schema source of truth. Apply later migrations to the intended project through the Dashboard, and use a separate development project for write/RLS checks.

See [Phase 2 Supabase setup](docs/PHASE2_SETUP.md) for the owner account and project notes.

## Owner placeholders

Missing owner biography, contact, socials, portrait, and work details remain editable placeholders. The technology catalog starts with HTML, CSS, and PHP marked as currently used after the additive profile migration; other options remain available to select as they are learned.

## Project guide

- [Product requirements](docs/PRD.md)
- [Stack and pinned versions](docs/STACK.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [API specification](docs/API_SPEC.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Security rules](docs/SECURITY.md)
- [Phase 2 Supabase setup](docs/PHASE2_SETUP.md)
- [Vercel deployment plan](docs/DEPLOYMENT_VERCEL.md)
- [Implementation plan](docs/PLAN.md)

