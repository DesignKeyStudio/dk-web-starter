# REVIEW — dk-web-starter vs Eyris v1.1.3

> Critical, multi-round comparison of `dk-web-starter` against the Eyris v1.1.3 Tailwind admin template. Goal: identify what Eyris is doing right that we should adopt, what dk-web-starter is doing better, what's missing on our side, and what's misaligned or risky in the current starter state.
>
> Methodology: 15 review rounds, each from a distinct angle. Each round produces concrete findings (dk-starter weaknesses, dk-starter strengths, Eyris-adoptable patterns, recommendations). A consolidated TODO list lives in [`TODO.md`](./TODO.md).
>
> Tone: critical. The starter is good but not finished — this document is meant to make it sharper, not to celebrate it.

---

## Executive summary

`dk-web-starter` is more *application-ready* than Eyris (real Prisma schema, working RBAC, three-layer architecture, Storybook, INSTALL.md playbook). Eyris is more *AI-native* and *visually polished* (MCP server, composition patterns, ai-init scaffolder, codified typography, semantic color tokens, i18n, RTL).

The starter has **seven critical issues** that should block declaring it "done":

1. **No MCP server.** The biggest AI-affordance gap. Agents can't query the component / hook / utility / page-pattern catalogue at runtime — they read 228 lines of `COMPONENT.md` every session, costing tokens and missing entries.
2. **`setup.sh` is referenced but doesn't exist.** Both `package.json` (`"setup": "bash setup.sh"`) and `.github/TEMPLATE_README.md` ("bash setup.sh") advertise it. Broken contract.
3. **`DESIGN.md` token schema doesn't match `globals.css`.** YAML lists Material-3-style tokens (`primary-container`, `on-primary`, `tertiary`, `surface-variant`); the actual stylesheet uses shadcn-style tokens (`primary`, `secondary`, `accent`, `muted`, `destructive`). An agent reading DESIGN.md and using `bg-primary-container` produces a class that doesn't exist.
4. **`{{PLACEHOLDERS}}` ship in repo state.** `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `STACK.md` all contain unfilled template strings. The starter is unreadable until INSTALL.md is run — there's no "browse the starter to evaluate it" path.
5. **`lp-org-id` cookie is a tenant-isolation footgun.** httpOnly but unsigned. A logged-in user can edit the cookie to swap orgs and `getAuthContext()` will short-circuit on the cached value for 24h.
6. **Zustand auth store duplicates React Query data and exposes mutation-shaped methods.** Two sources of truth + `addUser`/`updateRole`/`deleteRole` on the store that only mutate local state. Easy way to mis-wire a UI action that skips the DB write.
7. **Stale brand identifiers post-INSTALL.** INSTALL.md does *some* renaming but misses `lp-org-id`, `lp-theme`, `lp-theme-synced`, `lp-auth-store`, the `dk-launchpad` package name lock in `package-lock.json`, BRAND_GRADIENT, etc. After "setup" the codebase still leaks the Launchpad identity.

What Eyris does that we should adopt (in priority order):

1. **MCP server exposing the codebase as agent tools** (component catalogue, code examples, page-pattern scaffolder, theme configurator, page-add tool, starter-cleanup tool).
2. **Codified composition patterns** (CRUD List, Form, Dashboard, Settings, Detail, Calendar) with full code skeletons.
3. **`ai-init` script** scaffolding rules into Claude, Cursor, Copilot, Kiro, Antigravity.
4. **Split rule files** (`@.claude/rules/{overview,data-fetching,styling,auth,routing,server-client,i18n}.md`) instead of one monolithic CLAUDE.md.
5. **Typography codified in `@layer base`** (`<h4>` automatically renders at the right size and weight in both modes; no `text-xl font-semibold ...` repetition).
6. **Semantic color variants** (`bg-primary-subtle`, `bg-primary-deep`, `bg-error-subtle`, `text-info`, `.heading-text`) instead of only `--primary` + `--primary-foreground`.
7. **i18n via next-intl** and RTL support out of the box.
8. **Multiple stack variants** (TS + JS, Next.js + Vite) — dk locks in TS + Next.

What dk-web-starter does better than Eyris (worth preserving):

1. **Three-layer architecture** (Services → Actions → UI). Clean, testable, agent-readable.
2. **Real Prisma schema with RBAC** (Permission / Role / RolePermission / UserRole / UserRoleDepartment models). Eyris is mock-data only.
3. **INSTALL.md as an AI-driven setup playbook.** Eyris has no equivalent.
4. **Multi-DB path support** (Supabase / Postgres-local / SQLite / prototype mode). Eyris is mock-only.
5. **Prototype mode** with mocked auth + ephemeral DB resets on every `npm run dev`. Eyris has no comparable spike-friendly path.
6. **Companion-doc update discipline** built into CLAUDE.md + two Claude skills (`update-codemap`, `update-component`). Eyris doesn't have this.
7. **Detailed commit prefix table** (12 prefixes vs Eyris's ~4 implicit ones).
8. **Storybook 10 wired with addon-vitest and a11y addon.** Eyris has none of this.

---

## Round 1 — Structure, conventions, organization

**Angle:** Folder layout, route grouping, file naming, layer separation.

### dk-starter strengths

- **Three-layer architecture** — `src/lib/services/*` (pure Prisma, no framework imports) → `src/lib/actions/{queries,mutations}.ts` (`"use server"`, auth wrapper) → `src/lib/queries/hooks.ts` (React Query). Cleaner than Eyris's flat `server/actions/` + mock-data pattern.
- **Route groups** `(auth)`, `(platform)` mirror Eyris's `(auth-pages)`, `(protected-pages)` — comparable.
- **`lib/queries/keys.ts`** centralizes React Query keys. Eyris has no equivalent (inline SWR keys).
- **`lib/sidebar-nav.ts`** with typed `SidebarNavItem` interface — agent-friendly source of truth for navigation.
- **`CODEMAP.md` "Where to add what" table** — genuinely better than Eyris's prose folder description.

### dk-starter gaps

1. **`setup.sh` is referenced but missing.** `package.json#scripts.setup` and `.github/TEMPLATE_README.md` both invoke `bash setup.sh`. File does not exist. **Critical: broken contract.**
2. **Stale brand identifiers throughout** — INSTALL.md cleans `package.json`, `prisma/schema.prisma` top comment, `src/lib/brand.ts`, `src/types/index.ts`, `prisma/seed.ts` console logs. It does **not** touch: `lp-org-id` cookie const (`src/lib/actions/auth-context.ts:12`), `lp-theme` storage key (`src/app/layout.tsx:28`), `lp-theme-synced` keys (`src/app/(platform)/platform-layout-client.tsx:33,42`, `src/lib/header/header-auth-actions.ts:20`), `lp-auth-store` persist name (`src/lib/stores/auth-store.ts:274`), the `"dk-launchpad"` lock in `package-lock.json:2,8`, `BRAND_GRADIENT` const name.
3. **File-naming inconsistency** — `auth-context.ts` (kebab) but `mappers.ts`, `prisma.ts`, `utils.ts`, `brand.ts` (lowercase single-word); components are kebab-case but exports are PascalCase. Codify this in CLAUDE.md or DESIGN.md.
4. **`(platform)/actions/auth.ts` location is anomalous** — every other server action lives in `src/lib/actions/`. `commitRegistration` is co-located with the auth route. Pick one rule.
5. **`src/lib/header/header-auth-actions.ts` + `header-user-display.ts`** — these feel like UI utilities living in `lib/`. Either move under `components/layout/` or document why they're separate.
6. **`_defaults/` contains only `DESIGN.default.md`** — looks abandoned. Either expand to defaults for PRODUCT/STACK/CLAUDE or fold into INSTALL.md.
7. **Templates ship with `{{PLACEHOLDERS}}`** — CLAUDE.md, PRODUCT.md, DESIGN.md (YAML *and* prose), STACK.md YAML. **A developer reading the starter cold to evaluate it sees template tokens.** Eyris ships fully-rendered docs from day one.
8. **No domain/feature-folder pattern** — as the app grows past dashboard + settings, the flat `(platform)` will get crowded. Consider an `(platform)/apps/<feature>/` convention (Eyris does this).

### What Eyris does (and we should consider)

- Eyris's `server/actions/` lives directly under `src/` and is feature-organized (e.g., `server/actions/dashboard.ts`, `theme.ts`, `locale.ts`). Worth comparing as we scale beyond settings.
- Eyris ships routes as `(auth-pages)`, `(protected-pages)`, `(public-pages)` — explicit third group for marketing/legal/etc. dk has `(auth)` + `(platform)` only; consider adding `(public)`.

### Recommendations

- Decide: keep the shell-script setup path or delete it. If keep, write `setup.sh`. If drop, remove from `package.json` and `.github/TEMPLATE_README.md`.
- Run a `lp-` audit + global rename to `<slug>-` (or just `app-`) during INSTALL.md Phase 2. Better: refactor those into a single constant `STORAGE_PREFIX` in a central file so renames are one-line.
- Move `(platform)/actions/auth.ts` to `src/lib/actions/auth.ts` or document the exception in CODEMAP.
- Ship CLAUDE.md / DESIGN.md / STACK.md with reasonable defaults filled in (matching `_defaults/DESIGN.default.md`); have INSTALL.md *replace*, not *fill*.

---

## Round 2 — AI integration (MCP + agent rules)

**Angle:** What surface does this starter expose to AI coding agents? How fast can an agent become productive in it?

### dk-starter strengths

- **Companion-doc update discipline** (CLAUDE.md "Update discipline" section + two Claude skills `update-codemap`, `update-component`). Forces docs to stay in sync with code. **Eyris has nothing equivalent.**
- **Commit prefix table** (12 prefixes) — clearer than industry convention.
- **CODEMAP.md "Where to add what" table** — the single best agent-onboarding artifact in this repo. Tells Claude exactly where to drop a new service, action, hook, query, route, etc.
- **INSTALL.md as a Claude-Code-driven setup playbook** with `AskUserQuestion` references, phase numbering, stop-conditions, and per-DB-path routing. **Eyris has no equivalent**; this is a strict win.
- **Project-level Claude skills** under `.claude/skills/` — Eyris uses rule files, we use skills, both are valid.

### dk-starter gaps

1. **No MCP server.** This is the largest single gap vs Eyris.
   - Eyris exposes 14 tools: `list_all_components`, `search_components`, `get_component`, `get_code_examples`, `list_all_hooks`, `search_hooks`, `get_hook`, `list_all_utilities`, `search_utilities`, `get_utility`, `get_composition_patterns`, `scaffold_pattern_view`, `add_new_page`, `cleanup_starter_code`, `configure_theme`.
   - dk has `COMPONENT.md` (static markdown, 228 lines). An agent asking "what badges are available?" reads the entire file.
   - **No structured query** → wasted tokens every session.
   - **No write tools** → agent can't ask the system to scaffold a page; it has to write files manually and remember to update sidebar-nav.ts + CODEMAP.md + COMPONENT.md.
2. **No codified composition patterns.** Eyris ships 6 page archetypes (CRUD List, Form, Dashboard, Settings, Detail, Calendar) with full code skeletons that the MCP `scaffold_pattern_view` substitutes entity names into. dk has nothing — every new page is from scratch.
3. **No `ai-init` script.** Eyris scaffolds rules for 5 AI tools (Claude / Cursor / Copilot / Kiro / Antigravity). dk supports Claude Code only. Teams using Cursor are second-class.
4. **Monolithic CLAUDE.md.** dk's CLAUDE.md is short (84 lines) but it offloads all real guidance to companion docs and trusts the agent to load them via the "Companion docs — load when relevant" hint. Eyris splits rules into 7 files (overview / data-fetching / styling / auth / routing / server-client / i18n) imported with `@.claude/rules/*.md` so the agent loads them automatically.
5. **No anti-pattern enforcement.** Eyris's `data-fetching.md` ends with a `## Anti-Patterns — Never Do These` block (banned: fetch in useEffect, fetch in Zustand store, Axios in Server Components, SWR with no SSR initial data). dk's docs describe what to do but not what to avoid.
6. **No "first prompts to try" section** in README/CLAUDE.md. New agents don't know what to ask first.

### What Eyris does (we should adopt)

- **Build an MCP server** (`mcp-server/`) that catalogues `src/components/{ui,reui,custom,layout,data-table}/`, `src/hooks/`, `src/lib/services/`, `src/lib/queries/hooks.ts`, plus Prisma models, plus codified page patterns. Tools to expose:
  - `list_components` / `search_components` / `get_component` (with story/usage if available)
  - `list_hooks` / `get_hook`
  - `list_services` / `get_service` (with method signatures)
  - `list_prisma_models` / `get_model`
  - `list_page_patterns` / `get_pattern`
  - **Write tools** (most valuable): `scaffold_page` (creates page.tsx + service + action + hook + sidebar-nav entry + COMPONENT.md update + CODEMAP.md update), `scaffold_service`, `scaffold_form`, `cleanup_starter` (drop demo dashboard/notifications/settings stubs we don't need).
- **Codify 6 page patterns** matching Eyris's set, adapted to dk's three-layer architecture.
- **Split CLAUDE.md** into `.claude/rules/{overview,architecture,components,data,auth,styling,testing}.md`. Keep CLAUDE.md as the orchestrator (`@.claude/rules/...` imports).
- **Add `ai-init`** equivalent so Cursor users and others can adopt the same starter.

### What dk does better than Eyris (preserve)

- The "Update discipline" idea — when adding/renaming/removing code, you must update CODEMAP/COMPONENT/DESIGN in the same commit. Eyris doesn't enforce this.
- Claude skills (`update-codemap`, `update-component`) — auto-invoke when files change. Eyris doesn't use this surface.

### Recommendations

- Highest ROI improvement to this starter: **build the MCP server**. Even a minimal version (list_components, get_component, scaffold_page) makes the starter dramatically more agent-friendly than COMPONENT.md alone.
- Add a "Try first" prompts block to README.md to onboard agents fast.

---

## Round 3 — Component library, design system, theming

**Angle:** UI primitives, design tokens, dark mode, typography, semantic colors.

### dk-starter strengths

- **shadcn/ui (47 components) + ReUI (8 component families incl. DataGrid)** — large surface area without locking us into a custom library forever.
- **OKLCh color space** for tokens — perceptually uniform, modern.
- **next-themes** + class strategy — standard dark/light pattern.
- **`tw-animate-css`** preinstalled — animation primitives.
- **`@base-ui/react`** preinstalled — gives us a path beyond Radix if needed.
- **Storybook 10 with stories for 30 components** (about 37% coverage).
- **DESIGN.md follows Google Stitch format** (YAML front matter + prose) — machine-readable + human-readable.

### dk-starter gaps

1. **DESIGN.md ↔ globals.css token drift** (already flagged in executive summary). YAML lists `primary-container`, `on-primary`, `tertiary`, `surface-variant`. Stylesheet uses `primary`, `secondary`, `accent`, `muted`, `destructive`, `success`, `info`, `warning`. **Pick one; sync both.**
2. **Typography is not codified in `@layer base`**. Eyris does:
   ```css
   @layer base {
     h4 { @apply text-xl font-semibold text-gray-900 dark:text-gray-100; }
     h5 { @apply text-lg font-semibold ...; }
     /* etc. */
   }
   ```
   Agents writing `<h4>Page Title</h4>` get the right size + weight + dark-mode-adapted color automatically. dk leaves this to each component to handle; consistency suffers.
3. **No semantic color variants beyond `primary` + `primary-foreground`**. Eyris ships:
   - `bg-primary-deep` (hover/pressed)
   - `bg-primary-mild` (lighter)
   - `bg-primary-subtle` (low-opacity tint for backgrounds/badges)
   - Same for `error`, `success`, `info`, `warning`
   - `.heading-text` utility (dark/light-mode-aware emphasis)
   
   dk gets `bg-primary/10` etc. with Tailwind's opacity modifiers, but that's not semantic and harder for agents to discover.
4. **No control-size primitive**. Eyris defines `TypeAttributes.ControlSize = 'sm' | 'md' | 'lg'` (heights 32/40/48px) used consistently across Button/Input/Select. dk uses shadcn's `default | sm | lg | icon` per-component, inconsistent across primitives.
5. **No RTL support**. Eyris ships RTL with `dir="rtl"` on `<html>` + utility classes. dk has nothing.
6. **Single sidebar style** (dark navy hardcoded in `globals.css:90`). Eyris ships multiple layout types (light/dark sidebar, vertical/horizontal/stacked/modern).
7. **Component-naming/exports kebab-case-file but PascalCase-export** is correct but uncodified. Document in DESIGN.md or CLAUDE.md.
8. **Storybook coverage is ~37%** (30 stories / ~80 components). Missing stories on most of `ui/` primitives. Stories should be table stakes for an agent-discoverable starter.
9. **No story-vs-MCP question answered**. Without an MCP, Storybook is the only "browse components visually" path. If we build the MCP, we should decide whether stories duplicate effort or remain as the visual-verification layer (the latter is the right call).
10. **`@base-ui/react`** is in dependencies but I don't see it used. Either use or remove.

### What Eyris does (we should adopt)

- **Codify typography** in `@layer base` and document it in DESIGN.md.
- **Add semantic color variants** (`*-deep`, `*-mild`, `*-subtle`) in `globals.css` `:root` + `.dark` and document agentic usage rules in DESIGN.md.
- **Add `.heading-text`** utility (`@apply text-gray-900 dark:text-gray-100`).
- **Add ControlSize type** in `src/types/` and adopt across Button/Input/Select wrappers.
- **Add RTL support** if any non-LTR market is plausible.

### Recommendations

- **Fix DESIGN.md ↔ globals.css drift immediately.** Pick the shadcn token set (it's already implemented in CSS). Rewrite DESIGN.md YAML to match. Tests this lands in the MCP build later.
- **Codify typography in `@layer base`.** Two-file change (`globals.css` + DESIGN.md prose).
- **Decide on Storybook strategy.** Either commit to 100% coverage with a CI gate, or scope it down to "stories for custom + layout + data-table only" and let `ui/` and `reui/` rely on upstream docs.

---

## Round 4 — Data fetching, state, server/client boundaries

**Angle:** Where does data come from, how does state flow, what's the boundary between Server Components and Client Components.

### dk-starter strengths

- **Three-layer architecture** (Services → Server Actions → React Query hooks) is genuinely cleaner than Eyris's `server/actions/` + mock-data flat structure.
- **Services are pure** (no Next.js, no Supabase imports) → testable in plain Vitest, fast to mock.
- **React Query 5 with centralized `queryKeys`** + `staleTime: 5min` + 1 retry — robust default.
- **`getAuthContext()` cookie-cached** orgId saves ~800ms per server-action call after the first DB lookup.
- **Org-scoping at application level** (replaces Supabase RLS) — pragmatic for a Prisma-first design.
- **`lib/actions/mappers.ts`** handles Date/Decimal/junction-to-ID conversions — good agent-boundary file.
- **`bulkRemoveDepartments`** shows a bulk-operation pattern.

### dk-starter gaps

1. **Zustand auth store duplicates React Query data.** The store holds `users`, `organizations`, `roles`, `permissions`, `userRoles` — the same data React Query also fetches. Two sources of truth → drift risk.
2. **Zustand store exposes mutation-shaped methods** (`addUser`, `updateRole`, `deleteRole`, `deactivateUser`) that only mutate local state. An agent who sees `useAuthStore.getState().addUser({...})` will reasonably assume it persists. It does not. **Refactor**: prefix local-only mutators (`_localAddUser`) or remove them entirely (rely on React Query `setQueryData` for optimistic updates).
3. **`getAuthContext()` cookie-cache is unsigned.** A logged-in user with cookie-editing tools can set `lp-org-id=<other-org-id>` and the auth context short-circuits to that org for 24 hours. **Critical tenant-isolation bug.** Either sign the cookie (Next.js cookies API supports this with a secret), or skip the cache (cost: ~800ms per request, but a one-query-per-session pattern can fix this another way).
4. **Cookie doesn't invalidate on org switch.** If we add multi-org support, `setActiveOrg(newOrgId)` must `clearOrgCache()` first.
5. **`hasPermission()` as Zustand selector** — Zustand recomputes on every state mutation. With `subscribeWithSelector` not enabled, every component reading `hasPermission` re-renders on any auth-store change. CODEMAP.md warns "Never select store methods as selectors" but the rule is buried. Move this to a prominent rule (in `.claude/rules/data.md` or similar).
6. **No optimistic update pattern documented.** React Query `useMutation` + `onMutate` for instant feedback isn't shown anywhere.
7. **No `loading.tsx` files at route boundaries.** Next.js 16 streaming benefits are unused. `platform-shell-loader.tsx` is for the initial bootstrap, not per-route.
8. **No Suspense pattern** for server-fetched data in Server Components.
9. **`useAuthStore` cardinality risk.** 10k users × 5 fields × persisted to sessionStorage = noticeable storage + serialization cost. Document a cap (e.g., load only "active users in current viewer's department" by default).
10. **No real-time pattern.** Supabase has realtime; dk doesn't use it. For SaaS notifications/activity, polling via React Query is fine for now but a documented "when to add realtime" guidance would help.
11. **`bulkRemove`** is fine but there's no `bulkUpdate` or `bulkCreate` example. Common SaaS operation, missing primitive.

### What Eyris does

- Eyris splits fetching into **3 strict modes**: Server Actions for initial data, SWR for client-side refetch, Zustand strictly for UI state (sidebar open, active tab, theme). The `data-fetching.md` rule file has a banned-patterns block at the end.
- Eyris's SSR-fallback-data pattern (`useSWR(key, fetcher, { fallbackData: serverInitial })`) prevents the loading flash. dk uses React Query but doesn't show this hydration pattern.

### Recommendations

- **Sign the `lp-org-id` cookie** or eliminate it. This is a security fix, not nice-to-have.
- **Refactor Zustand store** to be UI-state-only (theme, sidebar open, last-viewed-tab). Move users/roles/permissions/userRoles fully into React Query. Replace `hasPermission` selector with a React Query–backed `usePermissions()` hook that derives.
- **Document optimistic-update + invalidation patterns** with one concrete example in a `.claude/rules/data.md` rule file.
- **Add `loading.tsx`** files to at least `(platform)/dashboard/`, `(platform)/settings/`.
- **Document realtime decision** explicitly (yes/no, when).

---

## Round 5 — Developer experience, tooling, onboarding

**Angle:** What's it like for a developer/agent on day one? What guardrails catch mistakes?

### dk-starter strengths

- **INSTALL.md as a Claude-Code-driven setup playbook** — phase-numbered, stop-conditions, per-DB-path branching, `AskUserQuestion` integration. Excellent agentic pattern.
- **Storybook + Vitest browser tests via `@storybook/addon-vitest`** — visual regression possible.
- **Turbopack dev** — fast HMR.
- **Prisma + `predev` hook** for prototype-mode boot — clever.
- **Commit prefix table** — clearer than any team I've worked on.
- **Doc-update discipline rule** — forces map-stays-current.

### dk-starter gaps

1. **`setup.sh` referenced but missing.** Already flagged.
2. **No `.prettierrc` / `.prettierrc.json` / `prettier.config.js`.** No formatting config = inconsistent style across contributors.
3. **No `husky` / `lint-staged`.** No pre-commit hook to run lint/format. Easy to land malformed code.
4. **No `.editorconfig`.** Editor doesn't auto-set tab/space/EOL for new contributors.
5. **No `.nvmrc`.** Node version not pinned. CI and tooling guess.
6. **No GitHub Actions workflows.** `.github/` has only `TEMPLATE_README.md`. No lint/test/build gate on PRs.
7. **`tests/unit/` and `tests/integration/` are empty.** Vitest configured with two projects but zero tests = no protection.
8. **No `npm run check` / `npm run validate` aggregate.** Best practice: `"check": "npm run lint && npm run typecheck && npm run test"`.
9. **No `typecheck` script** explicitly. `tsc --noEmit` is the standard.
10. **`build` includes Storybook** (`prisma generate && bash scripts/build-storybook.sh && next build`). Slow. Most teams don't ship Storybook with prod. Split into `npm run build` (app only) and `npm run build:full` (with Storybook).
11. **`prisma db seed` requires `tsx` via npx.** Not in devDependencies. Slow first-run. Add `tsx` to devDeps.
12. **No `prisma format` / `prisma validate`** scripts.
13. **README quickstart depends on Claude Code.** The only documented "quick start" is `git clone` + open Claude Code + prompt. Manual path requires reading INSTALL.md and translating to commands. **Add a 5-line "manual quickstart" block.**
14. **No GitHub PR template, issue template, CONTRIBUTING.md, CODE_OF_CONDUCT.md, LICENSE.** Standard repo hygiene.
15. **`{{PLACEHOLDERS}}` in companion docs** — already flagged. Day-one read is broken without INSTALL.md.
16. **README "Verification checklist"** is hand-runnable but should be a script (`npm run verify`).

### What Eyris does

- **`mcp-server/setup.sh`** ships in every variant (and is documented). dk's setup.sh is missing.
- **`npm run ai-init -- --claude --cursor --copilot`** scaffolds AI tool rules. dk has a manual `.claude/skills/` setup.
- Eyris README has a "Try It" section with example prompts. dk has no example prompt block.

### Recommendations

- Add `.prettierrc`, `.editorconfig`, `.nvmrc`.
- Add Husky + lint-staged with pre-commit hook (`lint` + `prettier --check`).
- Add at least one example unit test and one example integration test (probably for `getAuthContext` and a service function).
- Add GitHub Actions: `lint`, `typecheck`, `test`, `build` matrix.
- Split `build` script: app-only by default, full with Storybook opt-in.
- Add `npm run check` / `npm run verify` aggregates.
- Add a manual quickstart block to README.

---

## Round 6 — Auth & security

**Angle:** Threat model. Tenant isolation. Cookie/session hygiene. Secrets handling.

### dk-starter strengths

- **Supabase Auth via `@supabase/ssr`** — modern cookie-based pattern, no JWT exposure to JS by default.
- **Middleware-level session refresh + route guards** in `middleware.ts` → `updateSession()`.
- **Explicit RBAC schema** (Permission / Role / RolePermission / UserRole / UserRoleDepartment models). Department-scoping is in the model.
- **`activityLog` table** — audit trail by design.
- **Service role key not exposed client-side** (only used in admin Supabase client + server-only contexts).
- **Org-scoped queries** via `getAuthContext()` — every action calls it.

### dk-starter gaps

1. **Unsigned `lp-org-id` cookie** — **critical tenant isolation issue**. Already flagged. Sign it with a secret, or skip the cache, or scope to current session via Supabase metadata.
2. **No tenant-isolation tests.** Every service that accepts `organizationId` could leak data if a contributor forgets the filter. A regression test ("user A from org X cannot query/update org Y data") should be in `tests/integration/`.
3. **No rate limiting** on auth endpoints (Supabase has some platform-level protection but app-side `/api/auth/callback` etc. are unbounded).
4. **No CSP / security headers configured** in `next.config.ts` (haven't read it in this review yet; if absent, add `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, default-src CSP).
5. **`PROTOTYPE_DEMO_USER.id` is a fixed UUID.** If `NEXT_PUBLIC_PROTOTYPE_MODE=true` is accidentally set in production (e.g., copied env), every visitor is "logged in" as the demo user. The bootstrap script wipes the DB, masking this in dev but enabling silent compromise if deployed. **Add a runtime assertion: refuse to boot in prod-mode if `NEXT_PUBLIC_PROTOTYPE_MODE === "true"`** (check `NODE_ENV === "production"`).
6. **No password complexity rules visible** in `validations/auth.ts` — should verify. Supabase has its own min-length but app should enforce too.
7. **No 2FA / MFA path** documented.
8. **No session revocation pattern** (admin "kick this user out").
9. **No "force re-auth for sensitive actions"** pattern (delete org, change owner).
10. **`SUPABASE_SERVICE_ROLE_KEY`** in `.env.example` has `eyJ...` example value with no "NEVER COMMIT, NEVER EXPOSE TO CLIENT" warning. Add the warning prominently.
11. **No `SECURITY.md`** — no vulnerability disclosure process.

