# CLAUDE.md

## {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION_ONE_LINE}}

## Companion docs — load when relevant

| File | Read when working on... |
|------|------------------------|
| [PRODUCT.md](./PRODUCT.md) | Features, scope, user-facing decisions, domain terms |
| [DESIGN.md](./DESIGN.md) | UI, styling, design tokens, layout, accessibility (Google Stitch format) |
| [COMPONENT.md](./COMPONENT.md) | Picking, adding, or modifying UI components |
| [CODEMAP.md](./CODEMAP.md) | Navigating the codebase or adding new files/services |
| [STACK.md](./STACK.md) | Understanding the database/auth/framework choices |
| [TESTING.md](./TESTING.md) | Writing or running tests, test case ids |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Hosting, environment variables in production, releasing |
| [CHANGELOG.md](./CHANGELOG.md) | What has shipped; add a line for every user-visible change |

## Tech stack

Next.js 16 | React 19 | TS 5 | Tailwind v4 | shadcn/ui + ReUI | Zustand 5 | TanStack Query/Table | Prisma 6 | Supabase Auth | PostgreSQL

**Next.js 16 differs from older training data.** As `AGENTS.md` says (`next dev` keeps that file
up to date; commit it), read the guide in `node_modules/next/dist/docs/` before using an API you
are unsure about. Differences that matter here:

- **`src/proxy.ts` replaces `middleware.ts`.** The file and its exported function are named
  `proxy`, it always runs on Node.js, and it must sit at the same level as `app/`, so in `src/`.
  A proxy file at the repo root is silently ignored, and every protected page then renders for
  signed-out visitors.
- `params`, `searchParams`, `cookies()` and `headers()` are async.
- `next lint` is gone; `npm run lint` calls the ESLint CLI.
- `next typegen` generates the route types (`PageProps<"/route">`, `LayoutProps`);
  `npm run typecheck` runs it before `tsc`.
- The dev server only serves its assets and HMR to the origins in `allowedDevOrigins`
  (`next.config.ts` allows `localhost` and `127.0.0.1`, which browser tools often use).

## Commands

- `npm run dev` — Dev server with Turbopack
- `npm run build` — Production build (includes Storybook)
- `npm run lint` — ESLint
- `npm run typecheck` — `next typegen` + `tsc --noEmit`
- `npm run test` / `npm run test:watch` — Vitest unit + integration tests (see TESTING.md)
- `npm run storybook` — Storybook dev on port 6006
- `npm run build-storybook` — Build Storybook to `public/storybook/`
- `npx prisma generate` — Regenerate Prisma client
- `npx prisma migrate dev --name <description>` — Create migration
- `npx prisma db seed` — Seed demo org + admin user

Environment variables live in `.env.local` (Next.js) and `prisma/.env` (Prisma CLI) — see `.env.example` for the full list.

## Commit conventions

Every commit message starts with a type prefix. Use the most specific one that applies:

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature or functionality |
| `fix:` | Bug fix |
| `hotfix:` | Urgent production fix |
| `refactor:` | Code restructuring without behavior change |
| `cleanup:` | Remove dead code, unused imports, formatting |
| `docs:` | Documentation (README, CLAUDE.md, CODEMAP.md, etc.) |
| `spec:` | Spec or design document changes |
| `tests:` | Adding or updating tests |
| `task:` | Task/project management file changes |
| `ticket:` | Ticket-related changes |
| `CR:` | Code review feedback changes |
| `chore:` | Config, dependencies, CI, tooling |

Format: `prefix: short description` (lowercase prefix, imperative mood, under 72 chars).

## Update discipline — read before completing any code change

When you add, rename, or remove code, you **must** update the companion docs in the same commit:

- **Added/renamed/removed** a service, action, hook, query, component category, route, or top-level folder → update `CODEMAP.md`
- **Added/renamed/removed a component, or added a new variant** → update `COMPONENT.md`
- **Added** a UI pattern, design token, or styling rule that other code should follow → update `DESIGN.md` (keep YAML front matter and prose body in sync)
- **Changed** the database, auth provider, or major framework version → update `STACK.md`
- **Added or changed** user-visible behaviour → add a test and its case id to `TESTING.md`
- **Changed** hosting, a production environment variable, or the release steps → update `DEPLOYMENT.md` (and `.env.example`)
- **Shipped** anything a user would notice → add a line under `## [Unreleased]` in `CHANGELOG.md`

**PRODUCT.md is user-initiated only.** Do **not** edit `PRODUCT.md` unless the user explicitly asks. Products evolve and the file is intentionally lean — automated rewrites cause drift.

Treat doc updates as part of the change, not an afterthought. The cost of skipping is real: future Claude sessions waste tokens re-discovering structure that the maps should have captured.

### Claude Code skills

Project-level skills live in `.claude/skills/`. They auto-invoke based on their `description` frontmatter.

- `.claude/skills/update-codemap/SKILL.md` — keeps `CODEMAP.md` in sync with the file tree. Triggers on file additions, renames, removals, or when the user asks to "update / refresh / sync CODEMAP".
- `.claude/skills/update-component/SKILL.md` — keeps `COMPONENT.md` in sync with `src/components/`. Triggers on component additions, renames, removals, variant changes, or when the user asks to "update / refresh / sync COMPONENT" or "catalog components".

Add new skills by creating `.claude/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`) plus a markdown body of instructions.

`.claude/settings.json` holds the project's Claude Code permissions: routine npm, git and gh
commands are allowed; reading `.env` files, `rm -rf` and force pushes are denied.

## Verification

Before marking work done:

1. `npm run typecheck` and `npm run lint` pass. The starter still carries 22 known lint errors,
   mostly in ReUI components (tracked in `TODO.md`); add no new ones.
2. `npm run test` passes
3. `npm run build` passes with zero errors
4. The affected screen was opened in a browser (`npm run dev`), signed in and signed out where
   access matters
5. Companion docs reflect the change (per the discipline rule above)
