# CLAUDE.md

## {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Tech Stack

Next.js 16 | React 19 | TypeScript 5 | Tailwind CSS v4 | shadcn/ui + Radix + ReUI | Zustand 5 | TanStack React Query 5 | TanStack React Table 8 | React Hook Form 7 + Zod 3 | Prisma 6 (ORM) | Supabase (Auth only) | PostgreSQL | date-fns 4 | Lucide icons | next-themes | Inter font

## Commit Conventions

Every commit message must start with a type prefix. Use the most specific one that applies:

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature or functionality |
| `fix:` | Bug fix |
| `hotfix:` | Urgent production fix |
| `refactor:` | Code restructuring without behavior change |
| `cleanup:` | Remove dead code, unused imports, formatting |
| `docs:` | Documentation changes (README, CLAUDE.md, comments) |
| `spec:` | Spec or design document changes |
| `tests:` | Adding or updating tests |
| `task:` | Task/project management file changes |
| `ticket:` | Ticket-related changes (bug reports, issue tracking) |
| `CR:` | Code review feedback changes |
| `chore:` | Config, dependencies, CI, tooling |

Format: `prefix: short description` (lowercase prefix, imperative mood, under 72 chars)

## Commands

- `npm run dev` — Dev server with Turbopack
- `npm run build` — Production build (includes Storybook)
- `npm run lint` — ESLint
- `npm run storybook` — Storybook dev on port 6006
- `npm run build-storybook` — Build Storybook to `public/storybook/`
- `npx prisma db seed` — Seed demo org + admin user
- `bash setup.sh` — Initial project setup wizard

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root: ThemeProvider → ReactQueryProvider → TooltipProvider
│   ├── page.tsx                      # Server Component: session check → redirect
│   ├── (auth)/                       # Public routes (no sidebar)
│   │   ├── login/page.tsx            # Supabase signInWithPassword
│   │   ├── register/page.tsx         # Org + user registration
│   │   ├── forgot-password/page.tsx  # resetPasswordForEmail
│   │   └── reset-password/page.tsx   # updateUser password
│   ├── (platform)/                   # Protected routes (sidebar + header)
│   │   ├── layout.tsx                # Server: getPlatformServerUser()
│   │   ├── platform-layout-client.tsx # Client: bootstrap + SidebarProvider
│   │   ├── dashboard/page.tsx        # Placeholder KPI cards (replace with your domain)
│   │   ├── notifications/page.tsx    # Notification list
│   │   └── settings/                 # Account, Organization, Users, Roles, Departments, Activity Log, Billing, Integrations
│   ├── actions/auth.ts               # Server Action: commitRegistration
│   └── auth/callback/route.ts        # Supabase auth callback
├── components/
│   ├── ui/                           # shadcn/ui primitives (do not edit)
│   ├── reui/                         # ReUI components (data-grid, badge, filters, timeline, etc.)
│   ├── custom/                       # Generic app components (KpiCard, PageHeader, etc.)
│   ├── layout/                       # AppSidebar, AppHeader, HeaderUserMenu, HeaderOrgMenu
│   └── data-table/                   # DataTable + SortableHeader + ColumnVisibility
├── hooks/
│   ├── use-app-header.ts             # Header state + theme
│   └── use-mobile.ts                 # Responsive breakpoint
├── lib/
│   ├── queries/                      # React Query layer
│   │   ├── hooks.ts                  # Query hooks
│   │   ├── keys.ts                   # Query key constants
│   │   └── provider.tsx              # QueryClientProvider (5min stale, 1 retry)
│   ├── services/                     # Pure business logic (no Next.js, no Supabase)
│   │   ├── settings-service.ts       # Departments CRUD
│   │   ├── notification-service.ts   # Notifications CRUD + mark read
│   │   └── user-service.ts           # Users, orgs, roles, user roles, permissions, activity
│   ├── actions/                      # Server Actions (thin auth wrappers → services)
│   │   ├── auth-context.ts           # getAuthContext() — org-scoping (replaces RLS)
│   │   ├── queries.ts                # Auth wrapper → services (fetch functions)
│   │   ├── mutations.ts              # Auth wrapper → services (mutations)
│   │   └── mappers.ts                # Date/Decimal/junction-to-ID helpers
│   ├── supabase/                     # Supabase Auth only
│   │   ├── client.ts                 # Browser client (auth)
│   │   ├── server.ts                 # Server client (auth cookies)
│   │   ├── admin.ts                  # Service role (auth admin ops)
│   │   ├── middleware.ts             # Session refresh + route guards
│   │   └── server-user.ts            # getPlatformServerUser()
│   ├── stores/                       # Zustand stores (sessionStorage persist)
│   │   ├── index.ts                  # Store exports
│   │   └── auth-store.ts             # Users, orgs, roles, permissions, currentUserId
│   ├── constants/permissions.ts      # DEFAULT_PERMISSIONS, ROLE_DEFINITIONS
│   ├── validations/auth.ts           # Zod schemas for auth forms
│   ├── header/                       # header-auth-actions.ts, header-user-display.ts
│   ├── sidebar-nav.ts                # Navigation items config
│   ├── brand.ts                      # Brand constants (BRAND_PRIMARY, BRAND_GRADIENT)
│   └── utils.ts                      # cn(), formatDate(), getInitials(), slugify(), emailLocalPart()
└── types/index.ts                    # Base entity interfaces
```

```
prisma/
├── schema.prisma                     # 10 base models, 5 enums
└── seed.ts                           # Minimal seed (1 org + admin user + 4 roles)
```

## Data Flow

### Three-Layer Architecture (Services → Actions → UI)

```
UI Components / React Query hooks
        ↓ import from