### What Eyris does

- Eyris is mock-only so doesn't face most of these. The lesson is the reverse: dk is real-DB and inherits all the threats that mock-data doesn't.
- Eyris's `auth.md` rule file has a "Sign In / Sign Out" Server Action vs Client method distinction. dk should document this.

### Recommendations

- **Sign the org cookie or drop the cache.** Highest-priority security fix.
- **Add tenant-isolation tests** as a first integration test.
- **Add prod-mode prototype guard.**
- **Add security headers to `next.config.ts`.**
- **Add `SECURITY.md`** with a contact and process.

---

## Round 7 — Accessibility

**Angle:** Can people with screen readers, keyboard-only navigation, motion sensitivity use the app?

### dk-starter strengths

- DESIGN.md has an explicit **"Accessibility floor"** paragraph: WCAG AA contrast, focus rings, 44×44 tap targets, aria-label on icon buttons, Label on form fields, prefers-reduced-motion.
- **shadcn → Radix primitives** — strong a11y baseline (focus management, keyboard nav, ARIA roles built-in).
- **Storybook `@storybook/addon-a11y`** — axe-core runs on stories.

### dk-starter gaps

1. **No skip-link** in app shell. Standard a11y pattern for keyboard users.
2. **Sidebar permission-gated items use `hidden` (CSS only)?** Need to verify — should be conditional rendering, not `display: none`, so they're absent from the tab order. (Have not verified the AppSidebar code yet.)
3. **No `useReducedMotion()` enforcement.** DESIGN.md mentions it; no code reference. Animations from `tw-animate-css` likely don't gate on it.
4. **DataGrid virtual scrolling** — virtual rows break screen readers without `aria-rowcount` + `aria-rowindex`. Document the pattern.
5. **No automated a11y test gate.** axe runs in Storybook but failures aren't blocking. Add `npm run test:a11y` script.
6. **Color contrast for OKLCh** — DESIGN.md says WCAG AA but no token-by-token check. Run a contrast check against the implemented `:root` and `.dark` tokens.
7. **No screen-reader-only utility** (e.g., `.sr-only`). shadcn includes it; verify exposure.

