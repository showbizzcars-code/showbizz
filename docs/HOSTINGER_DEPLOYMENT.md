# Hostinger deployment notes

## Target

This project is configured to build a standalone Node.js server with Nitro's `node-server` preset. The intended entry file is `.output/server/index.mjs`. It is not a static-only website: server rendering, auth handlers and database operations need a Node.js runtime.

Hostinger’s managed Node.js web-app product is available on eligible Business and Cloud plans. Confirm the client’s actual plan supports Node.js applications before choosing that deployment path. Hostinger’s other product tiers may require a VPS/manual Node.js setup.

## Build settings

For Hostinger's Node.js Web App flow, start with these values (verify them against the project's current build output and the dashboard before the first live release):

- **Runtime:** Node.js 22.x
- **Install command:** `npm ci`
- **Build command:** `npm run build`
- **Start command / entry point:** `npm start` / `node .output/server/index.mjs`
- **Application root:** repository root
- **Expected build output:** `.output/`

If Hostinger’s framework detector does not identify TanStack Start, select its generic “Other”/custom Node.js option and specify the entry point if requested. Do not switch this project to static publishing: it uses server-side routes.

## Environment variables

Set production values in Hostinger's environment-variable UI, never in Git.

- `VITE_AUTH_ENABLED`: set to `true` for production builds to activate self-hosted staff authentication.
- `DATABASE_URL`: connection string for a persistent PostgreSQL database.
- `BETTER_AUTH_URL`: the final HTTPS domain (for example, `https://your-domain.example`).
- `BETTER_AUTH_SECRET`: a randomly generated, unique secret (min 32 characters).
- On Vercel, connect a **public Vercel Blob store** to the project. Vercel injects `BLOB_READ_WRITE_TOKEN`; do not paste it into Git or browser variables.
- `IMAGE_PUBLIC_BASE_URL`: the exact public Blob store origin (for example `https://<store-id>.public.blob.vercel-storage.com`) so stored image paths resolve on public pages.
- For non-Vercel hosting, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and optional `S3_REGION` configure AWS S3, Cloudflare R2, or MinIO instead.

`VITE_` values are compiled into browser assets; never put secrets in a `VITE_` variable. Do not copy example placeholders to production.

## Staff Account Provisioning

Public registration is disabled by default (`disableSignUp: true`). Staff accounts must be provisioned securely via the server CLI script:

```sh
node --experimental-strip-types scripts/provision-staff.ts --email=admin@example.com --role=admin
```

The script will prompt interactively for the password using masked/hidden terminal input. Alternatively, `STAFF_PASSWORD` can be provided in the environment. Passwords are never accepted as command-line flags to prevent shell history and process listing leaks.

## Database, migrations, and storage cleanup

The build no longer runs migrations automatically. This avoids mutating the live database just because a build happens. Before deploying a release that changes the schema, take a backup and run `npm run db:migrate` as a controlled step against the intended database. Verify migration status and public-page behavior afterward. Never point local development at the live database by accident.

### Storage Orphan Cleanup

If an immediate object deletion fails during vehicle image operations, the storage key is recorded in the `pending_storage_cleanup` queue table. Operators can retry pending storage cleanups periodically or on demand using:

```sh
npm run db:cleanup-storage
```

This command retries deletion for pending storage keys, removing records from the queue only after deletion succeeds (or when the object is confirmed absent by the storage provider), and returns exit code 1 if unresolvable failures remain.

## Launch considerations

1. **Staff accounts:** provision the initial admin user using `scripts/provision-staff.ts` once `DATABASE_URL` is set up.
2. **S3 object storage:** configure `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `IMAGE_PUBLIC_BASE_URL` to enable vehicle image uploads.
3. **Backups & retention:** select a database plan with a suitable restore window and automated snapshots.
4. **Business information:** populate business details (WhatsApp number, phone, email, social links, vehicles) via `/admin`.

## Release checklist

- [ ] `npm run verify` passes in a clean Node.js 22 environment.
- [ ] `npm run build` creates `.output/server/index.mjs`.
- [ ] Production environment variables exist only in Hostinger's secret/environment settings.
- [ ] Auth works on the final custom domain; signed-out users cannot read staff counts or enquiries.
- [ ] Migrations were backed up, reviewed and explicitly applied.
- [ ] Website, vehicle routes, enquiry validation, sitemap and robots.txt verified on the temporary Hostinger domain.
- [ ] Domain and HTTPS configured in the client-owned account.
- [ ] Database backup and restore tested.
