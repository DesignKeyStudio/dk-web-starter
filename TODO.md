# TODO — dk-web-starter

Prioritized action list derived from [`REVIEW-eyris-comparison.md`](./REVIEW-eyris-comparison.md) and [`REVIEW-multi-agent-addendum.md`](./REVIEW-multi-agent-addendum.md). Each item: estimated impact, estimated effort, and source tag (R# = original review round; A# = sub-agent in the addendum, e.g., A-B for Security pen-audit, A-G for E2E flow audit, A-K for docs accuracy).

> Legend
> · **Impact**: H = high (unblocks something or removes a real risk) · M = medium (notable improvement) · L = low (polish)
> · **Effort**: S = ≤1 day · M = 2–5 days · L = >1 week
> · Items marked **[BLOCKER]** should land before declaring the starter "done".
> · Items marked **[EXPLOITABLE]** are concrete security exploits demonstrated in the multi-agent addendum.

---

## P0 — Security exploits (block production)

- [ ] **[BLOCKER][EXPLOITABLE]** Add a server-side `requirePermission(group, action)` helper invoked at the top of every Server Action in `src/lib/actions/mutations.ts` and `src/app/actions/auth.ts`. _Right now RBAC is enforced client-side only — a Viewer-role user can call `assignUserRole({ userId: self, roleId: <Admin id> })` from the browser console and escalate. This single fix neutralizes ~60% of security findings._  H · M · A-B
- [ ] **[BLOCKER][EXPLOITABLE]** Sign the `lp-org-id` cookie + verify it belongs to the authenticated user on read, OR drop the 24h cache entirely. _An attacker with their own valid session can edit the cookie to a victim org's UUID and read/write that org's data via any Server Action._  H · S · R6 / A-B
- [ ] **[BLOCKER][EXPLOITABLE]** Validate the `next` query parameter at `src/app/auth/callback/route.ts:7`. Reject anything that isn't a single-leading-`/` same-origin path (`!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")`). _Open-redirect phishing pivot from any reset-password email._  H · S · A-A / A-B
- [ ] **[BLOCKER][EXPLOITABLE]** Constrain `UserProfile.homePage` to an allowlist (enum or set) at the schema AND in `updateUserProfile`. _Currently a user can set their own `homePage = "https://evil.com"`; visiting `/` redirects there via `redirect(profile.homePage)`. Second open-redirect path._  H · S · A-B
- [ ] **[BLOCKER][EXPLOITABLE]** In `updateUserProfile`, enforce `id === ctx.userId` unless caller has "Users:Edit" permission. _Currently any authenticated user can overwrite a colleague's `fullName`, `email`, `avatarUrl`, `theme`, or `homePage`._  H · S · A-B
- [ ] **[BLOCKER][EXPLOITABLE]** In `assignUserRole`, verify `Role.organizationId === ctx.organizationId` before creating the UserRole row. _Cross-org `roleId` injection attaches a role from org B to a user in org A._  H · S · A-B
- [ ] **[BLOCKER][EXPLOITABLE]** Add permission check to `createNotification` (or make it system-only). _Any user can spam any other user in their org with arbitrary notification body/title._  H · S · A-B
- [ ] **[BLOCKER][EXPLOITABLE]** Remove `insertActivityLog` as a public Server Action; replace with server-side-only domain emitters. _Caller currently controls `action`, `entityType`, `entityName`, `changes`, `metadata` — auditors can't trust the log; a user can forge `logged_in` events for a colleague._  H · S · A-B
- [ ] **[BLOCKER]** Write `setup.sh` or remove all references (`package.json#scripts.setup`, `.github/TEMPLATE_README.md` lines 10-19). _The "Use this template" → `bash setup.sh` path is dead-on-arrival._  H · S · R1 / A-K
- [ ] **[BLOCKER]** Add a prod-mode prototype guard. `NEXT_PUBLIC_PROTOTYPE_MODE === "true"` + `NODE_ENV === "production"` must throw at boot inside `isPrototypeMode()`. _Otherwise an accidental env (typo, Vercel preview, copy-pasted .env) yields total auth bypass — every request returns `PROTOTYPE_DEMO_USER`._  H · S · R6 / A-B
- [ ] Add Zod parsing at every Server Action boundary in `src/lib/actions/mutations.ts` and `src/app/actions/auth.ts`. Schemas in `src/lib/validations/auth.ts` are client-side-only and bypass-able. Cover: email format, UUID format, enum values, length limits, array bounds. H · M · A-J / A-B
- [ ] Enforce a last-admin guard: refuse to deactivate or downgrade the last admin in an org. _Currently an Admin can change own role to Viewer leaving the org with zero admins._  H · S · A-G
- [ ] Add `requirePermission("Users", "Edit")` gating on `inviteUser`, `deactivateUser`, `bulkDeleteDepartments`, `updateOrganization`. H · S · A-B
- [ ] Validate `email` format server-side in `inviteUser` before calling `supabaseAdmin.auth.admin.inviteUserByEmail` — currently any string flows through. H · S · A-J / A-B
- [ ] Add tenant-isolation regression test in `tests/integration/`. Cover: user A from org X cannot read/write org Y data via any service (use a real second org in the test DB).  H · M · R6 / R13
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` warning to `.env.example`: never commit, never expose client-side.  H · S · R6
- [ ] Add `SECURITY.md` with disclosure contact and process.  M · S · R6
- [ ] Add CSP + security headers to `next.config.ts` (HSTS, X-Content-Type-Options, Referrer-Policy, default-src).  M · S · R6 / A-E
- [ ] Replace the prefix-match in `src/lib/supabase/middleware.ts:54` (`PUBLIC_ROUTES.some(r => pathname.startsWith(r))`) with exact-match. _`/login` matches `/login-backdoor`._  M · S · A-B
- [ ] Generalize/escape the `middleware.ts` matcher: don't exclude `.json|.txt|/storybook` blanket — any future `/api/admin.json` ships unauthenticated.  M · S · A-B
- [ ] Add rate limiting (Upstash `@upstash/ratelimit` or Arcjet) on `/login`, `/register`, `/forgot-password`, `/auth/callback`. _Currently `commitRegistration` spam can exhaust the Prisma connection pool via 30s `$transaction` holds._  H · S · A-B / A-E / A-L
- [ ] Move `AdminPass123!` out of `prisma/seed.ts` to env (`SEED_ADMIN_PASSWORD`); fail loudly in production.  M · S · A-B / A-H
- [ ] Add `secure: process.env.NODE_ENV === "production"` to the `lp-org-id` cookie (even after signing).  L · S · A-B

## P0 — Critical correctness bugs

- [ ] **[BLOCKER]** Replace `prisma.userProfile.update({ where: { id, organizationId } })` at `src/lib/services/user-service.ts:200, 244` and analogous `removeRole`, `deactivateUser` sites. _Prisma `update` requires `where` to identify a unique row; `(id, organizationId)` is not a compound unique → `PrismaClientValidationError` at runtime. Currently every UserProfile update crashes._ Use `updateMany({ where: { id, organizationId } })` or `findFirst` + `update({ where: { id } })`.  H · S · A-A
- [ ] **[BLOCKER]** Distinct React Query keys for `useUsersWithOrgsQuery` and `useUsersSettingsDataQuery` at `src/lib/queries/hooks.ts:25, 96`. _Both currently use `queryKey: queryKeys.usersWithOrgs` but return different shapes → cache corruption + type-shape mismatches + cross-screen refetches._  H · S · A-A
- [ ] **[BLOCKER]** Fix form fields that are silently discarded. `src/app/(platform)/settings/departments/page.tsx:44-46` collects `isActive` but `updateDepartment` only accepts `{ name }`. Same in `users/page.tsx:46-52` for `isActive` and `email`. _Users see "Saved!" but nothing changed._  H · S · A-G
- [ ] **[BLOCKER]** Make role change atomic. `src/app/(platform)/settings/users/page.tsx:134-137` does 3 sequential Server Actions (updateUserProfile → removeUserRole → assignUserRole). Replace with a single `replaceUserRole` Server Action wrapping a Prisma transaction.  H · S · A-G

## P0 — Critical doc & state drift

- [ ] **[BLOCKER]** Reconcile `DESIGN.md` YAML tokens with `src/app/globals.css`. _DESIGN.md uses Material 3 (`primary-container`, `on-primary`, `tertiary`, `surface-variant`); CSS uses shadcn (`primary`, `secondary`, `accent`, `muted`, `destructive`)._ Pick shadcn (already implemented), rewrite the DESIGN.md YAML block to match, update prose to follow.  H · S · R3 / R9
- [ ] **[BLOCKER]** Fix the `client-mock.ts` / `server-mock.ts` filename lie in `INSTALL.md:288` and `STACK.md:39`. _Actual file is `mock-client.ts` (single file). Claude executing INSTALL.md's Path 4 detection at line 219 currently looks for non-existent files and silently downgrades to Path 3 (SQLite end-to-end). Path 4 prototype mode is unreachable as-is._  H · S · A-K
- [ ] **[BLOCKER]** Align INSTALL.md to `.env.local`. INSTALL.md Phase 3 (line 105) says `Copy .env.example → .env` but `prisma/seed.ts:14` loads `.env.local` and README + `.env.example` both say `.env.local`. _Fresh setups hit `Missing NEXT_PUBLIC_SUPABASE_URL` at seed time._  H · S · A-K
- [ ] **[BLOCKER]** Ship companion docs (`CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `STACK.md`) with sensible defaults filled in instead of `{{PLACEHOLDERS}}`. Treat INSTALL.md Phase 2 as *replace*, not *fill*.  H · M · R1 / R9 / A-K
- [ ] **[BLOCKER]** Remove the literal `__PROJECT_NAME__` string rendered at `src/components/layout/app-sidebar.tsx:49`. _Placeholder text ships to the UI as-is._  H · S · A-F
- [ ] Audit `lp-*` identifiers; consolidate into a single `STORAGE_PREFIX` constant + `lp-`-prefixed cookie names. Have INSTALL.md Phase 2 rename it to the project slug.  M · S · R1 / R10 / A-F
- [ ] Fix `CODEMAP.md:90` — claims "10 base models, 5 enums" but the schema has 6 enums. Add the missing files to the project tree (`src/lib/prisma.ts`, `src/lib/csv-utils.ts`, `src/lib/platform-layout-bootstrap.ts`).  L · S · A-K
- [ ] Fix `README.md:77` — claims "~47 components" but actual count in `src/components/ui/` is 31 `.tsx` files (47 includes `.stories.tsx`).  L · S · A-K
- [ ] Correct CLAUDE.md's claim that project-level Claude skills auto-invoke — they require manual `/skill` invocation or system-reminder injection when not bundled in a plugin.  L · S · A-K
- [ ] Update INSTALL.md Phase 2 table to cover all `lp-*` literals AND the `package-lock.json` `"name": "dk-launchpad"` lock.  M · S · R1 / A-K

