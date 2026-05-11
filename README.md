# dk-web-starter

A production-grade Next.js SaaS starter template by DesignKey Studio.

## Quick start

```bash
# 1. Use as GitHub template, or clone:
git clone https://github.com/DesignKeyStudio/dk-web-starter.git my-project
cd my-project

# 2. Open Claude Code and prompt:
#    "Set up a new project from this starter using INSTALL.md"
#
# Claude will interview you (product info, design preferences) and bootstrap
# everything: fills templates, installs deps, runs migrations, seeds the DB.
```

Prefer manual setup? See [INSTALL.md](./INSTALL.md) — the same playbook, readable as a checklist.

Default seed credentials: `admin@example.com` / `AdminPass123!`

---

## Docs structure

| File | Purpose |
|------|---------|
| [CLAUDE.md](./CLAUDE.md) | Orientation, commands, commit conventions, doc-update discipline |
| [PRODUCT.md](./PRODUCT.md) | What the product is, target user, scope, glossary |
| [DESIGN.md](./DESIGN.md) | Brand, typography, UI patterns, accessibility floor |
| [CODEMAP.md](./CODEMAP.md) | Project tree, architecture, "where to add what" |
| [INSTALL.md](./INSTALL.md) | Claude Code setup playbook (read once, then delete) |

After running setup, `INSTALL.md` and `_defaults/` can be deleted from your downstream project.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 + React 19 + TypeScript 5 |
| Styling | Tailwind CSS v4 + OKLCh design tokens |
| Components | shadcn/ui + ReUI (dual registry) |
| ORM | Prisma 6 + PostgreSQL |
| Auth | Supabase Auth (auth only — data via Prisma) |
| State | Zustand 5 (auth store) |
| Server data | TanStack React Query 5 |
| Tables | TanStack React Table 8 |
| Forms | React Hook Form 7 + Zod 3 |
| Testing | Storybook 10 + Vitest |

---

## What's included

### Auth
- Login (email + password)
- Register (creates org + admin user in one transaction)
- Forgot password / Reset password
- Session management via Supabase Auth + Next.js middleware
- RBAC permission checks via `useAuthStore().hasPermission()`

### Platform shell
- Collapsible sidebar with permission-gated nav items
- App header (theme toggle, notification bell, user + org menu)
- Dark/light mode (OKLCh tokens, persisted to sessionStorage)
- Bootstrap pattern (Zustand hydrated from DB on first load)

### Settings pages
Account, Organization, Users, Roles, Departments, Activity Log, Billing (skeleton), Integrations (skeleton).

### Components
- All **shadcn/ui** primitives (~47 components)
- All **ReUI** components (data-grid, badge, timeline, stepper, filters, autocomplete, alert, date-selector)
- Generic building blocks: DataTable, KpiCard, PageHeader, UserAvatar, DetailRow

---

## Architecture

Three-layer pattern (Services → Actions → UI). See [CODEMAP.md](./CODEMAP.md) for the full tree, layer responsibilities, and the "where to add what" decision table.

```
UI / React Query hooks
        ↓
Server Actions (src/lib/actions/)    ← "use server", auth wrappers
        ↓
Services (src/lib/services/)         ← pure Prisma business logic
        ↓
Prisma → PostgreSQL
```

---

## Brand customization

All design tokens are in `src/app/globals.css`. Look for `/* BRAND: customize */` comments.

Key tokens to change:

```css
--primary: oklch(0.45 0.16 270);        /* hue: 270=indigo, 300=purple, 220=blue */
--ring: oklch(0.45 0.16 270);
--sidebar-accent: oklch(0.45 0.16 270);
```

OKLCh format: `oklch(lightness chroma hue)` where `lightness=0–1`, `chroma=0–0.4`, `hue=0–360`.

Document any brand rules in [DESIGN.md](./DESIGN.md) so the rest of the codebase follows them.

---

## Commands

```bash
npm run dev           # Dev server (Turbopack)
npm run build         # Production build
npm run lint          # ESLint
npm run storybook     # Storybook on port 6006
npm run test          # Vitest integration tests
npx prisma db seed    # Seed demo org + admin user
npx prisma studio     # Visual DB browser
```

---

## Environment variables

See `.env.example` for the full list. Required:

- `DATABASE_URL` — Supabase pooler connection (port 6543, with `?pgbouncer=true`)
- `DIRECT_URL` — Supabase direct connection (port 5432)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Both `.env.local` and `prisma/.env` need these values (Prisma reads from `prisma/.env`).

---

## Verification checklist

1. `npm run build` passes with zero errors
2. Login → `/dashboard` shows data from PostgreSQL
3. Register → creates org + user + 4 roles in one DB transaction
4. Settings pages all functional
5. Theme toggle persists across page refreshes
6. Permission gating works (Admin sees all settings, Viewer sees less)
