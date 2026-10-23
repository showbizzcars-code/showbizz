# Showbizz Cars

Server-rendered car-rental website foundation for Showbizz Cars. This repository preserves the existing TanStack Start application and prepares its runtime output for a self-hosted Node.js deployment.

> **Status:** Self-hosted authentication, admin CMS (vehicles, enquiries, posts, FAQs, testimonials, settings), S3 image storage adapter, and database migrations are implemented and verified.

## Technology

- React 19 + TypeScript
- TanStack Start / TanStack Router for server-rendered routes
- Vite + Tailwind CSS v4
- Nitro `node-server` output (`.output/server/index.mjs`)
- PostgreSQL for production data; PGlite is the local/preview fallback
- Self-hosted Better Auth with email/password authentication (public sign-up disabled; staff accounts provisioned via CLI)

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
