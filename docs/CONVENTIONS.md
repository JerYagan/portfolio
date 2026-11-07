# Code conventions

## General

- Follow `STACK.md` exactly. Keep TypeScript strict and avoid `any`; use `unknown` at untrusted boundaries and parse it.
- Prefer server components. Add a client boundary only for real browser interactions such as filters, theme selection, or form state.
- Keep modules focused: UI in components, database queries in `lib/data`, schemas in `lib/validation`, authorization in `lib/auth`.
- Do not duplicate route/data rules across pages. Share selectors and validation schemas.
- Avoid premature abstraction; extract repeated patterns after they appear more than once.

## Naming and files

- React component files and components use `PascalCase` (`ProjectCard.tsx`, `ProjectCard`).
- Non-component modules use lowercase kebab-case where a name is needed (`portfolio-data.ts`).
- Functions and variables use `camelCase`; booleans use `is`, `has`, or `can` prefixes.
- Database uses `snake_case` table and column names. API JSON uses `snake_case` only where it mirrors database contract; prefer stable contract names as documented in `API_SPEC.md`.
- Route segments are lowercase and use `[slug]`/`[id]` for dynamic segments.
- Use named exports except for Next.js route/page entry files where framework conventions require a default export.

## Data and HTTP

- Parse all external input with the shared Zod schemas before querying or writing.
- Keep database timestamps in UTC. Format dates for display at the UI edge.
- Use stable UUID IDs internally and slugs for public URLs.
- Public repository functions must explicitly filter published entries and visible categories. Do not rely on RLS alone for product query semantics.
- Map database errors to documented API errors; do not expose raw provider messages.
- Return consistent response envelopes from Route Handlers. Avoid mutation through GET.
- Keep the public anonymous server client separate from the cookie-aware authenticated server client. Never import server modules from client components; browser forms call the app's Route Handlers.

## UI and accessibility

- Use semantic elements (`header`, `nav`, `main`, `article`, `form`, `button`) and one clear `h1` per page.
- Inputs always have labels; errors are connected using `aria-describedby`; success and async feedback are announced appropriately.
- Interactive controls must work by keyboard and show `:focus-visible` styling.
- Use responsive layouts and real content lengths when checking designs; do not make cards depend on hard-coded image dimensions alone.
- Use CSS custom properties for color, spacing, and surface tokens. Respect `prefers-reduced-motion`.
- Meaningful images require authored alt text. Decorative images use empty alt text.

## Formatting

- Use 2 spaces for JSON, YAML, and TypeScript indentation.
- Prefer single quotes in TypeScript and semicolons. Follow the formatter selected at project initialization if one is added, then record it in `STACK.md`.
- Keep lines readable; extract long conditional rendering or validation logic instead of deeply nesting it.
- No secrets, personal credentials, or `.env.local` files in commits.

