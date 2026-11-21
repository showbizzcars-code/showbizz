# Showbizz Cars

Server-rendered car-rental website foundation for Showbizz Cars. This repository preserves the existing TanStack Start application and prepares its runtime output for a self-hosted Node.js deployment.

> **Status:** Self-hosted authentication, admin CMS (vehicles, enquiries, posts, FAQs, testimonials, settings), S3 image storage adapter, and database migrations are implemented and verified.

## Technology

- React 19 + TypeScript
- TanStack Start / TanStack Router for server-rendered routes
- Vite + Tailwind CSS v4
- Nitro `node-server` output (`.output/server/index.mjs`)
- PostgreSQL for production data; PGlite is the local/preview fallback
- Self-hosted Better Auth with email/password authentication (public sign-up disabled; one-time guarded first-admin setup; additional staff provisioned via CLI)

## Local setup

Prerequisite: Node.js 22.x and npm.

```sh
npm ci
cp .env.example .env
npm run dev
```

The development server defaults to `http://localhost:8080`. The embedded PGlite fallback is intended for local preview only; do not rely on it for production persistence.

## Useful commands

```sh
npm run typecheck   # TypeScript checks
npm run lint        # ESLint
npm test            # automated tests
npm run verify      # typecheck + lint + tests
npm run build       # generate the standalone Node server in .output/
npm start           # run the production Node server
npm run db:migrate  # apply pending SQL migrations when DATABASE_URL is configured
```

The build command deliberately does **not** run database migrations. Run migrations as a separately approved deployment step, not as an incidental side effect of a build.

## Hostinger deployment

See [Hostinger deployment notes](docs/HOSTINGER_DEPLOYMENT.md). For managed Node.js Web App hosting, the client needs a Hostinger Business/Cloud plan with Node.js app support. A GitHub repository can remain private while the production website stays in the client’s Hostinger account.

## Security and launch gates

- Never commit `.env`, database credentials, OAuth client secrets, access tokens, or production dumps.
- Do not enable admin write operations until self-hosted authentication is working and the first staff account has been explicitly granted a role.
- Use a managed PostgreSQL service or a properly managed PostgreSQL instance for production. Do not use in-memory PGlite for live enquiries.
- Configure object storage for car images; local filesystem uploads are not a production storage strategy.
- Establish backups and retention before storing customer contact details.
- Add real company address, phone, WhatsApp, rates, policies and vehicle information only after the client confirms them.

## Project status

The public pages, self-hosted Better Auth authentication, and admin CMS for vehicles, images, enquiries, posts, FAQs, testimonials, and settings are implemented and verified. See `docs/ARCHITECTURE.md` and `docs/HOSTINGER_DEPLOYMENT.md` for deployment procedures.


## First administrator setup (one time)

Public Better Auth sign-up remains disabled. To create the first administrator through the staff login page:

1. Configure `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and `VITE_AUTH_ENABLED=true` for the intended deployment environment.
2. Set `ADMIN_SETUP_TOKEN` to a unique random secret of at least 32 characters in that deployment environment. Never commit or share the token.
3. Open `/admin`. While no administrator exists, the redirect to `/login` displays the initial administrator form. Enter the setup token, administrator name, email, and a password of at least 12 characters.
4. After creation, the account is assigned the `admin` role and the registration form closes automatically. The page returns to the normal sign-in form; sign in with the newly created credentials.
5. Remove `ADMIN_SETUP_TOKEN` from the environment after setup and redeploy. This is defense in depth: the database check already disables registration after an administrator exists.

The initial registration is handled by a server-only action that validates the setup token, validates the input, hashes the password with Better Auth's password hasher, and inserts the user, credential account, and admin role in one database transaction. Simultaneous first-run attempts are serialized and rechecked inside the transaction. Existing sign-in behavior and protected admin routes remain in place.
