# REVIEW — multi-agent addendum

> Second pass on `dk-web-starter`, this time executed by **12 parallel sub-agents with fresh contexts** across **3 iterations**. Each iteration was informed by gaps revealed in the prior one. The sub-agents had no access to the original [`REVIEW-eyris-comparison.md`](./REVIEW-eyris-comparison.md) or [`TODO.md`](./TODO.md), so their findings are independent.
>
> Result: ~280 raw findings, deduplicated and ranked here. ~60% reinforced findings from the original review; ~40% are net-new. The original review was *strategically* right but materially *under-detailed* on the security and correctness surfaces.
>
> **If you read nothing else, read the Top 20 critical findings below.** Several are exploitable today and should block any production deployment until fixed. See [`TODO.md`](./TODO.md) for the prioritized action list.

---

## Methodology

| Iteration | Agents | Angle |
|---|---|---|
| 1 | A — implementation bug hunt | Concrete bugs, race conditions, missing error paths (file:line) |
| 1 | B — security pen audit | Adversarial review: cross-tenant access, RBAC bypass, open redirects, CSRF, XSS |
| 1 | C — Eyris pattern catalog (deep) | Exhaustive list of patterns/components/utilities/configs worth adopting |
| 1 | D — dependency & version audit | npm outdated/audit, pre-release deps, misalignment, dead/missing |
| 1 | E — production-readiness audit | Deploy/ops gaps — env validation, observability, RLS, rate limiting |
| 2 | F — architecture & code smells | Layer boundary leaks, wrong-place abstractions, snowflake settings pages |
| 2 | G — end-to-end flow audit | Tracing signup, login, invite, role-change, password-reset, theme, bulk delete |
| 2 | H — Prisma schema & data-model audit | Indexes, constraints, FK rules, audit-trail design, retention |
| 2 | I — Eyris implementation recipes (how) | Code-level recipes for adopting Eyris patterns |
| 3 | J — TypeScript strictness audit | tsconfig flags, `any`/`as never`, Zod boundary, type-erasure casts |
| 3 | K — documentation accuracy walkthrough | Every claim in CLAUDE/CODEMAP/COMPONENT/INSTALL/README/STACK vs reality |
| 3 | L — modern starter comparison | next-forge, t3-stack, shadcn, Vercel templates — gaps dk doesn't have |

### Convergence rationale

Stopped at 3 iterations. The original review had 15 angles; the agents added 12 more deep passes. Remaining uncovered angles — **mobile/responsive QA**, **screen-reader manual testing**, **performance measurement under load**, **build verification with full `npm install`** — all require *runtime* verification rather than more static analysis. Diminishing returns from further static iterations. Any final pass should be a hands-on validation, not another paper review.

---

## Top 20 critical findings

Findings ranked by **severity × likelihood**, irrespective of which agent surfaced them. **CRITICAL** = exploitable today or guaranteed-broken setup. **HIGH** = guaranteed failure under realistic conditions.

### 1. **CRITICAL** — Server actions have ZERO permission checks (`requirePermission` is client-side only)

`src/lib/actions/mutations.ts:55-214`, `src/lib/services/user-service.ts`. Every mutation calls `getAuthContext()` for org scoping but never verifies caller permissions. **A Viewer-role user can call `assignUserRole({ userId: self, roleId: <Admin role> })` directly from the browser console and escalate to Admin.** The UI hides the button behind `useAuthStore.hasPermission(...)` but the Server Action endpoint accepts the POST regardless.

**Other exploits via the same hole**: `deactivateUser(otherUserId)` · `deleteRole(roleId)` · `inviteUser(arbitraryEmail)` · `createRole({})` · `updateOrganization({})` · `bulkDeleteDepartments([])`.

Fix: add `requirePermission(group, action)` helper, call from every mutation. ~60% of security findings collapse with this one change.

### 2. **CRITICAL** — `lp-org-id` cookie is trusted without verifying ownership

`src/lib/actions/auth-context.ts:31-35`. httpOnly but unsigned. From an attacker's own browser/curl/Burp: send the valid Supabase session cookie + `Cookie: lp-org-id=<other-org-uuid>`. `getAuthContext()` short-circuits to the cached value for 24h. **The attacker now reads and mutates the other org's data.** Combined with #1 (RBAC missing), they can self-assign Admin in that org.

Fix: never trust the cookie. Look up `organizationId` from `userProfile` every time, OR sign the cookie + verify on read OR bind the cookie value to `user.id`.