### Recommendations

- Add a skip-link in `(platform)/layout.tsx`.
- Verify sidebar permission-gating uses conditional render not CSS hide.
- Add `useReducedMotion()` to any non-trivial animation.
- Run axe-core in CI against built Storybook.

---

## Round 8 — Performance

**Angle:** Build time. Runtime cost. First-paint. Bundle size. Cold start.

### dk-starter strengths

- **Turbopack dev** — fast HMR.
- **React Query 5min stale time** — caches aggressively.
- **`getAuthContext` cookie cache** — saves DB round-trip per server action.
- **Prisma client generated once at build** — no runtime overhead.

### dk-starter gaps

1. **`build` runs Storybook** — slows CI/CD by minutes. Split into separate scripts.
2. **Sidebar hydration flash** — sidebar depends on `useAuthStore` (sessionStorage). First paint will show nav without permission filtering, then re-render. Either SSR the nav with server-side permission check or render a skeleton first.
3. **No bundle analyzer** wired (`@next/bundle-analyzer`).
4. **Font loading not verified.** README mentions `var(--font-inter)` in `globals.css` but layout.tsx font import wasn't reviewed. Verify `font-display: swap` and subset.
5. **No image optimization patterns documented** (`next/image` usage, remote pattern config).
6. **No `loading.tsx`** files → no streaming → empty page until full Server Component resolves.
7. **`KpiCard` on dashboard reads from Zustand** (sessionStorage), so the dashboard shows `—` until the store hydrates. Fetch via React Query with SSR fallback instead.
8. **`predev` hook runs on every `npm run dev`** even when prototype mode is off (it no-ops, but adds startup latency). Move the check earlier.
9. **No Vercel/Edge runtime hints.** All routes default to Node runtime. Some auth callbacks could go Edge.

