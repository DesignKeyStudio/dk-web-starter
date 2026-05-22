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

## Tech stack

Next.js 16 | React 19 | TS 5 | Tailwind v4 | shadcn/ui + ReUI | Zustand 5 | TanStack Query/Table | Prisma 6 | Supabase Auth | PostgreSQL

## Commands

- `npm run dev` — Dev server with Turbopack
- `npm run build` — Production build (includes Storybook)
- `npm run lint` — ESLint
- `npm run storybook` — Storybook dev on port 6006
- `npm run build-storybook` — Build Storybook to `public/storybook/`
- `npx prisma generate` — Regenerate Prisma client
- `npx prisma migrate dev --name <description>` — Create migration
- `npx prisma db seed` — Seed demo org + admin user

Environment variables live in `.env` — see `.env.example` for the full list.

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

**PRODUCT.md is user-initiated only.** Do **not** edit `PRODUCT.md` unless the user explicitly asks. Products evolve and the file is intentionally lean — automated rewrites cause drift.

Treat doc updates as part of the change, not an afterthought. The cost of skipping is real: future Claude sessions waste tokens re-discovering structure that the maps should have captured.

### Claude Code skills

Project-level skills live in `.claude/skills/`. They auto-invoke based on their `description` frontmatter.

- `.claude/skills/update-codemap/SKILL.md` — keeps `CODEMAP.md` in sync with the file tree. Triggers on file additions, renames, removals, or when the user asks to "update / refresh / sync CODEMAP".
- `.claude/skills/update-component/SKILL.md` — keeps `COMPONENT.md` in sync with `src/components/`. Triggers on component additions, renames, removals, variant changes, or when the user asks to "update / refresh / sync COMPONENT" or "catalog components".

Add new skills by creating `.claude/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`) plus a markdown body of instructions.

## Verification

Before marking work done:

1. `npm run build` passes with zero errors
2. Affected code path works in dev (`npm run dev`)
3. Companion docs reflect the change (per the discipline rule above)