## P1 — Auth & flow correctness

- [ ] `getAuthContext()` must check `userProfile.isActive` AND `organization.isActive`. _Deactivated users currently keep full Server Action access until Supabase session expires._  H · S · A-G
- [ ] Wire `logLoginEvent` — it's defined in `mutations.ts:29-39` but never called. Add to the post-`signInWithPassword` path on login, register-then-sign-in, and OAuth callback. _Activity log silently misses every login today._  M · S · A-G
- [ ] Replace `getUserRole(editUser.id)` returning only the FIRST UserRole at `users/page.tsx:135` with a proper "list user's roles, replace one specific role" UX. _Currently if a user has multiple roles, edits leak the others._  M · S · A-G
- [ ] Pull header theme toggle through `updateUserProfile({ theme })` so it persists to DB. Currently only the Account page persists; header toggle is forgotten on next login.  M · S · A-G
- [ ] Move Supabase `auth.admin.createUser` INSIDE the Prisma `$transaction` in `commitRegistration` (`src/app/actions/auth.ts:64-73`), OR add a reconciliation job to clean orphan Supabase users.  M · S · A-G
- [ ] Add fall-through error handling in `commitRegistration`'s `prisma.$transaction` — currently `tx.rolePermission.create(...).catch(() => {})` swallows ALL errors, not just unique-constraint violations.  M · S · A-G
- [ ] Add invite-status fields to `UserProfile` (`invitedAt`, `acceptedAt`, `invitationStatus`) OR introduce a separate `Invitation` model with token + expiration + accepted state. _Invited-but-never-clicked users are currently indistinguishable from active members in lists and KPIs._  H · M · A-G / A-H
- [ ] Convert bulk operations to single-transaction Server Actions (`bulkRemoveDepartments` already is; make `bulkDeactivateUsers` atomic; emit a single batched activity-log row).  M · S · A-G