### Recommendations

- Split `build`. Add `analyze` script. Add a `loading.tsx`. Audit Zustand-only data display on dashboard.

---

## Round 9 — Documentation accuracy / drift

**Angle:** Do the docs match reality? This matters more here than in most codebases because the docs are the agent's eyes.

### Drift items found

1. **`DESIGN.md` YAML tokens vs `globals.css`** — discussed in R3. Critical.
2. **`CLAUDE.md` ships with `{{PROJECT_NAME}}` placeholder.** R1.
3. **`PRODUCT.md` ships with `{{...}}` placeholders.** R1.
4. **`STACK.md` YAML ships with `{{...}}` placeholders.** R1.
5. **`README.md` quickstart path** mentions `bash setup.sh` indirectly via `.github/TEMPLATE_README.md`. `setup.sh` doesn't exist.
6. **`CODEMAP.md` claims** `src/lib/header/header-auth-actions.ts` and `header-user-display.ts` exist. Verified — they do.
7. **`COMPONENT.md` lists `ButtonGroup` at `ui/button-group.tsx`.** Not verified in this review; check.
8. **`README.md` says "Bootstrap pattern (Zustand hydrated from DB on first load)".** Bootstrap mechanism is in `src/lib/platform-layout-bootstrap.ts`. Verified file exists; mechanism not deeply inspected.
9. **`README.md` default seed credentials** `admin@example.com` / `AdminPass123!`. Not verified vs `prisma/seed.ts` in this review.
10. **`STACK.md` says "Prisma 6", "shadcn 3", "Tailwind v4", "Next.js 16"** — package.json confirms.
11. **`COMPONENT.md` entries** mostly match files seen; spot-check more during MCP-server build.

