---
appType: {{end-to-end | prototype}}
database: {{supabase | postgres-local | sqlite | in-memory}}
auth: {{supabase | mocked}}
framework: nextjs-16
ormProvider: {{postgresql | sqlite}}
runtime: node-20+
---

# STACK

> Stack choices captured during `INSTALL.md` setup. Update this file when the database, auth provider, or major framework version changes.
>
> Companion docs: [INSTALL.md](./INSTALL.md) (how the choices got made) · [CODEMAP.md](./CODEMAP.md) (where the code lives)

## App type

**{{end-to-end | prototype}}**

- **end-to-end** — production-bound application. Real database, real auth, migrations checked in.
- **prototype** — throwaway demo / spike. In-memory database, mocked auth, no migration files. Faster to iterate; not deployable.

## Database

**{{supabase | postgres-local | sqlite | in-memory}}**

| Choice | What it means | Config files affected |
|--------|---------------|----------------------|
| `supabase` | Hosted Supabase Postgres + pooler. Default. | `.env` (DATABASE_URL, DIRECT_URL), `prisma/schema.prisma` |
| `postgres-local` | Local Postgres instance (Docker or native). | `.env` (DATABASE_URL), `prisma/schema.prisma` (no `directUrl`) |
| `sqlite` | SQLite file at `prisma/dev.db`. | `.env` (DATABASE_URL=`file:./prisma/dev.db`), `prisma/schema.prisma` (`provider = "sqlite"`) |
| `in-memory` | SQLite in-memory (`file::memory:?cache=shared`). Prototype only. | `.env`, schema same as `sqlite` |

## Auth

**{{supabase | mocked}}**

- **supabase** — Supabase Auth via `@supabase/ssr` and `@supabase/supabase-js`. Real users, real sessions, real email flows.
- **mocked** — `PROTOTYPE_MODE=true` activates `src/lib/supabase/client-mock.ts` and `server-mock.ts`. Auto-logs-in a demo user. Login page short-circuits. Only valid for `appType: prototype`.

## Framework versions (at time of setup)

- **Next.js**: 16.x (App Router, Turbopack)
- **React**: 19.x
- **TypeScript**: 5.x
- **Tailwind CSS**: v4 (CSS-first config)
- **shadcn**: 3.x (latest registry)
- **Prisma**: 6.x
- **Node.js**: ≥20 required

When upgrading a major version, update this section and the corresponding entry in `package.json`.

## Configuration

- **Environment variables**: see `.env.example` for the full list. Required keys differ by `database` and `auth` choice.
- **ORM**: Prisma (regardless of database choice). Schema lives in `prisma/schema.prisma`.
- **Migrations**: only for `supabase`, `postgres-local`, and `sqlite`. For `in-memory`, schema is push'd via `prisma db push` at boot.

## Changing the stack later

- **DB swap**: edit `prisma/schema.prisma` provider, update `.env`, run `npx prisma generate` and migrate/push. Update the YAML front matter above.
- **Auth swap**: more involved — see `src/lib/supabase/` for the auth surface. Document the swap in this file and `CODEMAP.md`.
- **Major framework version**: follow upstream migration guide, update `package.json`, update YAML above.