### 3. **CRITICAL** — `prisma.userProfile.update({ where: { id, organizationId } })` will throw at runtime

`src/lib/services/user-service.ts:200, 244`, multiple call sites. Prisma `update` requires a unique constraint in `where`. `UserProfile.id` is unique, but `(id, organizationId)` is NOT a defined composite unique → `PrismaClientValidationError` at runtime. **Every update of UserProfile crashes.** Same pattern in `removeRole`, `deactivateUser`.

Fix: use `updateMany` (allows non-unique where), or `findFirst({ where })` + `update({ where: { id } })`, or add `@@unique([id, organizationId])` to the schema.

### 4. **CRITICAL** — Open redirect via `/auth/callback?next=//evil.com`

`src/app/auth/callback/route.ts:7,13`. `next` from query string concatenated as `${origin}${next}`. `next=//evil.com` → `Location: https://app.com//evil.com` → browser navigates to evil.com. Phishing pivot via password-reset emails.

Fix: `if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) next = "/dashboard"`.

### 5. **CRITICAL** — Second open redirect via user-writable `homePage`

`src/app/page.tsx:13-17` + `mutations.ts:106`. `UserProfile.homePage` is `String` with no allowlist. Attacker sets their own profile's `homePage = "https://evil.com/phish"`. Then **anyone** visiting `/` (the app root) while logged in is redirected to evil.com if that user is the active one — Next.js's `redirect()` accepts absolute URLs.

Fix: enum-constrain `homePage` to known routes, or validate `startsWith("/")` server-side before storing.

### 6. **CRITICAL** — Any user can mutate another user's profile

`src/lib/actions/mutations.ts:106`. `updateUserProfile(id, data)` takes `id` from caller, queries `{ where: { id, organizationId } }`. No check that `id === ctx.userId` or that caller has "Edit Users" permission. A Viewer can overwrite a colleague's `fullName`, `email`, `avatarUrl`, `theme`, or `homePage`. Combined with #5 → set victim's `homePage = "evil.com"`, victim visits `/`, gets phished.

Fix: enforce `id === ctx.userId` OR `requirePermission("Users", "Edit")`.

### 7. **CRITICAL** — Cross-org `roleId` injection

`src/lib/services/user-service.ts:336-343, 387-394`. `assignUserRole` inserts a UserRole with `organizationId: callerOrg, roleId: attackerChosen`. FK on `roleId` doesn't verify `Role.organizationId === callerOrg`. Attacker passes a role ID from org B and grants their org-A user that role.

Fix: `const role = await tx.role.findFirstOrThrow({ where: { id: roleId, organizationId } })` before insert.

### 8. **CRITICAL** — `NEXT_PUBLIC_PROTOTYPE_MODE=true` in prod = total auth bypass

`src/lib/supabase/mock-client.ts:33-39`. `NEXT_PUBLIC_*` is baked into the client bundle AND read server-side. If a deploy ever sets it true (env typo, Vercel preview misconfig, copy-pasted .env), every request returns `PROTOTYPE_DEMO_USER` with no real auth. Mock `createAdminClient()` resolves all admin operations OK silently.

Fix: `if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true") throw new Error("prototype mode forbidden in prod")` at boot.

### 9. **CRITICAL** — `useUsersWithOrgsQuery` and `useUsersSettingsDataQuery` share `queryKey` but return different shapes

`src/lib/queries/hooks.ts:25, 96`. Both use `queryKey: queryKeys.usersWithOrgs`. First returns `{ users, organizations }`. Second returns `{ users, organizations, roles, userRoles, departments }`. Whichever loads last clobbers the cache; the typed consumer of the first reads garbage. `invalidateQueries({ queryKey: queryKeys.usersWithOrgs })` triggers refetches on unrelated screens.

Fix: distinct query keys.

### 10. **CRITICAL** — Forms collect `isActive` and `email` but the update Server Action silently discards them

`src/app/(platform)/settings/departments/page.tsx:44-46` + `mutations.ts:60` + `settings-service.ts:41`. The edit form schema includes `isActive`. The Server Action accepts only `{ name: string }`. **User toggles Active in the sheet, hits Save, sees a success toast — nothing changed in the DB.** Same pattern in `users/page.tsx:46-52` for `isActive` and `email`. Worst kind of bug: silent data loss disguised as success.