Server Actions (src/lib/actions/)        ← "use server", auth only
        ↓ delegate to
Services (src/lib/services/)             ← pure Prisma business logic
        ↓
Prisma Client → PostgreSQL
```

- **Services** — Pure business logic. Takes `organizationId`/`userId` as explicit params. Zero Next.js or Supabase imports.
- **Actions** — Thin `"use server"` wrappers. Call `getAuthContext()` for auth, then delegate to services.
- **When adding new data operations**: Write the logic in the service file, then add a thin wrapper in actions.

### React Query (server data)
- Hooks in `src/lib/queries/hooks.ts` wrap `src/lib/actions/queries.ts` server actions
- All hooks are always enabled, `staleTime: 5min`
- Mutations in `src/lib/actions/mutations.ts` + `queryClient.invalidateQueries()`

### Zustand (client state)
- Auth store only: currentUserId, users, roles, permissions, hasPermission()
- Persists to sessionStorage with `lp-auth-store` key
- **Never select store methods as selectors** — use computed selectors instead

## Auth Flow

1. Login: `supabase.auth.signInWithPassword()` → redirect `/dashboard`
2. Register: form → `commitRegistration()` server action → creates org + user + 4 roles atomically → signIn → redirect `/dashboard`
3. Forgot password: `resetPasswordForEmail()` → email link → `/reset-password`
4. Middleware: `updateSession()` refreshes tokens, guards protected routes

## Key Conventions

- **"use client"** on all interactive components and pages
- **Prisma queries use `include`** for related data
- **camelCase everywhere** — Prisma uses `@map` for snake_case DB columns
- **Permission checks** — `useAuthStore((s) => s.hasPermission)` for UI gating
- **Sheet not Dialog** — Side panels use `<Sheet>`, confirmations use `<Dialog>`
- **Form pattern** — React Hook Form + Zod + shadcn Form components
- **Activity logging** — all mutations call `insertActivityLog()` via services
- **Loading states** — mutation buttons show "Saving..."/"Deleting..."/"Creating..." and disable during async

## ReUI Components

ReUI (https://reui.io) extends shadcn/ui with richer pre-built components.

**Install:** `npx shadcn@latest add @reui/{component-name}`
**Location:** `src/components/reui/`
**Import:** `import { Component } from "@/components/reui/{name}"`

**Installed:** alert, badge, data-grid, autocomplete, filters, timeline, stepper, date-selector

## Environment Variables

```
DATABASE_URL                                  # Supabase pooler (port 6543, ?pgbouncer=true)
DIRECT_URL                                    # Supabase direct (port 5432, migrations)
NEXT_PUBLIC_SUPABASE_URL                      # Supabase project URL (auth only)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY  # Anon/publishable key
SUPABASE_SERVICE_ROLE_KEY                     # Service role (admin ops)
```

## Database

- **Prisma is the ONLY data layer** — Supabase is used exclusively for `supabase.auth.*`
- **10 base models**: Organization, UserProfile, Department, Permission, Role, RolePermission, UserRole, UserRoleDepartment, Notification, ActivityLog
- **Org-scoping**: `src/lib/actions/auth-context.ts` replaces Supabase RLS at the application level

### Prisma Commands

- Generate client: `npx prisma generate`
- Create migration: `npx prisma migrate dev --name <description>`
- Seed: `npx prisma db seed`

## Adding Your Domain

See `README.md` for the full step-by-step guide to adding domain features (schema → service → action → query hook → permission → sidebar → page).

## Verification

1. `npm run build` passes with zero errors
2. Login → `/dashboard` shows data from PostgreSQL
3. Register → creates org + user + 4 roles atomically
4. Settings pages all load and function correctly
5. Theme toggle persists across refreshes
