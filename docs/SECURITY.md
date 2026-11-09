# Security requirements

## Trust boundaries

- Public visitors are untrusted. Every query string, route segment, request body, and uploaded file is untrusted input.
- Supabase browser keys are publishable credentials and are safe to expose only because Row Level Security is enabled. They do not replace authorization.
- Supabase service-role/secret keys bypass RLS and must not be added to the application environment or client. V1 should not need one.
- The owner account is the only administrator in v1. No tenant or organization boundary is needed.

## Authentication and authorization

- Supabase Auth email/password with account invitation/creation performed out of band by the project owner. Do not implement public sign-up.
- Store the owner UUID in `admin_users`; only trusted project setup can insert it. The application must not provide a way for a user to self-add as admin.
- The optional `supabase/seed_admin.example.sql` template may grant membership only after a trusted operator creates the Auth user; it is manual, contains no password, is not part of automatic seeds, and must not be used with its example address in production.
- `supabase/seed_demo_website.sql` is an explicit manual seed that creates only a clearly labeled draft under the Websites category; run it only in a local/development database after its migration, and never publish it as portfolio work without replacing the example content.
- Sign in and sign out through same-origin server Route Handlers using the cookie-aware Supabase SSR client. Keep session cookies `HttpOnly`, `Secure` in production, and `SameSite=Lax` or stricter. Do not give browser JavaScript access to access/refresh tokens or persist them in `localStorage`.
- In Next.js 16, use `proxy.ts` to refresh auth cookies and redirect unauthenticated users away from admin pages for user experience. Independently verify the session and `admin_users` membership in every admin Route Handler and database policy.
- Prevent CSRF for state-changing handlers: accept same-origin requests, validate `Origin` where available, and use cookie SameSite protections. Do not mutate through GET.
- Apply least-privilege Supabase grants and RLS on every table and Storage object. Test anon, authenticated non-admin, and admin policy outcomes before production launch.

## Private project preview

- `/preview/[id]` is a server-rendered HTML page, not a public API. Validate the ID as a UUID and independently verify the Supabase session and `admin_users` membership before loading any entry data. `proxy.ts` may refresh cookies but is not the authorization boundary.
- Read saved entries through the authenticated user's Supabase SSR client so database RLS remains active. Do not use the anonymous public reader or a service-role key to fetch drafts.
- Sign preview image paths through the admin storage policy with the existing five-minute lifetime. Never expose object paths or create a public URL for draft images.
- Send `Cache-Control: private, no-store, max-age=0, must-revalidate` and `X-Robots-Tag: noindex, nofollow, noarchive`; page metadata must also set robots to noindex. Do not add preview URLs to sitemaps or public entry responses.
- The CMS preview link opens the latest saved entry in a new tab. It must not include a shared secret or accept an arbitrary redirect target. The login return path is restricted to a valid `/preview/<uuid>` path.
- Keep published-only filters unchanged in public pages and APIs. Unknown IDs use the not-found response without exposing whether a draft exists.

## Validation and output safety

- Validate request JSON byte length, URL schemes, slug format, IDs, enum states, and array sizes with Zod on the server. Check admin membership before returning endpoint-specific validation or origin errors.
- Bound user text lengths and reject unknown mutation fields.
- Validate case-study section arrays to at most 12 items, headings to 80 characters, and Markdown bodies to 8,000 characters each; render through the safe Markdown renderer and never interpret raw HTML.
- External project and social links allow only `https:`; contact URL may allow `mailto:`. Reject `javascript:`, `data:`, and protocol-relative URLs.
- Render project markdown with the project-owned safe Markdown renderer; raw HTML is rendered as text and link destinations are restricted to `https:`. Do not use `dangerouslySetInnerHTML` on unsanitized content.
- Avoid logging auth cookies, tokens, contact form content, and uploaded binary data.

## File upload policy

- Allow JPEG, PNG, WebP, and AVIF images, plus PDF documents only as a presentation board. Reject SVG and executable or ambiguous content types.
- Maximum upload size: 15 MiB per file. Validate the declared size and MIME type before issuing a signed upload token, then verify the stored file size and signature on the server before returning a usable preview path. Images must also pass format and dimension checks; PDFs must have a valid PDF header. Never trust browser-provided metadata alone.
- Upload image bytes directly from the authenticated CMS browser to Supabase Storage with a server-issued, path-scoped signed upload token. Keep image bytes out of Next.js Route Handler request bodies because Vercel Functions cap request bodies at 4.5 MB. Ticket creation and finalization requests remain small, same-origin JSON requests.
- Signed upload tokens are bearer capabilities valid for up to two hours. Issue them only after checking the owner session and same-origin request; generate UUID object paths server-side, use `upsert: false`, never log the token, and delete the object if server-side image verification fails.
- Enforce the 15 MiB bucket limit in the SQL migration and local Supabase config. The hosted Supabase project's global Storage file-size limit must also be at least 15 MiB.
- Enforce PDFs only on media rows whose role is `presentation_board`; reject them for avatars, thumbnails, logo variations, supporting images, and website page screenshots. Serve validated PDFs to the client-side PDF.js renderer, not through a native browser PDF viewer.
- PDF byte-range endpoints must verify the public entry is published and its category visible, or require portfolio-admin authorization for a private preview. Stream only the referenced `presentation_board` object and never accept an arbitrary Storage URL from the client.
- Generate object names server-side using UUIDs. Store under `portfolio/`; never accept arbitrary Storage paths from untrusted clients for upload.
- Use a private Storage bucket. Enforce owner-only upload/update/delete in Storage RLS. Permit anon read/signed URL creation only when the object path is referenced by a published entry or public profile. An authenticated admin may read portfolio objects for CMS preview, including draft media. Never create a public object URL for a draft image.
- Public pages generate signed URLs only after the database query confirms publication and visibility. Keep signed URL expiration longer than the response/page cache lifetime, or avoid serving cached responses after link expiry.
- Image dimensions should be bounded to prevent excessive processing; set a maximum of 6000×6000 pixels. This pixel-dimension rule does not apply to PDF pages.
- Full-page website captures use the same validated image upload and private Storage bucket. Their page/device labels are bounded and server-validated; public signed URLs are only created for images attached to published entries.
- When an entry or image is deleted, attempt idempotent object cleanup and surface cleanup failures for retry.

## Data protection and operations

- Store no sensitive personal data beyond the owner’s intentionally public profile content and auth account data.
- Keep `.env.local` out of version control. `.env.example` contains names and safe local defaults, never real project keys.
- Configure production redirect URLs and allowed origins in Supabase Auth. Use HTTPS for the deployed site.
- Enable database backups through the chosen Supabase plan and confirm restore steps before launch.
- Review Supabase logs and production dependency security advisories during releases.
- Apply rate limits to login attempts and public search if hosting infrastructure supports it; keep login errors generic.