### Recommendations

- After every major change, run the `update-codemap` skill. Same for `update-component`.
- Add a `docs:audit` script: `node scripts/docs-audit.mjs` that diffs `CODEMAP.md` against the filesystem and exits 1 on drift. Use in CI.
- **Fix DESIGN.md ↔ globals.css drift now** (R3).
- **Ship companion docs with defaults filled** (R1).

---

## Round 10 — Naming, types, consistency

**Angle:** Names are interfaces. Inconsistent names are bugs waiting.

### Findings

1. **Prisma enum naming snake_case** (`notification_type`, `activity_action`, `user_theme`, `org_plan`) — non-standard; usually PascalCase. Probably to match Postgres native enum types, but Prisma allows arbitrary names. **Verdict: keep if intentional, document why in CODEMAP.**
2. **File naming inconsistent** — `auth-context.ts` (kebab), `mappers.ts` (single word), `prisma.ts`, `utils.ts`, `brand.ts` (single word), `header/header-auth-actions.ts` (kebab). Codify: lib utilities are single-word lowercase; multi-word are kebab-case.
3. **`src/types/index.ts`** — single barrel file. Fine for small projects; once it grows past ~10 interfaces, split by domain.
4. **No branded ID types** (`UserId`, `OrgId`, `RoleId`). Cheap to add (`type UserId = string & { __brand: 'UserId' }`). Big payoff: passing a `roleId` where a `userId` is expected fails at compile time. Helps prevent tenant-isolation bugs.
5. **`useAuthStore` actions named like server mutations** (`addUser`, `updateRole`, `deleteRole`). Rename to `setLocalUsers`, `applyOptimisticRoleUpdate`, etc. — make it explicit they don't persist.
6. **Component file vs export naming** (file kebab, export Pascal) is correct but uncodified. Document in DESIGN.md or CLAUDE.md.
7. **`platform-layout-bootstrap.ts`** + **`platform-layout-client.tsx`** — co-locate?
8. **`lp-`-prefixed identifiers** (storage keys, cookies). Refactor to a single `STORAGE_PREFIX` constant for one-line rebrands.