## P1 — AI integration (largest single ROI)

- [ ] **Build a minimal MCP server** at `mcp-server/` matching Eyris's pattern. Tools, in priority order:
  1. `list_components` / `get_component` (parses `src/components/{ui,reui,custom,layout,data-table}/`)
  2. `list_services` / `get_service` (parses `src/lib/services/`, returns method signatures)
  3. `list_prisma_models` / `get_model` (parses `prisma/schema.prisma`)
  4. `list_page_patterns` / `get_pattern` (codified composition patterns — start with 3: CRUD List, Form, Dashboard)
  5. **Write tools**: `scaffold_page` (creates page.tsx + service + action + hook + sidebar-nav entry + CODEMAP/COMPONENT updates), `cleanup_starter` (drop demo pages)
  6. `configure_theme` (update --primary, --ring, --sidebar-accent in globals.css)
  
  H · L · R2
- [ ] Build an `ai-init` script (`npm run ai-init`) that scaffolds rules into Claude, Cursor, Copilot. Use Eyris's `scripts/ai-init/index.mjs` as the reference pattern.  H · M · R2
- [ ] Split `CLAUDE.md` into `.claude/rules/{overview,architecture,components,data,auth,styling,testing}.md` with `@.claude/rules/*.md` imports.  M · M · R2
- [ ] Add a "Try first" prompts block to `README.md` showing 5 example prompts for a new agent (e.g., "Show me how DataTable is composed", "Scaffold a CRUD list page for `Customer`").  M · S · R2
- [ ] Add an "Anti-Patterns — Never Do These" block to whichever rule file covers data fetching. Include: fetch in useEffect, fetch in Zustand store, Axios in Server Component, Zustand for server data.  M · S · R2

