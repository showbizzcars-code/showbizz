# Showbizz Cars — architecture

Status of this document: Complete implementation. The website includes public server-rendered pages, a secure self-hosted email/password authentication system using Better Auth, fine-grained staff role permissions (`can(role, action)`), a full Admin CMS CRUD control panel, transactional database operations with vehicle row locking, an S3-compatible SigV4 image storage adapter with magic-byte file validation, and a durable orphan cleanup queue (`pending_storage_cleanup`).

Nothing below invents an address, phone number, fleet, price, or booking rule. Those stay empty in configuration and CMS until the business populates them.

## A. Stack

| Concern | Choice | Why |
| --- | --- | --- |
| UI + SSR | TanStack Start, React 19, TanStack Router | Public pages are server-rendered HTML with per-route titles, descriptions, canonical paths, and JSON-LD. A client-only SPA would be a poor fit for Google Search. |
| Language | TypeScript | Shared validation and row types across routes and server functions. |
| Styling | Tailwind CSS v4 | Tokenized palette in `src/styles.css`. |
| Database | Postgres via `@/lib/db` | Neon when `DATABASE_URL` is injected on deploy. Embedded PGLite when it is not, so the preview can boot. Same SQL. |
| Auth | Better Auth at `/api/auth/*` | Self-hosted email/password authentication. Public registration is disabled (`disableSignUp: true`); staff accounts are provisioned via CLI (`scripts/provision-staff.ts`). |
| Staff rights | `staff_member` table | Session user id and fine-grained permissions (`can(role, action)`) are verified on the server for all admin mutations and reads. |
| Images | Metadata in Postgres, bytes in S3 object storage | SigV4-signed S3 storage adapter supporting AWS S3, Cloudflare R2, MinIO. Fails fast in production if unconfigured. |
| Hosting | Hostinger Node.js Web App (eligible Business/Cloud plan) or a Node.js VPS | Nitro `node-server` output in `.output/`; requires a Node runtime, not static-only hosting. Secrets stay in server environment variables. |

Payments and live inventory sync are out of scope.

## B. Modules

```text
migrations/0001_auth.sql          identity tables (copied, not edited)
migrations/0002_showbizz.sql      catalog, enquiries, content, staff, audit
migrations/0003_admin_cms.sql     administrative indexes and constraints
migrations/0004_storage_cleanup.sql durable queue for failed object deletions
src/routes/                       public pages, staff desk, sitemap, robots, auth
src/components/site/              public shell, vehicle card, enquiry form
src/lib/showbizz/                 validation, SQL, SEO, settings, server functions
src/lib/auth/                     self-hosted Better Auth email/password integration
src/lib/db.ts                     PostgreSQL/PGLite connection and migration bootstrap
```

Public reads live in `sql.ts` and always filter `status = 'published'`. Writes and staff reads live in `content.ts`.

## C. Data and security

Entities: `staff_member`, `vehicle`, `vehicle_image`, `enquiry`, `faq`, `testimonial`, `blog_post`, `site_setting`, `audit_event`, plus Better Auth `user`, `session`, `account`, `verification`.

Availability is a column on `vehicle`: `available`, `unavailable`, or `on_request`, default `unavailable`. No sync job.

The database connection is one privileged server role. Row-level security is not active, because this platform does not hand the app a second restricted role. Compensation:

- The browser never receives `DATABASE_URL` or auth secrets. Only `VITE_` variables can reach the client, and this app does not add any.
- Public server functions use the published-only SQL and do not select enquiry fields.
- `submitEnquiry` is the only public write. It inserts a `new` enquiry, checks a honeypot, and rate-limits by phone and hashed IP. It does not store the raw IP.
- Staff server functions use `authMiddleware`, then look up `staff_member` for that verified user id. Counts are returned only when a role exists. There is no self-grant endpoint.
- Role matrix: editors manage vehicles, questions, testimonials, posts, and enquiry status. Admins also manage settings, staff grants, and enquiry deletion. `can(role, action)` and `requirePermission` enforce these boundaries server-side across all admin functions in `src/lib/showbizz/admin.ts`.
- Settings readers accept only the allowlisted keys and drop non-HTTPS URLs, including `javascript:` URLs.
- Logs pass through `redactFields` so phone, email, and message are not written.

Backups: Neon free plan (checked October 2026) keeps about 6 hours of instant restore history and 1 manual snapshot. That is not a long retention policy. A paid plan or an external dump is required before this holds real customer enquiries in production.

Migrations are append-only files. Applied files are not edited. `npm run build` builds application output only; it does not mutate a database. Run `npm run db:migrate` as an explicitly approved release step when `DATABASE_URL` is set. The local preview applies the same files on startup. No destructive migration has been run.

## D. Routes

Public, server-rendered:

- `/` `/vehicles` `/vehicles/$slug`
- `/blog` `/blog/$slug`
- `/faq` `/testimonials` `/contact`
- `/sitemap.xml` `/robots.txt` (admin, login, and `/api/` disallowed; `/` allowed)

Staff:

- `/login` — staff sign-in form. `noindex`.
- `/admin` — staff management desk for vehicles, image uploads, enquiries, blog posts, FAQs, testimonials, and settings.