Fix: extend the Server Actions to accept the full schema, OR strip the unused fields from the form.

### 11. **CRITICAL** — `bash setup.sh` referenced from two docs and `package.json` but the file doesn't exist

`.github/TEMPLATE_README.md` and `package.json#scripts.setup` both invoke `bash setup.sh`. **The file does not exist.** Anyone arriving via "Use this template" → `bash setup.sh` is dead-on-arrival.

Fix: write the script, or remove both references.

### 12. **CRITICAL** — INSTALL.md Path 4 detection uses wrong filenames

`INSTALL.md:288` and `STACK.md:39` reference `client-mock.ts` and `server-mock.ts`. Actual filename is `mock-client.ts` (single file at `src/lib/supabase/mock-client.ts`). Claude executing the playbook checks for non-existent files at line 219 and **silently downgrades Path 4 (prototype) to Path 3 (SQLite end-to-end)**.

Fix: rename references to `mock-client.ts`.

### 13. **CRITICAL** — INSTALL.md says `.env`; seed.ts and `.env.example` say `.env.local`

`INSTALL.md:105` instructs `Copy .env.example → .env`. `seed.ts:14` loads `.env.local`. README and `.env.example:3` both say `.env.local`. **Fresh setups will run the seed and hit `Missing NEXT_PUBLIC_SUPABASE_URL` because no `.env.local` was created.**

Fix: align INSTALL.md to `.env.local`.

### 14. **CRITICAL** — DESIGN.md token schema doesn't match `globals.css`

DESIGN.md YAML uses Material-3-style tokens (`primary-container`, `on-primary`, `tertiary`, `surface-variant`); CSS uses shadcn-style (`primary`, `secondary`, `accent`, `muted`, `destructive`). An agent reading DESIGN.md and using `bg-primary-container` writes a class that doesn't exist. (Already in original review — confirmed.)

### 15. **CRITICAL** — `{{PLACEHOLDERS}}` ship in repo state

`CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `STACK.md` all contain `{{...}}` template tokens. Evaluation-by-browsing is broken. (Already in original review — confirmed at scale.)

### 16. **HIGH** — Server Action input boundaries have NO Zod validation

`src/lib/validations/auth.ts` schemas exist but are used *only client-side* by react-hook-form. Every Server Action — `commitRegistration`, `createDepartment`, `inviteUser`, `assignUserRole`, `updateUserProfile`, `createNotification` — accepts plain TS-typed input from the client and trusts it. Email format unchecked. UUID format unchecked. Enum values cast via `as never`. **Any malicious or buggy client can pass shapes the server doesn't expect; Prisma is the only line of defense.**

Fix: `schema.safeParse(input)` as first line of every Server Action.

### 17. **HIGH** — Role change is 3 sequential Server Actions, not atomic

`src/app/(platform)/settings/users/page.tsx:134-137`. `updateUserProfile` → `removeUserRoleAction` (delete) → `assignUserRoleAction` (create). If step 2 succeeds but step 3 fails, **the user is left with NO role at all**. Admin sees a toast error but no clear signal that "Manager → Contributor" half-applied to "Manager → (none)".

Fix: single `replaceUserRole` Server Action wrapping a transaction.

### 18. **HIGH** — `getAuthContext` doesn't check `isActive` for user OR org

`src/lib/actions/auth-context.ts:21-60`. A deactivated user keeps full Server Action access until their Supabase session expires. A user in a deactivated org keeps access indefinitely.

Fix: `if (!profile.isActive || !organization.isActive) throw new Error("Account inactive")`.

### 19. **HIGH** — Permission seeding has a fundamental gap

`src/lib/constants/permissions.ts` hardcodes permissions and `commitRegistration` seeds them into the DB per-org on registration. **Adding a new permission to the TS file requires re-seeding every existing org — nothing does this.** New orgs get the new permission; old orgs silently don't. The first time you add a `Settings.Audit` permission, existing tenants lack it and silent permission gaps appear.

Fix: convert to upsert-on-boot via a one-shot migration; OR move permissions to a runtime config that all orgs share by reference; OR document that adding a permission requires a data migration touching every org row.

### 20. **HIGH** — `logLoginEvent` exists but is never called from anywhere

`src/lib/actions/mutations.ts:29-39` defines `logLoginEvent` but `commitRegistration`, the login page, and the auth callback don't invoke it. **Every login is silently missing from the activity log.** Security forensics blind.

Fix: invoke at end of `signInWithPassword` success path.

---

## Findings by category

### Security (Agent B + cross-referenced)

Beyond the Top 20:

- **Notification injection** — `mutations.ts:77-87`. Any user can spam any other user in the org with arbitrary notification body/title. No "Notifications:Manage" permission gate.
- **Activity log tampering** — `mutations.ts:15-27`. Caller controls `entityType`, `entityName`, `changes`, `metadata`, and `action`. A user can forge `logged_in` events for a colleague.
- **`inviteUser` callable by any user** — `mutations.ts:165-209`. Outbound emails from your app domain to attacker-chosen addresses → reputation hit.
- **Tenant enumeration via error strings** — `app/actions/auth.ts:51-61`. Distinct messages for "email exists" vs "org name exists" enable enumeration. Combined with no rate limit → mass enumeration.
- **No rate limiting** anywhere. `commitRegistration` spam → connection-pool exhaustion DOS (each call holds a Prisma `$transaction` with 30s timeout).
- **Cookie missing `secure: true`** — `auth-context.ts:49-54`. In dev/HTTP downgrade, the (already-untrusted) `lp-org-id` leaks.
- **No CSRF protection on `/auth/callback`** — accepts `code` query param with no `state` validation. PKCE handles part of this; the route blindly trusts the code.
- **Middleware matcher excludes `.json|.txt`** — `middleware.ts:10`. Future `/api/users.json` or `/manifest.json` route handler silently unauthenticated. Also excludes `/storybook` — Storybook ever shipped to prod = unauthenticated component playground with potentially-real data.
- **`PUBLIC_ROUTES.startsWith` prefix matching** — `src/lib/supabase/middleware.ts:54`. `/login` matches `/login-backdoor`; any future custom route ending in `/...-backdoor` slips through.
- **TOCTOU on `removeRole`/`removeUserRole`** — `user-service.ts:321-327, 431-437`. Scope-checked find followed by unscoped delete. Theoretical with UUIDs, but the pattern is wrong.
- **`AdminPass123!` hardcoded in `prisma/seed.ts`** — published in README too. Any forked starter run against a real DB has known admin creds.
- **`@supabase/admin` mock — `onAuthStateChange` callback never fires** in prototype mode → any code awaiting `INITIAL_SESSION` hangs forever.

### Correctness (Agents A + G)

- **`commitRegistration` orphan handling** — Supabase user created OUTSIDE the Prisma transaction (`app/actions/auth.ts:64-73`). If the txn fails and the cleanup `deleteUser` also fails (network blip), you have an unkillable orphan: the user can't re-register because Supabase says "email exists", but no profile row exists.
- **`commitRegistration` post-txn `signInWithPassword`** can fail leaving a complete account in a "registered but can't log in" state with a misleading error.
- **Per-role permission upsert is N+1 inside the transaction** — `auth.ts:108-143`. ~12 sequential `findUnique` + `create` calls hold a connection. `.catch(() => {})` swallows ALL errors, not just unique-constraint violations — a connection error silently drops the permission link.
- **Orphan Supabase user + missing `userProfile` row = infinite redirect loop** — `platform-layout-bootstrap.ts:12-15` throws → `platform-layout-client.tsx:46-49` redirects to `/login` → middleware sees authenticated user → redirects to `/dashboard` → loop until session expires.
- **`getUserRole(editUser.id)` returns only FIRST UserRole** — `users/page.tsx:135`. If a user has multiple roles, edits leak the others (permissions stay).
- **No last-admin guard** — Admin can change own role to Viewer leaving the org with zero admins. Same for self-deactivation.
- **Header theme toggle doesn't persist to DB** — only Account-page toggle does. Toggling from header → DB still has old value → next login reapplies old theme → "I changed it and it forgot."
- **Bulk delete sequence is non-atomic** — `bulkRemoveDepartments` (deleteMany, atomic) followed by N sequential activity-log inserts. Crash mid-loop = 20 deletes logged for 5.
- **Bulk deactivate runs N sequential server actions** — `users/page.tsx:187-194`. Row 5 fails → rows 1-4 deactivated, 6-20 not, toast says "Failed to deactivate users", admin doesn't know which.
- **Activity log enum bypass via `as never`** — `user-service.ts:160-161`. Caller-passed `action` cast to `never` → reaches Prisma → Postgres enum error if invalid.
- **Bulk-deactivate logs `action: "updated"`** because the enum doesn't have `deactivated`. Audit trail can't distinguish "name changed" from "account deactivated".
- **`findUsersWithOrgs` returns N copies of the same Organization** — `user-service.ts:14-18`. Joins org per-user then dedupes in memory. Wire payload bloated.
- **No `orderBy` on `findUsersWithOrgs`, `findRoles`, `findUserRoles`, `findAllDepartments`** — non-deterministic order causes UI re-render churn and flaky tests.
- **`hasPermission` Zustand selector returns new refs each call** — `auth-store.ts:122-138, 165-170`. With `subscribeWithSelector` not enabled, every store change re-renders every component reading `hasPermission`. CODEMAP warns but the warning is buried.
- **`useUsersWithOrgsQuery`, `useRolesQuery`, `usePermissionsQuery`, `useUserRolesQuery` are exported but never consumed** — `hooks.ts:24-57`. Replaced by batch hooks. Their backing Server Actions are also unused. New dev wires to wrong one → cache-key collision (finding #9).
- **`csv-utils.downloadCSV` is exported but never used** — two pages reimplement CSV download inline.
- **`brand.ts BRAND_PRIMARY` and `BRAND_GRADIENT_TEXT` are orphan exports** — never imported.
- **`mappers.ts` is misnamed** — contains 5 date/Decimal coercion helpers; the actual entity-mapping repetition is 4-5× inline in services.

### Architecture (Agent F)

- **`csv-utils.downloadCSV` dead** while pages reinvent it — flagged above.
- **4 dead query hooks** — flagged above.
- **`fetchAuthBootstrapData` vs `fetchUsersSettingsData` vs `fetchUsersWithOrgs`** — three overlapping batch fetchers; every page must pick one. Picking wrong = duplicate fetches on the same screen.
- **Activity logging double-pathed** — `inviteUser` logs server-side; `updateUserProfile`/`deactivateUser` only log via UI. If UI crashes between mutation and log, no audit trail. Some actions logged once, some twice, some not at all.
- **Settings pages are 300-500-line snowflakes** — 8 client components, same patterns reimplemented, pagination toggle differs across pages. No shared `<SettingsCrudPage>` shell.
- **`createRole`/`updateRole`/`assignUserRole`/`createUserWithRole`** all hand-build the same Role DTO 4-5×. Add a field to Role → update 6 places.
- **Cookie/storage prefix sprawl** — `lp-org-id`, `lp-theme`, `lp-theme-synced`, `lp-auth-store` across 3 storage backends with no central registry.
- **`(platform)/actions/auth.ts` is the only Server Action outside `src/lib/actions/`** — exactly one exception with no README explaining why.
- **`src/lib/header/`** is a side-effect grab bag — mixes Supabase client, server-action calls, sessionStorage, and `window.location.assign`. Not a service, not an action, not a query.
- **`auth-context.ts` cookie cache has no invalidation strategy** beyond logout — first multi-org user gets cross-tenant leak.
- **`app-sidebar.tsx:49` literally renders `__PROJECT_NAME__`** as a string — placeholder ships in code.
- **Two sources of truth for users/roles** — Zustand + React Query. Dashboard reads Zustand; settings pages read Query. Edit in settings → table updates, sidebar org-switcher doesn't.
- **Zustand store mutation methods (`addUser`, `updateRole`) are zombie code** — never called; invite devs to assume "I'll just update the store" then get blown away on next bootstrap.

### Data model / Prisma (Agent H)

- `UserProfile.email` is **missing `@unique`** — DB allows duplicates → auth/profile drift.
- `UserProfile.id` has **no FK to `auth.users`** — Supabase user deletion leaves dangling rows.
- **No Postgres RLS** — multi-tenant isolation is entirely TypeScript. One missing `organizationId` filter = leak.
- **Missing FK indexes** throughout (`createdBy`, `updatedBy`, `userId` on ActivityLog). Postgres doesn't auto-index FKs. Slow joins + slow cascades.
- **`ActivityLog.createdAt` not indexed** → every dashboard load does `ORDER BY created_at DESC LIMIT N` as a full sort.
- **Notification index `(userId, isRead)`** doesn't match the actual query that filters `(organizationId, userId, isRead)` and orders by `createdAt DESC`.
- **No actor name snapshot in ActivityLog** — user deletion + SetNull → log shows "Unknown".
- **No `requestId`/`ipAddress`/`userAgent`** on ActivityLog → broken forensics.
- **No `Invitation` model** — invites create UserProfile directly; no token/expiration/accepted-state. Invited-but-never-clicked users are indistinguishable from active members in lists and KPIs.
- **No retention/TTL** on Notification or ActivityLog — grow unbounded; hardcoded `take: 500` masks the problem.
- **`Notification.body` length unbounded** — single message could be 1 GB.
- **`isActive` not filtered consistently in list queries** — deactivated users/depts/roles still appear in UI lists.
- **No user `timezone` field** — formatted dates always rendered in UTC.
- **Junction tables (`RolePermission`, `UserRoleDepartment`) have surrogate UUID `id`** instead of composite PK — wastes 16 bytes per row.
- **Permission rows are global** (no `organizationId`) — by design, but means cross-org permission upserts in registration can deadlock and the per-org seeding pattern is wasteful.
- **Enum naming inconsistent** — `snake_case` enums, PascalCase models. Prisma allows PascalCase enums.

### Production readiness (Agent E)

- **No env validation at boot** — `process.env.*` read lazily everywhere. Missing keys crash at first request, not at deploy.
- **No security headers in `next.config.ts`** — no CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- **`avatarUrl` is a free-string URL** — no `next/image` `remotePatterns` allowlist, no upload pipeline → SSRF/XSS surface.
- **No `prisma/migrations/` folder; INSTALL.md uses interactive `migrate dev --name initial`** — unsafe in CI. No `migrate deploy` documented.
- **No `connection_limit=1` on the Supabase pooler URL** for serverless → connection-pool exhaustion under load.
- **Supabase Auth emails come from `@supabase.io`** by default → SPF/DMARC misalignment → spam folder. Custom SMTP not documented in INSTALL.md.
- **No backup/DR documentation**, no PITR config note, no restore drill.
- **No `/api/health` endpoint** for load-balancer readiness probes.
- **`build` script runs `bash scripts/build-storybook.sh`** — `bash` not present on Vercel default Node images. Storybook bundled into prod build → leaks design-system internals + adds MB.
- **No GitHub Actions workflows** — `.github/` has only `TEMPLATE_README.md`. No CI/lint/test gate.
- **No `Dockerfile`, no `vercel.json`, no `fly.toml`** — deployment target unpicked.
- **No `engines`, `packageManager`, `license` fields** in `package.json`. No `.nvmrc`.
- **GDPR gaps** — no account-deletion endpoint, no data export, PII in `activityLog.metadata` with no redaction layer.

### Dependencies (Agent D)

- **`vite ^8.0.1`** is pre-stable (v7 is current stable as of late 2025). Storybook 10 targets Vite 7 in peer deps → potential install break.
- **`@storybook/addon-viewport ^9`** mismatched with Storybook 10. Storybook 10 has viewport built-in.
- **`react`/`react-dom` pinned exact `19.2.3`** with no caret — blocks patches.
- **`styled-jsx ^5.1.7`** explicit dep — Next.js bundles its own (`5.1.6`); creates version skew.
- **`dotenv ^17.3.1`** in devDeps — no `import 'dotenv'` anywhere; likely unused.
- **`tsx` missing from devDeps** — `prisma db seed` invokes `npx tsx` → slow first run.
- **`tsconfig.json target: "ES2017"`** — outdated for Node 20 / Next 16. Bump to ES2022.
- **`package-lock.json` `"name": "dk-launchpad"`** — stale brand identity.
- **`@base-ui/react` + `radix-ui`** coexist (each used) — two primitive libraries; document or consolidate.

### TypeScript (Agent J)

- **`noUncheckedIndexedAccess` not enabled** — `array[i]` types as `T` not `T | undefined`. Latent bugs in `formatDate`, `getInitials`, `csv-utils`.
- **Zero Zod parsing at Server Action boundaries** — covered above.
- **`as never` smuggle on enum** — `user-service.ts:160-161`.
- **`type: string` widening on Server Action** — `mutations.ts:79` accepts `type: string`; service casts to `notification_type as`. UI can persist `"lol"` as a type.
- **`JSON.parse(JSON.stringify())` "validation"** silently strips Date/undefined/Symbol.
- **`mock-client.ts` `as unknown as SupabaseClient`** — calling `.from`, `.storage`, `.realtime`, `.functions`, `.rpc()` in prototype mode crashes with "undefined is not a function" while TS stays silent.
- **`userId!` non-null assertions inside `prisma.$transaction`** — fragile to reorder.
- **`middleware.ts:31-32 process.env.X!`** — bypasses the explicit env check that `client.ts`/`server.ts` have.
- **`DataTable<TData>` generic unconstrained** — accepts `data: null` at compile time.
- **`useNotificationsQuery(userId: string)`** allows empty string; runtime `enabled: !!userId` skips, but the type doesn't enforce non-empty.
- **`commitRegistration` returns `{success: boolean, error?: string}`** — should be a discriminated union so `result.error` is type-narrowed to `string` when `success: false`.

### Documentation accuracy (Agent K)

- **`bash setup.sh` doesn't exist** — covered above.
- **`client-mock.ts`/`server-mock.ts` filenames are wrong in INSTALL.md + STACK.md** — actual is `mock-client.ts`. Path 4 detection silently downgrades.
- **INSTALL.md says `.env`; everything else says `.env.local`** — covered above.
- **CODEMAP claims "5 enums"** — schema has 6.
- **CODEMAP omits `src/lib/prisma.ts`, `src/lib/csv-utils.ts`, `src/lib/platform-layout-bootstrap.ts`** from the tree.
- **README claims "~47 components"** — actual count in `src/components/ui/` is 31 `.tsx` files (47 includes `.stories.tsx` siblings).
- **CLAUDE.md claims Claude skills auto-invoke** — project-level skills (not bundled in plugins) require manual invocation or system-reminder injection.
- **CLAUDE.md doesn't document `npm run test` / `setup` scripts** that exist in `package.json`.

### Modern stack gaps (Agent L)

Best-practice patterns dk doesn't have, sourced from next-forge, t3-stack, shadcn blocks, Vercel templates:

**High ROI, low effort:**
- Boot-time env validation via `@t3-oss/env-nextjs` (Zod schema imported into `next.config.ts`)
- `generateMetadata`, `sitemap.ts`, `robots.ts`, `opengraph-image` — SEO + link previews
- Route segment files (`loading.tsx`, `error.tsx`, `not-found.tsx`) — **none exist anywhere in dk**
- `@next/bundle-analyzer`
- Husky + lint-staged + commitlint
- Dependabot or Renovate config
- Sentry SDK via Next.js wizard

**Next 16 / React 19 patterns dk skipped:**
- `useActionState` + `useFormStatus` form pattern (server-action-first, progressive enhancement)
- **Cache Components** (`use cache`, `cacheTag`, `updateTag`) — Next 16 net-new
- PPR via `<Suspense>` boundaries (dk has zero Suspense)
- `nuqs` for URL state (filters/pagination/sort in URL instead of Zustand)
- Parallel & intercepting routes for modal flows

**SaaS infra:**
- Resend + React Email for branded auth/notification emails
- Arcjet or `@upstash/ratelimit` for rate limiting
- Vercel Flags SDK for staged rollouts
- PostHog + Vercel Speed Insights + Analytics

**Strategic decisions to document:**
- Multi-tenancy posture (session-based vs subdomain `*.app.com` vs path-based `/[org]/...`)
- Supabase RLS omission threat model
- Vercel AI SDK as a separate module (dk has zero AI surface)

---

## Eyris adoption shortlist (from Agent C + Agent I)

In priority order, with code-recipe pointers from Agent I:

1. **Build a minimal MCP server** modeled on Eyris's. Tools to expose at minimum:
   - Read: `list_components`, `get_component`, `get_code_examples`, `list_services`, `list_prisma_models`, `list_page_patterns`
   - Write: `scaffold_page` (creates page.tsx + service + action + hook + sidebar-nav + CODEMAP/COMPONENT updates), `cleanup_starter`, `configure_theme`, `replace_storage_prefix`
2. **Codify composition patterns** — at least CRUD List, Form Page, Settings Page (the dk equivalent of Eyris's 6).
3. **`ai-init` script** scaffolding rules into Claude, Cursor, Copilot. Eyris's `scripts/ai-init/index.mjs` is the reference.
4. **Split `CLAUDE.md`** into `.claude/rules/{overview,data,components,auth,styling,routing,testing}.md` with `@.claude/rules/...` imports — better context-window utilization than one monolith.
5. **No-flicker SSR theme** — Eyris serializes `applyTheme.toString()` into an inline `<script suppressHydrationWarning dangerouslySetInnerHTML>` rendered last in `ThemeProvider`. Sets CSS variables before hydration. Pattern fits dk's OKLCh tokens + `next-themes` cleanly.
6. **Typography codified in `@layer base`** — `<h4>` automatically renders at right size and weight + dark-mode-adapted color. Already a recommendation in original review.
7. **Semantic color variants** — `bg-primary-deep`, `bg-primary-mild`, `bg-primary-subtle`, `bg-error-subtle`. Half-day's work in `globals.css`.
8. **`.heading-text` utility** — adaptive emphasis text.
9. **Layout types + per-route override** via `route.meta.layout`. Eyris ships 6; dk should ship at least 2 (insetShell, stackedSide) initially.
10. **`pageContainerReassemble` render-prop pattern** — layouts rewrite how PageContainer wraps children.
11. **`useMenuActive`** — nav-tree walk that returns active leaf + top-level ancestor for breadcrumb in one call.
12. **`OverflowTabs`** — measurement-based "tabs that fit + More dropdown".
13. **`useRandomColor`** — deterministic name → Tailwind pastel pair. Tailwind safelist must be hard-coded so the JIT scanner picks them up.
14. **Constants split convention** — `<domain>.constant.ts` per concern.
15. **`<domain>Service` PascalCase + matching `dataMock.ts`** — easier swap from mock to real backend.
16. **i18n via next-intl** — Eyris ships 4 locales (en/es/zh/ar) including RTL. Adding later is expensive.
17. **Multi-tenancy UI** — `HeaderTenancySelector` + `SideNavTenancySelector` with SWR fetch + workspace switcher.

Implementation recipes for #5-#15 are in Agent I's report (synthesized below); a developer can replicate them in a few days each.

---

## Cross-cutting themes (synthesis after 3 iterations)

### Theme A — Security is the urgent surface

The starter ships with **5 distinct privilege-escalation paths** (RBAC missing server-side, `lp-org-id` trusted, cross-org roleId injection, cross-user updateUserProfile, self-assign Admin). Any one of these is sufficient for tenant compromise. **Two highest-leverage fixes neutralize ~70% of security findings:**

1. Add `requirePermission(group, action)` helper invoked from every Server Action mutation.
2. Stop trusting `lp-org-id` (sign + verify ownership, or drop the cache).

### Theme B — The codebase has silent-failure bugs

Forms that say "Saved!" but save nothing (#10). Activity logs missing every login (#20). Header theme that toggles in UI but doesn't persist (#23). Bulk operations that half-complete with confused toasts. **These are worse than crashes because users don't notice.** Need a sweep with a "what does the user think happened vs what actually happened" lens.

### Theme C — Documentation is unreliable enough to break setup

Three doc lies actively break setup paths: missing `setup.sh`, wrong mock-client filenames, wrong `.env` vs `.env.local`. Two more (DESIGN.md tokens, `{{PLACEHOLDERS}}`) make evaluation-by-browsing impossible. **An agent reading the docs cold will fail to set up the project, then get confused at runtime.**

### Theme D — TypeScript correctness is overstated

`strict: true` is on but the type system is bypassed at the network boundary (no Zod), at the Prisma boundary (`as never`, `as unknown as`), and at the mock boundary (`as unknown as SupabaseClient`). The codebase reads as "type-safe" but the safety stops at the file-internal level.

### Theme E — Modern Next 16 / React 19 features are unused

No `loading.tsx`, no `error.tsx`, no `<Suspense>`, no `useActionState`, no Cache Components, no `generateMetadata`. The starter is technically on Next 16 but follows Next 14-era patterns. Easy wins.

### Theme F — Production readiness is closer to prototype-readiness

No env validation, no security headers, no RLS, no migrations folder, no observability, no rate limit, no health check, no Dockerfile, no CI. Real customers cannot run on this without significant per-customer hardening. Document this prominently or close the gaps.

### Theme G — Eyris's MCP-driven AI affordance is still the single highest-leverage adoption

Across 3 iterations, agents repeatedly hit "the codebase has to be re-discovered every session because COMPONENT.md is static markdown." Building even a minimal MCP server (4-6 read tools + 2 write tools) compounds value across every future Claude session.

---

## See also

- [`REVIEW-eyris-comparison.md`](./REVIEW-eyris-comparison.md) — the original 15-round strategic review.
- [`TODO.md`](./TODO.md) — the prioritized action list, now updated with the new findings from this addendum.