## P1 — Schema & data model

- [ ] Add `@unique` to `UserProfile.email`. _Currently DB allows duplicate emails; auth/profile drift possible._  H · S · A-H
- [ ] Add Postgres RLS policies on every org-scoped table (Department, Role, RolePermission, UserRole, UserRoleDepartment, Notification, ActivityLog) keyed on `auth.uid()`. Defense in depth against missed `organizationId` filters.  H · M · A-E / A-L
- [ ] Add missing FK indexes: `Department.{createdBy, updatedBy}`, `Role.{createdBy, updatedBy}`, `UserRole.createdBy`, `Notification.organizationId`, `ActivityLog.userId`. _Postgres doesn't auto-index FKs; cascades and joins do sequential scans._  M · S · A-H
- [ ] Add composite index for activity-log timeline query: `@@index([organizationId, createdAt(sort: Desc)])` on ActivityLog. Currently every dashboard load does a full sort.  M · S · A-H
- [ ] Fix Notification composite index — actual query filters `(organizationId, userId, isRead)` and orders by `createdAt`; current index `@@index([userId, isRead])` doesn't help.  M · S · A-H
- [ ] Add `actorName String?` snapshot column to ActivityLog. _User deletion + `SetNull` currently loses author identity from audit log._  M · S · A-H
- [ ] Add `requestId String?`, `ipAddress String? @db.Inet`, `userAgent String?` to ActivityLog for security forensics.  M · S · A-H
- [ ] Add retention/TTL on Notification + ActivityLog. Partition ActivityLog by month (`PARTITION BY RANGE(created_at)`) or document a delete-after-N-days cron job.  H · M · A-E / A-H
- [ ] Add max length to `Notification.body` (`@db.VarChar(2000)`) — currently unbounded.  L · S · A-H
- [ ] Filter `isActive: true` consistently in `findUsersWithOrgs`, `findRoles`, `findAllDepartments` — or accept an explicit `includeInactive` param. Currently deactivated entities appear in UI lists.  M · S · A-H
- [ ] Add a `timezone String @default("UTC")` column on UserProfile. Currently dates are always formatted in UTC.  L · S · A-H
- [ ] Convert `JSON.parse(JSON.stringify(data.changes))` "validation" in `user-service.ts:164-165` to direct pass-through of `Prisma.InputJsonValue`, or Zod-parse. _Round-trip silently drops Date, undefined, Symbol values._  M · S · A-J / A-H
- [ ] Decide on soft-delete vs hard-delete pattern. Currently mixed: `isActive` flag exists but cascade-deletes still happen via FK. For audit/GDPR, prefer `deletedAt: DateTime?` with consistent filtering.  M · M · A-H
- [ ] Re-seed permissions on registration is per-org. Adding a new permission to `constants/permissions.ts` doesn't propagate to existing orgs. Convert to upsert-on-boot, or move to a global table referenced by all orgs.  H · M · A-F
- [ ] Generate the initial migration: `npx prisma migrate dev --name initial` once, commit `prisma/migrations/`, switch INSTALL.md to `prisma migrate deploy` for the CI/prod path.  H · S · A-E
- [ ] Append `&connection_limit=1` to the Supabase pooler URL on serverless deploys. Currently risks connection-pool exhaustion under load.  M · S · A-E
- [ ] Replace `findUsersWithOrgs` join-and-dedupe pattern with two queries (users by org + org by id). Currently returns N copies of the same Organization row.  M · S · A-A / A-H

## P1 — Data layer & state correctness

- [ ] Refactor `useAuthStore` to UI-state only (theme, sidebar open, last-viewed-tab). Move users/roles/permissions/userRoles fully into React Query.  H · M · R4
- [ ] Replace `hasPermission` Zustand selector with a React-Query-backed `usePermissions()` hook.  H · M · R4
- [ ] Rename or remove Zustand local-mutation methods (`addUser`, `updateRole`, `deleteRole`) to prevent them being mistaken for persistence APIs.  M · S · R4/R10
- [ ] Document the optimistic-update + invalidation pattern with one worked example in the new data rule file.  M · S · R4
- [ ] Add `loading.tsx` at `(platform)/dashboard/`, `(platform)/settings/`, `(platform)/notifications/`.  M · S · R4/R8
- [ ] Make `clearOrgCache()` part of any future "switch active org" Server Action; document the contract.  M · S · R4

## P1 — TypeScript safety