### Recommendations

- Add a "Naming" section to CLAUDE.md or DESIGN.md.
- Consider branded ID types for `UserId`, `OrganizationId`, `RoleId`, `DepartmentId`.
- Audit `lp-*` literals; consolidate to a single prefix constant.

---

## Round 11 — i18n, RTL, localization

**Angle:** Can the product ship to non-English markets?

### dk-starter strengths

- date-fns is installed (localizable).

### dk-starter gaps

1. **No i18n library** (next-intl, next-i18next, lingui). All UI strings hardcoded English in JSX.
2. **No `messages/` directory** for translatable strings.
3. **No locale routing** (`/en/...`, `/fr/...`).
4. **No locale detection** (Accept-Language, cookie).
5. **No `dir` switching for RTL.**
6. **No locale-aware date/number/currency formatting utilities.**
7. **Activity log labels** likely hardcoded English (`"created"`, `"updated"`, `"deleted"`).

### What Eyris does

- Ships next-intl. `getTranslations` in Server Components, `useTranslations` in Client Components. Locale stored in cookie via `getLocale` / `setLocale` server actions. `messages/en.json` with namespaced keys. Documented in `.claude/rules/i18n.md`.

### Recommendations

- Decide explicitly: is i18n in scope? If yes, add next-intl scaffolding now. Adding it later is painful — every component needs `useTranslations()` wrapping.
- At minimum, factor user-facing strings into a `messages/en.json` even if you don't add translation tooling immediately. Makes the conversion trivial later.

