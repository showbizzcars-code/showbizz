# Project guidance for coding agents

## Project goal
Build a reliable, server-rendered car-rental website for Showbizz Cars. The customer owns the production Hostinger account. GitHub is for version control and is not the production host.

## Architecture
- React 19, TypeScript, TanStack Start/Router, Vite, Tailwind CSS v4.
- Nitro `node-server` deployment output: `.output/server/index.mjs`.
- PostgreSQL is the production database; embedded PGlite is for local preview only.
- SQL migrations are append-only. Never edit an applied migration; add a new migration.

## Rules
- Inspect the existing implementation before changing it; preserve functioning code.
- Never add credentials, `.env` files, production database exports, or customer data to Git.
- Do not use a `VITE_` variable for secrets; client-side variables are public.
- Do not run production migrations as an automatic build side effect. Review, back up, and apply migrations as an explicit step.
- Admin authorization must be verified on the server on every staff operation. A signed-in user is not automatically a staff member.
- Do not claim auth, storage, integrations, tests, or deployment work until verified.
- Do not invent company contact information, vehicle inventory, prices, policies, reviews, or service areas.
- Implement incrementally, with specific acceptance checks. Avoid broad rewrites and unrelated dependency upgrades.

## Validation
Use Node.js 22.x. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` when the environment permits. Check `docs/HOSTINGER_DEPLOYMENT.md` before changing runtime/deploy settings.

## Known pending work
This is a foundation, not a complete production system. The self-hosted staff-authentication provider must be completed and verified, the admin CRUD interfaces are not all built, and persistent image storage must be implemented before launch.
