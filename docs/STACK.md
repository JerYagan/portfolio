# Stack and version baseline

This is the anti-hallucination file. Use these technologies and exact versions when implementation starts. Versions were checked on **2026-11-07**. Direct packages must be pinned exactly (no `^`, `~`, or `latest`) and committed in a lockfile. Re-check package availability and compatibility before the first install; if a change is needed, update this file and `DECISIONS.md` first.

## Runtime and application

| Area | Choice | Exact version / rule |
|---|---|---|
| Runtime | Node.js LTS | `24.22.2` |
| Package manager | npm | `11.19.1` (bundled with Node.js `24.22.2`) |
| Framework | Next.js App Router | `16.4.5` |
| UI runtime | React | `19.3.1` |
| DOM renderer | React DOM | `19.3.1` |
| Language | TypeScript | `5.9.3` |
| Node.js type definitions | `@types/node` | `24.19.2` |
| React type definitions | `@types/react` | `19.3.0` |
| React DOM type definitions | `@types/react-dom` | `19.3.0` |
| Styling | Native CSS + CSS custom properties | No CSS framework. |
| Validation | Zod | `4.6.7` |
| PDF rendering | PDF.js (`pdfjs-dist`) | `6.5.438`; render document pages to canvases so the browser's built-in PDF toolbar is not shown. |

## Data and authentication

| Area | Choice | Exact version / rule |
|---|---|---|
| Database | Supabase hosted PostgreSQL | Managed service; schema changes are SQL migrations in this repository. The checked-in local Supabase config uses PostgreSQL 17; confirm the hosted project's major version before applying migrations. |
| Authentication | Supabase Auth | Invite-only email/password account for the single owner; session stored in secure cookies via the SSR integration. |
| JavaScript SDK | `@supabase/supabase-js` | `2.119.0` |
| Next.js SSR helpers | `@supabase/ssr` | `0.12.7` |
| Media storage | Supabase Storage | Private `portfolio-media` bucket. Public pages receive short-lived signed URLs only for objects referenced by published content. |
| Supabase CLI | `supabase` | `3.0.0` (development dependency, pinned in `package.json`). |

Use PostgreSQL through Supabase's SDK and RLS-backed API for application reads and writes. SQL migrations remain the canonical schema definition. Do not add Prisma or another ORM in the first release.

## Test and quality approach

- Use Node's built-in `node:test` runner for isolated pure functions; it comes with the pinned Node runtime and adds no package dependency.
- Use browser-driven checks for critical public/admin journeys when implementation is ready. Select and pin a browser test package in `STACK.md` before adding it; no browser test dependency is approved by this baseline yet.
- No component library, icon library, animation library, or third-party theme package is selected. Use accessible semantic HTML, small project-owned components, CSS tokens, and inline SVG icons only when needed.
- PDF.js is the only approved document-rendering dependency; pin its exact version and keep the worker bundled with the app.

## Version references

- [Node.js release schedule and current LTS downloads](https://nodejs.org/en/download)
- [Node.js 24.22.2 archive entry, including its bundled npm version](https://nodejs.org/en/download/archive/v24.22.2)
- [Next.js package and releases](https://www.npmjs.com/package/next)
- [Next.js support policy](https://nextjs.org/support-policy)
- [React versions](https://react.dev/versions)
- [TypeScript 5.9 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)
- [Zod package](https://www.npmjs.com/package/zod)
- [Zod memory exhaustion advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [Node type definitions](https://www.npmjs.com/package/@types/node)
- [React type definitions](https://www.npmjs.com/package/@types/react)
- [React DOM type definitions](https://www.npmjs.com/package/@types/react-dom)
- [Supabase SSR package](https://www.npmjs.com/package/@supabase/ssr)
- [Supabase JavaScript package](https://www.npmjs.com/package/@supabase/supabase-js)
- [Supabase SSR guide for Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

## Constraints

- Next.js 16 uses `proxy.ts` for request interception; do not copy the older `middleware.ts` filename from Next 15 examples.
- Use the Supabase SSR server client and Next.js 16 Proxy to refresh HttpOnly cookie sessions. Admin sign-in/out and data operations run through same-origin server Route Handlers; do not add a browser auth client unless a future requirement needs direct user-scoped browser queries and records the cookie implications.
- Do not upgrade major/minor versions opportunistically during feature work. A planned update is a separate decision with compatibility review and a lockfile update.
- Direct dependencies are installed and pinned in `package.json` and `package-lock.json` for Phase 1.