---

## Round 12 — Error handling, observability

**Angle:** When something breaks in prod, can we find out why?

### dk-starter strengths

- Server actions throw `Error("Not authenticated")` — predictable.
- React Query handles fetch errors with retry.
- Sonner installed for toasts — error-feedback surface ready.
- `activityLog` captures user actions.

### dk-starter gaps

1. **No `error.tsx`** route-level error boundary in `(platform)/` or `(auth)/`. Next.js convention; without it, errors bubble to the global error boundary which is ugly.
2. **No global error boundary** that includes a "Report this error" affordance.
3. **No structured logging.** `console.error` is fine for dev; in prod we need a sink (Sentry / Logtail / Axiom / Better Stack).
4. **No request ID correlation.** Hard to trace a bug across logs.
5. **Server actions throw raw `Error`** — switch to typed errors (`AuthError`, `NotFoundError`, `PermissionError`) so the UI can handle each case differently.
6. **No global toast pattern** for React Query errors documented (despite Sonner being installed).
7. **`activityLog` captures successes only.** Errors (failed sign-in, denied permission attempts) are not logged. Security signal lost.
8. **No health check endpoint** (`/api/health`).
9. **No monitoring config** (Sentry DSN, OpenTelemetry exporter).

### Recommendations

- Add `error.tsx` at `(platform)/` and `(auth)/`.
- Add typed error classes; surface them via Sonner globally in `QueryClientProvider`.
- Add `/api/health` returning DB + auth ping.
- Pick one observability vendor and add the SDK as opt-in (DSN-controlled).

---

## Round 13 — Testing depth, quality gates

**Angle:** What protects us from regressions?

### dk-starter strengths

- Vitest 4 with projects (integration + storybook visual).
- `@vitest/coverage-v8` installed.
- `@vitest/browser-playwright` installed.
- Playwright installed (browser automation).

### dk-starter gaps

