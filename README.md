# DK-Launchpad

A production-grade Next.js SaaS starter template by DesignKey Studio.

## Quick Start

```bash
# 1. Clone or use GitHub template
git clone https://github.com/designkey-studio/dk-launchpad.git my-project
cd my-project

# 2. Run setup wizard (renames project, sets brand colors, installs deps)
bash setup.sh

# 3. Fill in your Supabase credentials in .env.local and prisma/.env

# 4. Run database migration + seed
npx prisma migrate dev --name init
npx prisma db seed

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

Default seed credentials: `admin@example.com` / `AdminPass123!`

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

## Architecture

### Three-Layer Pattern (Services → Actions → UI)

```
UI Components / React Query hooks
        ↓ import from
Server Actions (src/lib/actions/)        ← "use server", auth only
        ↓ delegate to
Services (src/lib/services/)             ← pure Prisma business logic
        ↓
Prisma Client → PostgreSQL
```

- **Services** — pure Prisma business logic, no Next.js imports. Portable to any runtime.
- **Actions** — thin `"use server"` wrappers. Call `getAuthContext()` for auth, delegate to services.
- **UI** — React Query hooks call actions, Zustand stores hold client state.

---

## What's Included

### Auth
- Login (email + password)
- Register (creates org + admin user in one transaction)
- Forgot password / Reset password
- Session management via Supabase Auth + Next.js middleware
- RBAC permission checks via `useAuthStore().hasPermission()`

### Platform Shell
- Collapsible sidebar with permission-gated nav items
- App header (theme toggle, notification bell, user + org menu)
- Dark/light mode (OKLCh tokens, persisted to sessionStorage)
- Bootstrap pattern (Zustand hydrated from DB on first load)

### Settings Pages
- **Account** — user profile, password, theme
- **Organization** — org name, logo, plan
- **Users** — invite, deactivate, assign roles
- **Roles** — create/edit roles, assign permissions
- **Departments** — manage team departments
- **Activity Log** — audit trail
- **Billing** — skeleton (connect your billing provider)
- **Integrations** — skeleton (connect third-party services)

### Components
- All **shadcn/ui** primitives (~47 components)
- All **ReUI** components (data-grid, badge, timeline, stepper, filters, autocomplete, alert, date-selector)
- **DataTable** — sortable headers, column visibility
- **KpiCard**, **PageHeader**, **UserAvatar**, **DetailRow** — generic UI building blocks

---

## Adding Your Domain

When you're ready to add your product's core features:

### 1. Extend the Prisma schema

Add your models to `prisma/schema.prisma`. Follow the patterns in existing models:
- `organizationId` on every tenant model
- `@map("snake_case")` for all fields
- `@@index` on FK columns

```bash
npx prisma migrate dev --name add-subscriptions
npx prisma generate
```

### 2. Add a service

Create `src/lib/services/your-service.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import type { YourType } from "@/types";

export async function findAll(organizationId: string): Promise<YourType[]> {
  const rows = await prisma.yourModel.findMany({ where: { organizationId } });
  return rows.map(toYourType);
}
```

### 3. Add server actions

In `src/lib/actions/queries.ts` and `mutations.ts`:

```typescript
export async function fetchYourThings() {
  const { organizationId } = await getAuthContext();
  return yourService.findAll(organizationId);
}
```

### 4. Add React Query hooks

In `src/lib/queries/keys.ts`:
```typescript
yourThings: ["your-things"] as const,
```

In `src/lib/queries/hooks.ts`:
```typescript
export function useYourThingsQuery() {
  return useQuery({ queryKey: queryKeys.yourThings, queryFn: fetchYourThings });
}
```

### 5. Add permissions

In `src/lib/constants/permissions.ts`, add your groups:
```typescript
{ name: "View", groupName: "YourFeature" },
{ name: "Edit", groupName: "YourFeature" },
```

Update `ROLE_DEFINITIONS` to grant these to appropriate roles.

### 6. Add sidebar nav

In `src/lib/sidebar-nav.ts`:
```typescript
{
  title: "Your Feature",
  href: "/your-feature",
  icon: YourIcon,
  permGroup: "YourFeature",
  permAction: "View",
},
```

### 7. Create pages

Add `src/app/(platform)/your-feature/page.tsx` — use `DataTable` + `useYourThingsQuery()`.

---

## Brand Customization

All design tokens are in `src/app/globals.css`. Look for `/* BRAND: customize */` comments.

The key tokens to change:

```css
/* Primary action color */
--primary: oklch(0.45 0.16 270);   /* hue: 270=indigo, 300=purple, 220=blue */

/* Focus ring */
--ring: oklch(0.45 0.16 270);

/* Sidebar active item highlight */
--sidebar-accent: oklch(0.45 0.16 270);
```

OKLCh format: `oklch(lightness chroma hue)` where lightness=0–1, chroma=0–0.4, hue=0–360.

---

## Commands

```bash
npm run dev           # Dev server (Turbopack)
npm run build         # Production build (prisma generate + storybook + next)
npm run lint          # ESLint
npm run storybook     # Storybook on port 6006
npm run test          # Vitest integration tests
npx prisma db seed    # Seed demo org + admin user
npx prisma studio     # Visual DB browser
```

---

## Environment Variables

See `.env.example` for the full list. You need:
- `DATABASE_URL` — Supabase pooler connection (port 6543)
- `DIRECT_URL` — Supabase direct connection (port 5432)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — Anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key

Both `.env.local` and `prisma/.env` need these values (Prisma reads from `prisma/.env`).

---

## Verification Checklist

1. `npm run build` passes with zero errors
2. Login → `/dashboard` shows data from PostgreSQL
3. Register → creates org + user + 4 roles in one DB transaction
4. Settings → Users, Roles, Departments all functional
5. Theme toggle persists across page refreshes
6. Permission checks: Admin sees all settings, Viewer sees less