- [ ] Enable `noUncheckedIndexedAccess` in tsconfig.json. _Catches ~50 latent index bugs in formatters, utils, table cells where `array[i]` is treated as `T` instead of `T | undefined`._  H · M · A-J
- [ ] Add Zod parsing at every Server Action input boundary (see P0 above for the security angle; this is the type-safety angle). Cover `mutations.ts`, `app/actions/auth.ts`, every public action. The schemas in `validations/auth.ts` are client-side only today.  H · M · A-J
- [ ] Replace `as never` casts at `user-service.ts:160-161` with safer `parseActivityAction(value): ActivityAction | null` helpers, or import Prisma enums directly and switch exhaustively.  M · S · A-J
- [ ] Narrow `mock-client.ts` return type from `as unknown as SupabaseClient` to a `MinimalSupabaseClient` interface listing only the auth methods actually used. _Currently any code calling `.from`, `.storage`, `.realtime`, `.rpc()` in prototype mode crashes with no type warning._  M · S · A-J
- [ ] Convert `commitRegistration` return type to a discriminated union: `{ success: true } | { success: false; error: string }`. _Currently `error` could be present when `success: true`._  M · S · A-J
- [ ] Add `process.env` validation via `@t3-oss/env-nextjs` Zod schema, imported into `next.config.ts` so missing/invalid vars fail at build. Replace non-null assertions `process.env.X!` in `middleware.ts:31-32` with the validated import.  H · S · A-E / A-L
- [ ] Add branded ID types (`UserId`, `OrganizationId`, `RoleId`, `DepartmentId`) in `src/types/`. Cheap to add; prevents many cross-field-shape bugs.  M · M · R10 / A-J
- [ ] Constrain `DataTable<TData>` to `TData extends object` to prevent `data: null` from compiling.  L · S · A-J

## P1 — Visual polish & design system

- [ ] Codify typography in `globals.css` `@layer base`:
  ```css
  @layer base {
    h1 { @apply text-4xl font-semibold tracking-tight; }
    h2 { @apply text-3xl font-semibold; }
    h3 { @apply text-2xl font-semibold; }
    h4 { @apply text-xl font-semibold; }
    h5 { @apply text-lg font-semibold; }
    h6 { @apply text-base font-medium; }
    body { @apply text-sm text-muted-foreground; }
  }
  ```
  Update DESIGN.md prose to say "use `<h4>` for page titles — size and weight are applied automatically".  H · S · R3
- [ ] Add semantic color variants in `globals.css` (`--primary-deep`, `--primary-mild`, `--primary-subtle`, `--error-subtle`, `--success-subtle`, `--info-subtle`, `--warning-subtle`) + Tailwind theme block; document in DESIGN.md.  M · S · R3
- [ ] Add `.heading-text` utility (`@apply text-foreground` or equivalent).  M · S · R3
- [ ] Define `ControlSize` type (`'sm' | 'md' | 'lg'`) in `src/types/` and adopt across Button/Input/Select.  M · M · R3
- [ ] Decide on Storybook strategy. Either commit to 100% coverage + CI gate, or scope to custom/layout/data-table only and remove `.stories.tsx` from `ui/`.  M · M · R3
- [ ] Remove `@base-ui/react` from dependencies if unused.  L · S · R3

## P1 — Architecture cleanup

