# DEPLOYMENT.md

> How a project built from this starter goes live. Update it in the same commit that changes
> hosting, a production environment variable, or the release steps.
>
> Companion docs: [STACK.md](./STACK.md) · [TESTING.md](./TESTING.md) · [CHANGELOG.md](./CHANGELOG.md)

## Default setup: Vercel + Supabase

- **App**: Vercel. It detects Next.js and runs `npm run build` (`prisma generate`, the Storybook
  build, then `next build`). Set the project's Node.js version to 22: the Storybook build skips
  itself below Node 20.19.
- **Database and auth**: one Supabase project per environment (production, plus staging if
  needed). Prisma talks to its Postgres; Supabase is used only for auth.

Self-hosting (Docker, a VM) is possible but not set up; see `TODO.md` (P2, Production readiness).

## Environment variables

Set these in Vercel for each environment. `.env.example` has the formats.

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Supabase pooler, port 6543, `?pgbouncer=true`. On Vercel also append `&connection_limit=1` so serverless functions do not exhaust the pool. |
| `DIRECT_URL` | Direct connection, port 5432. Only used for migrations. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Public. |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret. Server only: never give it a `NEXT_PUBLIC_` name. |

**Never set `NEXT_PUBLIC_PROTOTYPE_MODE` outside local development.** It replaces Supabase Auth with
an always-signed-in demo user, so every visitor would get full access.

## Supabase Auth settings

In the Supabase dashboard, Authentication, URL Configuration:

- **Site URL**: the production domain.
- **Redirect URLs**: `https://<domain>/auth/callback` (password reset and invite emails return
  there), plus the Vercel preview pattern if previews should be able to sign in.

Auth emails use Supabase's default sender until custom SMTP is configured (see `TODO.md`).

## Production checklist

1. Migrations: the starter does not ship any yet (see `TODO.md`, P1). Once `prisma/migrations/`
   exists, run `npx prisma migrate deploy` against `DIRECT_URL` before each release that changes
   the schema.
2. Seed: do not run `npx prisma db seed` against production unless you want the demo org and its
   default admin, whose password is in `prisma/seed.ts`.
3. Create the first real admin by registering through `/register`, which creates the organization
   and an admin user.
4. After the deploy, smoke test: signed out, `/dashboard` redirects to `/login`; sign in reaches
   `/dashboard`; the settings pages load.
5. Add a line to `CHANGELOG.md` for what shipped.

## CI

Only `.github/workflows/cliq-notify.yml` exists today (it posts pushes and PRs to Zoho Cliq once
the `CLIQ_WEBHOOK_TOKEN` secret and `CLIQ_CHANNEL` variable are set). A CI workflow is on the
TODO list; DesignKeyStudio/BuildingLocation's `.github/workflows/ci.yml` is the reference: checks,
then Playwright, then deploy only after a green push to `main`.

## Backups

Backup retention depends on the Supabase plan, and point-in-time recovery is a paid add-on.
Check both per project, decide, and record the choice here.
