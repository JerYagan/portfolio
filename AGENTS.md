# Portfolio project rules

This file is the master instruction set for contributors and coding agents. Read it and the relevant files in `docs/` before changing the application.

## Product and source of truth

- `docs/PRD.md` defines the product scope and acceptance criteria.
- `docs/STACK.md` is authoritative for chosen technologies and pinned versions. Do not silently substitute packages, versions, services, or deployment assumptions.
- `docs/DATA_MODEL.md` is the schema source of truth. Keep SQL migrations, generated types, and application code aligned with it.
- `docs/API_SPEC.md` defines the HTTP contract. Update it whenever a route's behavior or shape changes.
- `docs/DESIGN_SYSTEM.md` owns visual tokens and interaction rules.
- `docs/SECURITY.md` owns authentication, authorization, validation, and secret handling.
- `docs/PLAN.md` tracks implementation progress. Mark work complete only after it is actually implemented.

If documents conflict, follow this precedence: `SECURITY.md` for security, `DATA_MODEL.md` for persisted data, `STACK.md` for supported technology, then `PRD.md` for product behavior. Record lasting architectural choices in `DECISIONS.md` and update affected specs in the same change.

## Product boundaries

- Build a public portfolio and a private, single-owner CMS in one responsive web application.
- Public work is driven by database categories and entries. Do not hard-code category names as an exhaustive enum; the owner must be able to add future disciplines.
- Treat the owner’s name, biography, contact information, links, and project facts as user-supplied content. Do not invent them. Use clearly labeled placeholders until the owner fills them in.
- Draft work and private CMS data must never leak onto public pages or public API responses.
- Keep the public site minimal, editorial, modern, and subtly vintage. Support light, dark, and system themes, keyboard use, reduced motion, and small screens.

## Engineering rules

- Use the exact versions and runtime recorded in `docs/STACK.md`; pin direct dependencies and commit the package-manager lockfile when implementation begins.
- Keep server-only code, credentials, and authorization decisions on the server. Never expose a Supabase secret/service-role key to a browser bundle.
- Enforce authorization in server routes and with database Row Level Security. Hiding an admin link or checking only in `proxy.ts` is not authorization.
- Validate every untrusted route parameter, query, request body, and uploaded file on the server. Return the shapes and status codes in `docs/API_SPEC.md`.
- Use semantic HTML, accessible names, visible focus, sufficient contrast, and descriptive alternative text for meaningful images.
- Keep portfolio category and entry behavior data-driven. Avoid per-category custom code when a configurable category or entry field can express the same need.
- Do not add a dependency or change a pinned version without updating `STACK.md` and explaining the reason in `DECISIONS.md`.
- Do not place secrets in source files. Keep `.env.local` untracked and use `.env.example` only for non-secret names and safe local defaults.

## Change workflow

1. Read the relevant spec files before implementation.
2. Make the smallest coherent change that satisfies the product behavior.
3. Update docs and `PLAN.md` alongside behavior changes.
4. Run only the verification steps requested for the task or required by an applicable project instruction. Report what was and was not verified.


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
