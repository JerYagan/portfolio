# Design system

## Direction

Minimal editorial portfolio with modern spacing and a restrained vintage warmth. Use paper-like surfaces, ink-like text, a muted rust accent, thin rules, quiet metadata, and large image crops. Keep the vintage reference subtle; avoid fake grain that reduces legibility, ornate decoration, or retro display gimmicks.

## Color tokens

### Light theme

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F4F1E8` | Main warm paper background |
| `--color-surface` | `#FBF9F3` | Cards, popovers, form surfaces |
| `--color-text` | `#242522` | Primary text |
| `--color-muted` | `#696A62` | Secondary text and metadata |
| `--color-line` | `#D8D2C5` | Borders and separators |
| `--color-accent` | `#A34E38` | Links, selected states, small emphasis |
| `--color-accent-contrast` | `#FFFFFF` | Text on accent-filled controls |
| `--color-olive` | `#68694F` | Optional secondary accent |
| `--color-focus` | `#315C72` | Keyboard focus ring |

### Dark theme

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#191A18` | Main background |
| `--color-surface` | `#222320` | Cards and form surfaces |
| `--color-text` | `#EEE9DD` | Primary text |
| `--color-muted` | `#B1ADA2` | Secondary text and metadata |
| `--color-line` | `#3B3C36` | Borders and separators |
| `--color-accent` | `#D58A70` | Links and selected states |
| `--color-accent-contrast` | `#211915` | Text on accent-filled controls |
| `--color-olive` | `#A9AA85` | Optional secondary accent |
| `--color-focus` | `#8BC5DF` | Keyboard focus ring |

Always verify text contrast for actual pairings; do not assume an accent works for small text on every surface.

## Typography

- Display/headings: Georgia with system serif fallbacks. Use moderate weight and tight but readable line height.
- Body/UI: system sans-serif stack (`system-ui`, `-apple-system`, `Segoe UI`, sans-serif).
- Metadata/labels: body stack, slightly smaller and optionally uppercase with restrained letter spacing.
- Do not load remote fonts in v1. This keeps rendering reliable and the typography quiet.
- Base body size 16px; supporting text 14–15px; display scale uses `clamp()` for viewport-aware sizing.

## Layout and spacing

- Content max width: 1200px; reading column: 720px; page gutters: 24px mobile, 40px tablet, 64px desktop.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px.
- Use generous vertical rhythm on the public home page and denser spacing in admin forms/tables.
- Portfolio grid: one column on narrow phones, two columns at medium widths, and up to three columns on wide screens. Preserve natural image ratios unless a card art direction explicitly calls for a shared crop.
- Use thin 1px separators, modest corner radius (4–8px), and minimal shadows.

## Core components