- [ ] Delete the 4 dead query hooks (`useUsersWithOrgsQuery`, `useRolesQuery`, `usePermissionsQuery`, `useUserRolesQuery`) and their backing Server Actions in `actions/queries.ts`. Replaced by batch hooks. _Currently new devs wire to the wrong ones and trigger the cache-key collision._  M · S · A-F
- [ ] Use `csv-utils.downloadCSV` from `users/page.tsx` and `departments/page.tsx` (currently both reimplement inline). Or delete the helper if you prefer inline.  L · S · A-F
- [ ] Delete unused exports in `brand.ts`: `BRAND_PRIMARY` and `BRAND_GRADIENT_TEXT` are never imported.  L · S · A-F
- [ ] Rename `mappers.ts` to `prisma-coercers.ts` (current name implies entity-mapping, but it's just date/decimal helpers). Move the real entity-mapping duplication out of services into a shared mapper for User/Role/Department.  M · S · A-F
- [ ] Replace the 3 overlapping batch-fetch actions (`fetchAuthBootstrapData`, `fetchUsersSettingsData`, `fetchUsersWithOrgs`) with one parametric `fetchPlatformData({ include: [...] })`.  M · S · A-F
- [ ] Make activity logging single-pathed — emit from the server action only (NOT also from the UI after the mutation). Currently inconsistent: some logged once server-side, some twice, some only client-side, some not at all.  M · S · A-F
- [ ] Build a shared `<SettingsCrudPage>` shell that encapsulates the "DataTable + form sheet + delete confirm + activity log + invalidate" pattern. _8 settings pages currently reimplement it; the 9th will drift._  M · M · A-F
- [ ] Either rename Zustand store mutation methods (`addUser` → `_localAppendUser`) or remove them entirely. They mutate only sessionStorage state and confuse devs into thinking they persist.  M · S · A-F
- [ ] Move `(platform)/actions/auth.ts` to `src/lib/actions/auth.ts` for consistency, OR document the exception in CODEMAP.md.  L · S · A-F
- [ ] Decide on `src/lib/header/`'s identity — split into actions (`src/lib/actions/`) and UI helpers (`src/components/layout/`) per their actual responsibility.  L · S · A-F

## P2 — Modern Next 16 / React 19 patterns dk skipped

- [ ] Add route segment files where they help: `loading.tsx` at `(platform)/dashboard/`, `(platform)/settings/`, `(platform)/notifications/`. `error.tsx` at `(platform)/` and `(auth)/`. `not-found.tsx` at root.  M · S · A-L
- [ ] Add `generateMetadata` to every public page (login, register, forgot-password, marketing). Ship `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/opengraph-image.tsx` (or similar) for SEO + link previews.  M · S · A-L
- [ ] Migrate forms to React 19's `useActionState` + `useFormStatus`. Keep React Hook Form for client-side validation; use `useActionState` for the server error/result path. Progressive enhancement: forms work without JS.  M · M · A-L
- [ ] Adopt Next 16 Cache Components (`use cache`, `cacheTag`, `updateTag`) for org-scoped read queries. Pair with Prisma. Tags include `organizationId`. Replaces `unstable_cache`.  M · L · A-L
- [ ] Add `<Suspense>` boundaries to enable PPR (Partial Pre-Rendering). Currently every platform page is fully dynamic.  M · M · A-L
- [ ] Adopt `nuqs` for filter/pagination/sort state. Currently Zustand or local component state. nuqs puts state in the URL — shareable, back-button-friendly, no client store sync.  M · S · A-L

## P2 — DX, tooling, onboarding

- [ ] Add `.prettierrc`, `.editorconfig`, `.nvmrc`.  M · S · R5
- [ ] Add Husky + lint-staged with a pre-commit hook (`eslint` + `prettier --check` on staged files).  M · S · R5
- [ ] Add `tsx` to `devDependencies` so `prisma db seed` doesn't hit npx every time.  M · S · R5
- [ ] Add `prisma format` and `prisma validate` npm scripts.  L · S · R5
- [ ] Add `typecheck` and `check` aggregate scripts:
  ```json
  "typecheck": "tsc --noEmit",
  "check": "npm run lint && npm run typecheck && npm run test"
  ```
  M · S · R5
- [ ] Split the `build` script. Default: `prisma generate && next build`. Add `build:full` that also runs Storybook.  M · S · R5/R8
- [ ] Add a 5-line "manual quickstart" block to `README.md` for developers not using Claude Code.  M · S · R5
- [ ] Add `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.github/PULL_REQUEST_TEMPLATE.md`.  L · S · R5

## P2 — Dependencies (from addendum)

- [ ] Downgrade `vite` from `^8.0.1` to `^7.x` (Vite 8 is pre-stable; Storybook 10's `@storybook/nextjs-vite` peer-targets Vite 7). Or remove the direct dep — it's transitive via Storybook + Vitest.  H · S · A-D
- [ ] Remove `@storybook/addon-viewport ^9.0.8` (mismatched with Storybook 10; viewport is built-in in SB10).  H · S · A-D
- [ ] Loosen exact-pinned `react`/`react-dom` from `19.2.3` to `^19.2.3` for patch updates.  M · S · A-D
- [ ] Remove `styled-jsx ^5.1.7` from `dependencies` — Next bundles its own; explicit dep causes version skew with Next's internal `5.1.6`.  M · S · A-D
- [ ] Add `tsx ^4` to `devDependencies` — `prisma db seed` calls `npx tsx prisma/seed.ts`; npx fetches it at runtime today (slow/brittle in CI).  M · S · A-D / R5
- [ ] Verify/remove `dotenv ^17.3.1` — no `import 'dotenv'` anywhere in src/scripts; Next + Prisma load .env natively.  L · S · A-D
- [ ] Add `engines: { "node": ">=20.9" }`, `packageManager: "npm@<lock-version>"`, and `license: "UNLICENSED"` (or chosen license) to `package.json`.  M · S · A-D
- [ ] Bump `tsconfig.json#target` from `"ES2017"` to `"ES2022"` (or `"ESNext"`). Node 20 / Next 16 / React 19 all support it; current target forces unnecessary down-leveling of async generators, top-level await, class fields.  M · S · A-D
- [ ] Regenerate `package-lock.json` so its `"name"` matches the renamed project (currently `"dk-launchpad"`).  L · S · A-D
- [ ] Document the `radix-ui` + `@base-ui/react` coexistence in CODEMAP.md (both used, by shadcn primitives and reui components respectively) OR consolidate.  L · S · A-D

## P2 — Production readiness (from addendum)

- [ ] Build-time env validation via `@t3-oss/env-nextjs` Zod schema imported in `next.config.ts`. Listed in TypeScript section above; calling out here too because it's the operational gap.  H · S · A-E / A-L
- [ ] Add `next.config.ts` `headers()` block with CSP (Report-Only first), HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.  H · S · A-E
- [ ] Add `next.config.ts` `images.remotePatterns` allowlist for `avatarUrl`. Currently a user can set any URL → SSRF/XSS risk on `<Image src={avatarUrl}>` (or pretty-img wrappers). Ship a real upload pipeline (Supabase Storage + MIME-validated server action).  H · M · A-E
- [ ] Add `/api/health/route.ts` returning `prisma.$queryRaw\`SELECT 1\`` + an auth ping. Needed for load-balancer readiness probes.  M · S · A-E
- [ ] Document `SUPABASE_SERVICE_ROLE_KEY` rotation procedure in `docs/SECRETS.md` or `STACK.md`.  M · S · A-E
- [ ] Document backup/DR: PITR config, retention, restore drill cadence. Even for Supabase-managed DB.  M · S · A-E
- [ ] Configure custom SMTP in Supabase dashboard (Resend/Postmark/AWS SES) so auth emails align SPF/DKIM/DMARC with the deployed domain. Document in INSTALL.md and STACK.md.  M · S · A-E
- [ ] Add `output: 'standalone'` to `next.config.ts` if self-host is in scope, plus a `Dockerfile`.  M · S · A-E
- [ ] Add account-deletion Server Action + UI ("Delete my account" in `/settings/account`). Required for GDPR.  M · M · A-E
- [ ] Add data-export Server Action (GDPR portability — return all data tied to current user).  M · M · A-E
- [ ] Add Zod schema for `ActivityLog.metadata` and a redactor before write. Prevents PII bleed to third-party log sinks.  M · M · A-E
- [ ] Add Sentry SDK via `npx @sentry/wizard@latest -i nextjs` — instrumentation files + global error boundary + source-map upload.  H · S · A-L
- [ ] Add `@vercel/speed-insights` + `@vercel/analytics` to `app/layout.tsx`. Free on Vercel.  L · S · A-L
- [ ] Add PostHog SDK (or chosen product analytics) gated on a DSN env var.  M · S · A-L
- [ ] Split `build` script. Default: `prisma generate && next build`. Add `build:storybook` and `build:full` for the bundled artifact.  M · S · R5 / A-E
- [ ] Add Vercel Flags SDK or chosen feature-flag provider — staged rollouts, kill switches.  M · S · A-L

## P2 — Testing & CI

- [ ] Land 3 example tests:
  - **Unit** — `getAuthContext` with mocked Supabase + Prisma
  - **Integration** — a service function against a test Postgres
  - **E2E** — sign-in → reach `/dashboard` → see KPIs (Playwright)
  
  H · M · R13
- [ ] Add `.github/workflows/ci.yml` running lint + typecheck + test + build on PR.  H · S · R14
- [ ] Add `.github/workflows/deploy.yml` for production deploy (Vercel or chosen target).  M · M · R14
- [ ] Add an a11y test gate (axe-core against built Storybook).  M · S · R7
- [ ] Add a `docs:audit` script that compares `CODEMAP.md` against the filesystem and exits 1 on drift.  M · M · R9

## P2 — Error handling & observability

- [ ] Add `error.tsx` at `(platform)/` and `(auth)/`.  M · S · R12
- [ ] Define typed error classes (`AuthError`, `PermissionError`, `NotFoundError`) and have Server Actions throw them.  M · S · R12
- [ ] Wire a global React Query error handler that surfaces Sonner toasts.  M · S · R12
- [ ] Add `/api/health` returning DB + auth ping status.  M · S · R12
- [ ] Log failed sign-in and denied permission attempts to `activityLog`.  M · S · R6/R12
- [ ] Pick an observability vendor (Sentry / Logtail / Axiom / Better Stack) and add an opt-in SDK gated on a DSN env var.  M · M · R12

## P2 — Accessibility

- [ ] Add a skip-link in `(platform)/layout.tsx`.  M · S · R7
- [ ] Verify sidebar permission-gated items are conditionally rendered (not just CSS-hidden) so they're absent from tab order.  M · S · R7
- [ ] Document the virtual-scroll a11y pattern (`aria-rowcount` / `aria-rowindex`) for DataGrid.  L · S · R7
- [ ] Add `useReducedMotion()` gate to non-trivial animations.  L · S · R7
- [ ] Verify OKLCh tokens hit WCAG AA contrast in both modes; adjust if not.  M · S · R7

## P3 — Naming & types

- [ ] Add a "Naming" section to `CLAUDE.md` or `DESIGN.md` codifying: kebab-case filenames, PascalCase component exports, camelCase utility filenames if single-word lowercase, Prisma enum naming.  M · S · R10
- [ ] Introduce branded ID types (`UserId`, `OrganizationId`, `RoleId`, `DepartmentId`) in `src/types/` and adopt in service signatures.  M · M · R10
- [ ] Audit `src/lib/header/*` — move into `src/components/layout/` or `src/lib/actions/` so the placement is principled, not arbitrary.  L · S · R1/R10

## P3 — Internationalization (decide first)

- [ ] **Decision needed**: is i18n in scope? If yes:
  - Add next-intl
  - Set up `messages/en.json` and `src/i18n/request.ts`
  - Add `getTranslations` / `useTranslations` patterns to a new `.claude/rules/i18n.md`
  - Add RTL support (`dir` switching)
  
  H if in scope · M · R11
- [ ] At minimum, factor user-facing strings into `messages/en.json` even without translation tooling so future migration is mechanical.  M · M · R11

## P3 — SaaS table-stakes

- [ ] **Decision needed**: which SaaS table-stakes to include in the starter? Suggested tier 1:
  - Outbound email (Resend or Postmark abstraction)
  - File upload via Supabase Storage
  - Stripe billing scaffold (Checkout + Customer Portal stubs)
- [ ] Decide on background job system (Inngest / Trigger.dev / BullMQ) or document "deferred".  R15
- [ ] Wire a real-time notification badge pattern (Supabase Realtime or SSE polling).  R15
- [ ] Document `Settings → Billing` and `Settings → Integrations` scope or scaffold concrete examples.  R15

## P3 — Performance

- [ ] Wire `@next/bundle-analyzer` with `ANALYZE=true` flag.  M · S · R8
- [ ] Verify Next.js font loading (`font-display: swap`, subset).  L · S · R8
- [ ] Audit Zustand-only dashboard data — switch to React Query with SSR fallback to remove the `—` flash.  M · S · R4/R8
- [ ] Audit sidebar permission-gating for hydration flash; SSR with server-side permission check.  M · S · R4/R8

## P3 — Strategic decisions to document

- [ ] **Multi-tenancy posture** — decide and document in `STACK.md`: session-based (current), subdomain (`*.app.com`), or path-based (`/[org]/...`). Each enables different downstream patterns (shareable per-tenant URLs, white-labeling). Current session model is fine for internal tools but limits public B2B SaaS use.  H · S (decide) / L (refactor) · A-L
- [ ] **Auth posture: Supabase RLS** — either enable RLS on all org-scoped tables as defense-in-depth, OR add a `SECURITY.md` documenting the threat model + explicit decision to rely on application-layer scoping ("service role key never reaches client; all DB access through actions").  H · S (doc) / M (RLS) · A-L
- [ ] **AI surface** — does the starter ship with a Vercel AI SDK stub (`useChat`, `streamText` endpoint) or stay AI-free? Document either way.  L · M · A-L
- [ ] **Stripe / billing** — `(platform)/settings/billing/` is a skeleton. Decide: scaffold Stripe Checkout + Customer Portal + webhook handler in the starter, OR document "out of scope, add yourself."  L · M · R15 / A-L
- [ ] **Outbound email** — `Notification` model exists but no delivery channel. Decide: ship Resend + React Email scaffold, OR document "out of scope."  L · M · A-L
- [ ] **File upload** — `UserProfile.avatarUrl` is free-string. Decide: ship Supabase Storage upload helper, OR document "out of scope" and constrain avatarUrl to a same-origin path.  L · M · A-E
- [ ] **Tooling: Biome vs ESLint+Prettier** — Biome is 40-100× faster; covers ~80% of ESLint rules. Decide: keep ESLint (for `next/core-web-vitals` + hooks), add Biome for format + general lint, OR stay all-ESLint.  L · S · A-L

## P3 — Documentation polish

- [ ] Document Prisma enum snake_case convention in CODEMAP.md (or rename to PascalCase if not intentional).  L · S · R10
- [ ] Cross-link DESIGN.md → COMPONENT.md → CODEMAP.md → STACK.md more explicitly so the agent loads them in order.  L · S · R2
- [ ] Add `git mv` examples to CODEMAP.md for "renaming a service/action/hook" so the agent knows to update both files + CODEMAP in one commit.  L · S · R2
- [ ] Document `npm run test` / `npm run test:watch` / `npm run setup` in CLAUDE.md.  L · S · A-K
- [ ] Add a Windows-flavored variant of INSTALL.md Phase 8's `mv` example (use `Rename-Item` or `move`).  L · S · A-K
- [ ] CODEMAP.md: include `prisma.ts`, `csv-utils.ts`, `platform-layout-bootstrap.ts` in the `src/lib/` tree.  L · S · A-K

---

## How to use this list

- The P0 **[BLOCKER]** items are the gating set — a starter that ships any of them is shipping bugs to every downstream project that clones it.
- The P0 **[EXPLOITABLE]** items are concrete security exploits demonstrated by the multi-agent audit. They should be the first PRs.
- P1 items can be sequenced behind P0 and aren't independently blocking, but they will compound rapidly as the starter is used.
- P2/P3 items are best done as small, themed PRs (e.g., "Modern Next 16 patterns: error/loading/sitemap").

When marking an item done in a PR description, reference its source tag (e.g., `A-B #2` or `R6`) so future readers can trace the reasoning.
