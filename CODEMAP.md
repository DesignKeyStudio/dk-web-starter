# CODEMAP.md

> Project structure map, optimized for AI agents and humans navigating this codebase.
> **Update this file in the same commit that adds, renames, or removes services, actions, hooks, queries, component categories, routes, or top-level folders.** Without this, the map rots and future Claude sessions waste tokens re-discovering structure.
>
> Companion docs: [CLAUDE.md](./CLAUDE.md) · [COMPONENT.md](./COMPONENT.md) (UI components catalog) · [DESIGN.md](./DESIGN.md) · [STACK.md](./STACK.md)

## Where to add what

| If you're adding... | Put it in... | Notes |
|---------------------|--------------|-------|
| New data model | `prisma/schema.prisma` | Run `npx prisma migrate dev --name <description>` after |
| New business logic | `src/lib/services/<entity>-service.ts` | Pure Prisma; takes `organizationId`/`userId` as explicit params |
| Server Action wrapper | `src/lib/actions/queries.ts` or `mutations.ts` | Thin wrapper, calls `getAuthContext()` then delegates to service |
| React Query hook | `src/lib/queries/hooks.ts` + key in `keys.ts` | Wraps the server action |
| Permission entry | `src/lib/constants/permissions.ts` | Add to `DEFAULT_PERMISSIONS` and `ROLE_DEFINITIONS` |
| Sidebar nav item | `src/lib/sidebar-nav.ts` | Configure label, icon, route, permission |
| New protected page | `src/app/(platform)/<route>/page.tsx` | Wire to sidebar nav above |
| New public page | `src/app/(auth)/<route>/page.tsx` | Add to middleware allow-list if needed |
| New UI primitive | `src/components/ui/` (shadcn) or `src/components/reui/` (ReUI) | Don't edit existing primitives. Add entry to `COMPONENT.md` |
| Generic app component | `src/components/custom/` | e.g., KpiCard, PageHeader. Add entry to `COMPONENT.md` |
| Layout chrome | `src/components/layout/` | e.g., AppSidebar, AppHeader. Add entry to `COMPONENT.md` |
| Zod validation schema | `src/lib/validations/<context>.ts` | Used by React Hook Form |
| Brand/styling token | `src/lib/brand.ts` or `src/app/globals.css` | Also document in DESIGN.md |

## Project tree

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

## Architecture: three-layer (Services → Actions → UI)

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
- **Adding a new data operation**: write logic in a service file first, then add a thin wrapper in actions, then a React Query hook.

## React Query (server data)

- Hooks in `src/lib/queries/hooks.ts` wrap `src/lib/actions/queries.ts` server actions
- All hooks are always enabled, `staleTime: 5min`
- Mutations in `src/lib/actions/mutations.ts` + `queryClient.invalidateQueries()`

## Zustand (client state)

- Auth store only: currentUserId, users, roles, permissions, hasPermission()
- Persists to sessionStorage with `lp-auth-store` key
- **Never select store methods as selectors** — use computed selectors instead

## Auth flow

1. **Login** — `supabase.auth.signInWithPassword()` → redirect `/dashboard`
2. **Register** — form → `commitRegistration()` server action → creates org + user + 4 roles atomically → signIn → redirect `/dashboard`
3. **Forgot password** — `resetPasswordForEmail()` → email link → `/reset-password`
4. **Middleware** — `updateSession()` refreshes tokens, guards protected routes

## Database

- **Prisma is the ONLY data layer** — Supabase is used exclusively for `supabase.auth.*`
- **10 base models**: Organization, UserProfile, Department, Permission, Role, RolePermission, UserRole, UserRoleDepartment, Notification, ActivityLog
- **Org-scoping**: `src/lib/actions/auth-context.ts` replaces Supabase RLS at the application level

### Prisma commands

- `npx prisma generate` — regenerate client after schema changes
- `npx prisma migrate dev --name <description>` — create migration
- `npx prisma db seed` — run seed

## Code conventions

- `"use client"` on all interactive components and pages
- Prisma queries use `include` for related data
- camelCase everywhere — Prisma uses `@map` for snake_case DB columns
- Permission checks: `useAuthStore((s) => s.hasPermission)` for UI gating
- Forms: React Hook Form + Zod + shadcn Form components
- All mutations call `insertActivityLog()` via services

## ReUI components

ReUI (https://reui.io) extends shadcn/ui with richer pre-built components.

- **Install**: `npx shadcn@latest add @reui/{component-name}`
- **Location**: `src/components/reui/`
- **Import**: `import { Component } from "@/components/reui/{name}"`
- **Installed**: alert, badge, data-grid, autocomplete, filters, timeline, stepper, date-selector