- **Brand mark**: use the supplied `/images/SVG/portfolio-logo.svg` in public and admin wordmarks. Browser, Apple, and installed-app icons use the matching files in `/images/favicon_io/`.
- **Site header**: sticky owner wordmark/name, desktop links, accessible theme selector, and a mobile menu. Hide the header as the visitor scrolls down and reveal it on upward scrolling; always reveal it when focused.
- **Project card**: thumbnail, category label, title, concise summary, completion month/year when available or optional year as a fallback; whole-card link with a visible focus state.
- **Profile landing**: a portrait or calm placeholder in a fixed 3:4 frame, owner-written introduction, contact/social paths, technology marks grouped by tools in use and tools being learned, featured work, and up to eight latest published entries. Show up to eight tools per group initially and provide an accessible “See all” / “Show less” toggle when the group is longer.
- **Category filter**: clear selected state and a usable mobile layout.
- **Home categories**: place the heading and short introduction across the top, then show database-driven category cards in a full-width three-column desktop grid that collapses for smaller screens. Preserve category order, optional descriptions, and clear link affordances.
- **Home contact**: place the invitation across the top and the primary contact/social cards in a full-width row below. Use local brand marks for known platforms and simple inline marks for email or custom websites.
- **Project detail header**: category, title, summary, completion date/year, optional completed/in-progress project status, and other optional metadata; external link shown only when supplied.
- **Website pages**: labeled screenshot previews show the page name and desktop/tablet/mobile capture size. Activating one opens an image-only full-screen dialog with vertical scrolling, a persistent close control, optional previous/next actions, focus containment, Escape handling, and a dark blurred backdrop.
- **Presentation boards**: allow one image or PDF board on any project presentation. Render the full board above the project gallery. PDFs render every page inline with PDF.js and retain a click-to-open full-viewport viewer with vertical document scrolling, a persistent close control, Escape handling, and a dark blurred backdrop. Do not expose the browser's native PDF toolbar.
- **Project details**: long Markdown details initially show a readable excerpt and a “See more” control. Expanding reveals the full detail and changes the control to “Show less”; short descriptions omit the control.
- **Case-study sections**: retain the short summary as the project introduction. Render optional completed sections in their saved order with restrained serif headings and safe Markdown; omit unfinished sections.
- **Project tools**: distinguish selected catalog tools from free-form project tags. Show selected tools in the detail sidebar with their local brand-color marks and readable names; omit either group when empty.
- **Logofolio detail**: use the entry's presentation setting and explicit media roles, not category-name matching or first-image order. Show the optional presentation board at full content width, then the logo-variation and supporting-image masonry galleries, followed by one compact project-information panel. Combine metadata and tools with the project narrative in a balanced responsive layout.
- **Gallery**: a full-width, staggered masonry layout with explicit responsive column containers that preserves full image content and intrinsic aspect ratios. Use four columns on desktop, three below 760px, and two on phones; balance each image into the currently shortest column. Keep gutters compact (10px on phones, 14px elsewhere), image corners softly rounded (9px), and gallery artwork free of borders and shadows. Each image opens alone in an accessible modal with a plain close icon; clicking outside the image or pressing Escape closes it. The page behind the modal is darkened and blurred. PDF presentation-board tiles open the full scrollable document viewer.
- **Admin shell**: persistent side navigation on desktop, compact menu on mobile, clear page title and action placement.
- **Profile contact editor**: keep the primary contact URL and allow up to 20 individually editable social/contact links. Offer Email, LinkedIn, Behance, GitHub, Dribbble, Instagram, YouTube, Website, and custom link options with visible marks.
- **Form controls**: labels, hint/error text, required indicators, pending/success/error states.
- **Case-study editor**: optional ordered fieldsets with a heading input suggesting Context, Approach, Outcome, and Reflection, Markdown body, keyboard-operable move buttons, and a named remove action.
- **Confirm dialog**: deletion title names the object and explains the irreversible action; keyboard focus remains managed.
- **Empty state**: simple explanation and relevant action for admin; calm browse suggestion for public.

## CMS surfaces

- Use the same paper/ink/rust tokens as the public site, with denser spacing and clear panel borders for longer editing tasks.
- The desktop CMS uses a persistent left navigation rail; on narrow screens it becomes a horizontally scrollable row below the account header.
- The profile portrait picker keeps its native file control inside the avatar column; long filenames may clip within the control but must not overlap neighboring fields.
- Keep one clear page title, a visible primary action, and short status feedback near the related form or table.
- Tables scroll horizontally on small screens. Entry editors stack the details and publishing panels when the viewport narrows.
- Destructive actions use a named confirmation and become unavailable while a category still has entries.
- Gallery items expose move-up and move-down buttons with explicit accessible names. Alternative text is required for every image or PDF board before saving.
- Pending upload and cleanup states remain visible until the owner resolves them.
- Existing saved entries expose a **Preview saved version** link in the editor. The preview page reuses the public project layout and adds a restrained paper-surface notice with a return-to-editor link; at mobile widths the notice stacks vertically.

## Theme behavior

- Modes are `light`, `dark`, and `system`; default is `system`.
- Persist explicit selection in `localStorage` under `portfolio-theme`. Before hydration, prevent a visible theme flash with an inline-safe initialization strategy.
- Theme applies consistently to public and admin routes.
- Theme control has an accessible name and reports the selected mode. It is keyboard operable.

## Motion and imagery

- Use a restrained fade-and-rise entrance on the profile and featured work, plus small color/spacing responses on hover. No parallax or auto-playing animation.
- Keep the motion decorative; content remains visible and understandable if animation does not run.
- Disable non-essential motion under `prefers-reduced-motion: reduce`.
- Header movement is limited to a short vertical transition and scroll-direction reveal; do not animate gallery imagery during full-screen viewing.
- The technology catalog is grouped and searchable in the CMS, and each selected tool uses a local SVG brand mark in its brand colors on public profile pages. Preserve multicolor artwork where available and do not apply theme filters that erase brand colors. Project tags use a matching catalog mark when one exists.
- Use local uploaded portfolio images or clearly marked local placeholders. Do not hotlink assets from other sites.
- Use consistent image treatment: unrounded or slightly rounded crops, neutral backgrounds, and no heavy filters over artwork.