## E. External services

| Service | Secret | Cost note (checked October 2026) |
| --- | --- | --- |
| Neon Postgres | `DATABASE_URL`, injected, server-only | Free: 1 GB/project, 100 CU-hours/project/month, scale-to-zero, 6-hour restore. Compute suspension or failed writes follow if those caps are hit. Launch is usage-priced. |
| Better Auth | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Self-hosted email/password authentication. Public registration is disabled (`disableSignUp: true`). Initial staff account is provisioned via CLI (`scripts/provision-staff.ts`). |
| WhatsApp | none until `site_setting.whatsapp_e164` is saved | Click-to-chat only (`wa.me`). No WhatsApp Business API, so no message delivery guarantee. |
| S3 Object Storage | `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL` | AWS SigV4-signed storage adapter in `src/lib/showbizz/storage.server.ts` supporting AWS S3, Cloudflare R2, MinIO. Fails fast in production if unconfigured. Failed image deletions queue orphaned keys in `pending_storage_cleanup` for retry via `npm run db:cleanup-storage`. |
| Transactional email | not chosen | Not connected. Enquiries stay in the database only. |
| Google Search Console / Ads | none in the app | Console is free. Ads would be an external campaign to these URLs. No ad pixel is installed. |

Do not create a `.env` file in this project. Preview sign-in and the embedded database need no local secrets.

## F. Implementation Status vs Deployment Verification

### Fully Implemented in Codebase
- **Self-Hosted Authentication:** Better Auth with email/password authentication (`src/lib/auth/email-password.ts`). Public registration disabled (`disableSignUp: true`). Staff provisioning CLI tool (`scripts/provision-staff.ts`) with interactive masked password input.
- **Admin CMS Panel:** Full management screens (`src/routes/admin/index.tsx`) and transactional server actions (`src/lib/showbizz/admin.ts`) for vehicles, image upload/reordering/deletion, enquiries, blog posts, FAQs, testimonials, and site settings.
- **Role Permissions:** `can(role, action)` and `requirePermission` enforced on every admin action and query server-side.
- **Durable Image Storage & Cleanup Queue:** S3-compatible SigV4 object storage adapter (`src/lib/showbizz/storage.server.ts`) with magic-byte file validation (JPEG, PNG, WebP) and 5MB limit. Failed storage deletions record orphaned keys in `pending_storage_cleanup` table, retried via CLI (`npm run db:cleanup-storage`).
- **Transactional Consistency & Row Locking:** Concurrent vehicle mutations acquire `SELECT ... FOR UPDATE` row locks in Postgres transactions. Image reordering verifies exact image-set matching before committing.
- **Public Website & Search Foundations:** Responsive pages, search/filtering, availability statuses, prefilled WhatsApp links, SEO metadata, sitemap.xml, robots.txt, and JSON-LD schema.

### Awaiting Live Deployment Verification
These items require real host environment credentials and access during client deployment:
1. **Production PostgreSQL Database:** Setting `DATABASE_URL` on Hostinger and applying schema migrations via `npm run db:migrate`.
2. **First Staff Account Provisioning:** Running `node --experimental-strip-types scripts/provision-staff.ts --email=admin@example.com --role=admin` against the live production database.
3. **Live S3 Storage Credentials:** Provisioning an S3/R2 bucket and populating `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `IMAGE_PUBLIC_BASE_URL`.
4. **Custom Domain & HTTPS Setup:** Setting `BETTER_AUTH_URL` to the client's final HTTPS domain on Hostinger.

## G. Risks and operational guidelines

- Staff accounts must be provisioned using `scripts/provision-staff.ts` once `DATABASE_URL` is set up. Public sign-up is disabled by design.
- Enquiry rows in the preview database disappear when that process restarts. Production needs Neon and a backup that outlasts the free-plan history.
- IP rate limits trust `x-forwarded-for` only as far as the host overwrites it. Phone rate limits are the stricter control.
- JSON-LD uses `AutoRental` with whatever contact fields are actually stored. No city is claimed. Local pack ranking needs a real address, hours, and a Google Business Profile, which are not decided.
- Share-card Open Graph tags are injected for the whole site. Per-page titles, descriptions, canonical paths, and JSON-LD are what Google Search reads.
- Blog bodies are stored as text and escaped. A markdown renderer is not installed, on purpose.
- Open: legal name, city, address, phone, WhatsApp, public email, social URLs, currency, rate unit, who the first admin is, whether editors exist, image host, and whether staff should also have email/password.


## Hostinger deployment boundary

The build uses Nitro `node-server` output and starts with `npm start` (`node .output/server/index.mjs`). The client should confirm their Hostinger plan includes Node.js web apps before deployment. The codebase contains implementations for self-hosted staff authentication, the admin CMS control panel, S3 storage integration, and transactional row locking. Production behavior has not been verified on the client's live infrastructure. Launch requires configuring and testing the production database, storage credentials, initial staff account, custom domain/HTTPS, and Hostinger Node.js runtime as detailed in `HOSTINGER_DEPLOYMENT.md`.