1. **Zero test files.** `tests/unit/` and `tests/integration/` are empty.
2. **No E2E tests.** Playwright is installed but only used by Storybook visual tests.
3. **No tenant-isolation regression test** — critical given the unsigned-org-cookie risk.
4. **No permission-gating tests** — RBAC bugs are silent in dev (you see what you expect because you're admin).
5. **No CI runs tests** — there are no GitHub Actions yet.
6. **No coverage threshold enforced.**
7. **Storybook visual tests** are configured but no story-level interaction tests written.
8. **No DB seeding for tests** — integration tests would need a clean DB per run.
9. **No mocking strategy documented.** Services should be testable with mocked Prisma; no example.

### Recommendations

- Land 3 example tests:
  1. **Unit**: `getAuthContext` with mocked Supabase + Prisma.
  2. **Integration**: a service function with a real Postgres + test schema.
  3. **E2E**: sign-in → reach `/dashboard` → see KPIs.
- Add `npm run test:ci` aggregating unit + integration + a11y.
- Wire into GitHub Actions.

---

## Round 14 — Build, deploy, CI/CD

**Angle:** From git push to running in prod.

### dk-starter strengths

- Vercel-friendly Next.js setup.
- Turbopack for dev.
- Prisma client generated at build time.
- `predev` hook for prototype mode.

### dk-starter gaps

1. **No GitHub Actions workflows.** No CI.
2. **No Vercel project config** (`vercel.json` if needed) or deploy guide.
3. **No Dockerfile** for self-hosting.
4. **No staging env documented** in `.env.example`.
5. **No DB migration step in CI** — Prisma migrations should run on deploy (or in a pre-deploy job).
6. **No build cache strategy** for CI (Turbo? Next cache? Prisma cache?).
7. **No `release` workflow** (changelog, tag).
8. **No `next.config.ts` security headers** (verify).
9. **`build` builds Storybook every time** — slow.
10. **No bundle-size guardrail** (e.g., `next-bundle-analyzer` + budget threshold).
11. **No environment-promotion strategy** documented.
12. **No rollback strategy** documented.

### Recommendations

- Add `.github/workflows/ci.yml` (lint + typecheck + test + build on PR).
- Add `.github/workflows/deploy.yml` (Vercel deploy on main).
- Add a `DEPLOY.md` or section in STACK.md.

---

## Round 15 — Notifications, jobs, integrations

**Angle:** What does a SaaS need beyond CRUD that's missing?

### dk-starter strengths

- `Notification` model in Prisma — schema-level support.
- `/notifications` route + page exists.
- `Settings → Integrations` route exists as a skeleton.

### dk-starter gaps

1. **No email delivery integration** (Resend, Postmark, SES). Supabase Auth sends auth emails; the app sends nothing else. Welcome email? Notification email? Receipt? None.
2. **No background job system** (Inngest, Trigger.dev, BullMQ). Settings → Activity Log mutations are synchronous; any batch operation blocks request thread.
3. **No webhook receiver pattern.** SaaS integrations (Stripe, GitHub, etc.) need this.
4. **No outbound webhook pattern** (notify customer's system of events).
5. **No file upload pattern** — Supabase Storage exists; not wired.
6. **No PDF generation pattern.**
7. **Notification delivery is in-app only.** No email/SMS/push.
8. **No SSE / WebSocket pattern** for real-time notification badge updates (counts via React Query polling only).
9. **`Settings → Integrations`** is a skeleton — what was the design intent? Document or scaffold one concrete integration as an example.
10. **`Settings → Billing`** is also a skeleton. Stripe Checkout? Stripe Customer Portal? Pick a provider and scaffold.

### Recommendations

- Decide which "SaaS table-stakes" to include in the starter:
  - **Tier 1 (most starters include)**: outbound email (one provider, abstracted), file upload (Supabase Storage), Stripe billing scaffold.
  - **Tier 2**: background jobs, real-time, webhooks.
- Document the deferred ones in STACK.md as "out of scope, add yourself".

---

## Convergence check

After 15 rounds covering:

- R1 Structure
- R2 AI integration
- R3 Design system
- R4 Data layer
- R5 DX/tooling
- R6 Auth/security
- R7 Accessibility
- R8 Performance
- R9 Doc drift
- R10 Naming/types
- R11 i18n
- R12 Error handling/observability
- R13 Testing depth
- R14 CI/CD/deploy
- R15 Notifications/jobs/integrations

Remaining uncovered angles considered:

- **License / legal** — minor. Add LICENSE file; not strategic.
- **Mobile/responsive design** — touched in R3 (no documented breakpoint conventions beyond DESIGN.md prose) and R7. Not strategic for a starter; concrete mobile QA happens per-feature.
- **Versioning strategy / SemVer** — minor. Internal starter, no public consumers yet.
- **Specific component-level improvements** (e.g., does Button properly handle async states?) — implementation detail, belongs in PR-level review, not strategy review.
- **Bundle composition per route** — derived from R8/R14; further analysis requires a build.
- **Developer-tier vs admin-tier feature split** — premature; depends on product.

**Decision: stop at 15 rounds.** The remaining angles are either minor (LICENSE) or downstream of strategic decisions already raised (mobile QA, bundle analysis). The MCP-server build will surface implementation-level details when it scans the codebase to populate the manifest — leave that for that work item.

---

## Cross-cutting themes (synthesis)

After 15 rounds, four meta-patterns emerge:

### Theme A — Agent-friendliness is *the* differentiator

The single biggest delta between this starter and Eyris is how well an AI agent can become productive in it. dk has good *static* artifacts (CODEMAP.md, COMPONENT.md, INSTALL.md, the update-codemap and update-component skills). Eyris has the same *kinds* of artifacts plus a *live, queryable* surface (MCP server). The MCP turns "search 228 lines of markdown" into "call `get_component` and get structured JSON". The compounding effect over a long session is large.

**This is the highest-ROI improvement available.**

### Theme B — The starter ships in an "uncommitted" state

Templates use `{{PLACEHOLDERS}}`, the `dk-launchpad` brand leaks through `lp-*` identifiers, `setup.sh` is missing, DESIGN.md tokens don't match implementation. The starter assumes you'll run INSTALL.md before reading anything. **Evaluation-by-browsing is broken.**

The fix is to ship defaults filled in, treat INSTALL.md as *replace*, not *fill*, and audit for stale brand identifiers.

### Theme C — Real-DB power means real-DB responsibility

Eyris is mock-only so it sidesteps tenant isolation, secret management, signed cookies, prod-mode guards, etc. dk has real Prisma + RBAC + multi-tenant scoping — strictly better for production — but inherits all the threats. The starter doesn't yet have the test coverage, signed-cookie pattern, or prod-mode assertions to match the power it ships. **This is a security gap, not a nice-to-have.**

### Theme D — Visual polish is uncodified

Typography, semantic color variants, sizing primitives, dark-mode-aware emphasis utilities — Eyris bakes these into `@layer base` so the agent gets them for free. dk leaves them implicit, scattered across components and prose docs. Result: agent-written UI looks slightly different each time.

**Codifying typography + semantic tokens is a half-day's work with multi-year payoff.**

---

## What dk-starter is doing right (preserve these)

1. **Three-layer architecture** (Services → Actions → UI).
2. **CODEMAP.md "Where to add what"** — the single most useful onboarding artifact.
3. **INSTALL.md** as an AI-driven playbook with `AskUserQuestion` integration.
4. **Companion-doc update discipline** rule + project Claude skills (`update-codemap`, `update-component`).
5. **Real Prisma schema with RBAC** including department-scoping.
6. **Multi-DB path support** (Supabase / Postgres-local / SQLite / prototype) with explicit Phase 4 routing in INSTALL.md.
7. **Prototype mode** with mocked auth + ephemeral DB on every dev boot.
8. **Commit prefix table** (12 prefixes).
9. **OKLCh color tokens** + next-themes integration.
10. **shadcn + ReUI dual registry** — large UI surface with easy upgrades.
11. **Vitest + Storybook + Playwright** wiring (even if not yet exercised).

---

## Action items

See [`TODO.md`](./TODO.md) for the prioritized list. Top five from this review:

1. **Build a minimal MCP server.** [highest impact]
2. **Sign or eliminate the `lp-org-id` cookie.** [security blocker]
3. **Fix `DESIGN.md` ↔ `globals.css` token drift.** [agent-correctness blocker]
4. **Ship `{{PLACEHOLDERS}}` filled with defaults.** [evaluation-experience blocker]
5. **Write `setup.sh` or remove its references.** [broken contract]

The rest of the items in TODO.md are sequenced by category (security → docs → AI affordances → DX → polish).
