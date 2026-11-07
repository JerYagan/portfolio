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
- Sign in and sign out through same-origin server Route Handlers using the cookie-aware Supabase SSR client. Keep session cookies `HttpOnly`, `Secure` in production, and `SameSite=Lax` or stricter. Do not give browser JavaScript access to access/refresh tokens or persist them in `localStorage`.
- In Next.js 16, use `proxy.ts` to refresh auth cookies and redirect unauthenticated users away from admin pages for user experience. Independently verify the session and `admin_users` membership in every admin Route Handler and database policy.
- Prevent CSRF for state-changing handlers: accept same-origin requests, validate `Origin` where available, and use cookie SameSite protections. Do not mutate through GET.
- Apply least-privilege Supabase grants and RLS on every table and Storage object. Test anon, authenticated non-admin, and admin policy outcomes before production launch.

## Validation and output safety

- Validate request JSON byte length, URL schemes, slug format, IDs, enum states, and array sizes with Zod on the server. Check admin membership before returning endpoint-specific validation or origin errors.
- Bound user text lengths and reject unknown mutation fields.
- External project and social links allow only `https:`; contact URL may allow `mailto:`. Reject `javascript:`, `data:`, and protocol-relative URLs.
- Render project markdown with the project-owned safe Markdown renderer; raw HTML is rendered as text and link destinations are restricted to `https:`. Do not use `dangerouslySetInnerHTML` on unsanitized content.
- Avoid logging auth cookies, tokens, contact form content, and uploaded binary data.

## File upload policy

- Allow raster images only in v1: JPEG, PNG, WebP, and AVIF. Reject SVG and executable or ambiguous content types.
- Maximum upload size: 8 MiB per image. Validate file extension, declared MIME type, and file signature when practical; never trust the browser-provided content type alone.
- Cap the multipart request envelope at 9 MiB and consume it as a bounded stream before parsing so chunked requests cannot bypass the upload limit.
- Generate object names server-side using UUIDs. Store under `portfolio/`; never accept arbitrary Storage paths from untrusted clients for upload.
- Use a private Storage bucket. Enforce owner-only upload/update/delete in Storage RLS. Permit anon read/signed URL creation only when the object path is referenced by a published entry or public profile. An authenticated admin may read portfolio objects for CMS preview, including draft media. Never create a public object URL for a draft image.
- Public pages generate signed URLs only after the database query confirms publication and visibility. Keep signed URL expiration longer than the response/page cache lifetime, or avoid serving cached responses after link expiry.
- Image dimensions should be bounded to prevent excessive processing; set a maximum of 6000×6000 pixels.
- When an entry or image is deleted, attempt idempotent object cleanup and surface cleanup failures for retry.

## Data protection and operations

- Store no sensitive personal data beyond the owner’s intentionally public profile content and auth account data.
- Keep `.env.local` out of version control. `.env.example` contains names and safe local defaults, never real project keys.
- Configure production redirect URLs and allowed origins in Supabase Auth. Use HTTPS for the deployed site.
- Enable database backups through the chosen Supabase plan and confirm restore steps before launch.
- Review Supabase logs and production dependency security advisories during releases.
- Apply rate limits to login attempts and public search if hosting infrastructure supports it; keep login errors generic.

