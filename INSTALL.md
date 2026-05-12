# INSTALL.md — Setup playbook for Claude Code

> **You are Claude Code, being asked to set up a new project from the `dk-web-starter` template.** Read this file in full before doing anything. Then execute each phase in order. Surface progress to the user as you go.

## How the user invokes this

They will say something like:
> *"Set up a new project from this starter using INSTALL.md"*
> *"Based on the dk-web-starter template, set up a new project for me using INSTALL.md"*

When that happens, follow this playbook.

---

## Phase 0 — Pre-flight checks

Verify before doing anything:

- You're in a fresh clone/download of `dk-web-starter` (look for `package.json`, `prisma/`, `src/`, `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `COMPONENT.md`, `STACK.md`).
- Node.js is installed (`node --version`, requires ≥20).
- `.env.example` exists, `.env` does not exist (or is empty — we'll fill it).

**Folder name check** — note `basename($PWD)`. If it doesn't match the project slug the user will provide later, you'll warn them at the end of setup to rename manually. Don't auto-rename (renaming the working directory while inside it breaks the session).

If any pre-condition fails, stop and tell the user what's missing. Don't try to "fix" Node versions or invent a Supabase project.

---

## Phase 1 — Interview

Be conversational, not a form. Group related questions. Use the `AskUserQuestion` tool to gather answers.

### 1a. Product info — REQUIRED MINIMUM: name + one-liner

Ask:

1. **What is the product called?** → fills `{{PROJECT_NAME}}`. Also derive `{{PROJECT_SLUG}}` (kebab-case: lowercase, hyphens, no spaces or special chars).
2. **In one sentence, what does it do?** → fills `{{PRODUCT_ONE_LINER}}` and `{{PROJECT_DESCRIPTION_ONE_LINE}}`
3. **Who's the target user?** *(skip → write `TODO: target user` in PRODUCT.md and warn at end)*
4. **What problem does it solve?** *(skip → TODO)*
5. **3–5 features for the MVP?** *(skip → TODO)*
6. **Any domain terms readers should know?** *(skip → leave glossary empty)*

If the user doesn't have a product name + one-liner, **stop here**.

### 1b. Tech stack & app type — REQUIRED

Ask these two questions in one prompt (use `AskUserQuestion` with two questions):

1. **Is this an end-to-end application or a prototype?**
   - `end-to-end` — proceed to DB question
   - `prototype` — auto-selects in-memory SQLite + mocked auth (skips DB question)

2. **(end-to-end only) Which database?**
   - `supabase` (recommended) — hosted Supabase Postgres + Supabase Auth. Default. No swap needed.
   - `postgres-local` — local Postgres (Docker or native). Supabase Auth still used.
   - `sqlite` — file-based SQLite at `prisma/dev.db`. Supabase Auth still used.
   - `in-memory` — SQLite in-memory; only valid for prototype mode (and we'll override the app-type to `prototype` if user picks this).

Record both answers — they drive Phase 4 routing.

### 1c. Design info — entirely optional, defaults available

Ask:

1. **Do you have brand colors / a design system to apply?**
   - If yes → ask: primary color (hex), accent (hex), font preference, logo path
   - If no → say: *"I'll use the starter defaults — indigo-accented neutral palette, Inter typography. You can override later by editing `DESIGN.md` and `src/lib/brand.ts` / `src/app/globals.css`."*
2. **Any specific UI rules to lock in beyond the starter conventions?** *(usually skip — starter defaults are reasonable)*

When the user opts for defaults, **read `_defaults/DESIGN.default.md`** and use its YAML front matter + prose to fill `DESIGN.md`. Replace placeholders directly.

### 1d. Repo info

Ask:

1. **GitHub repo URL?** *("skip — I'll add the remote later" is fine)*

---

## Phase 2 — Fill templates & rename project references

Replace `{{PLACEHOLDERS}}` across files using the interview answers.

| File | Placeholders / replacements |
|------|------------------------------|
| `CLAUDE.md` | `{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION_ONE_LINE}}` |
| `PRODUCT.md` | All `{{...}}` — use `TODO:` markers for skipped items |
| `DESIGN.md` | Replace YAML front matter `{{...}}` and prose `{{...}}` — values from interview or `_defaults/DESIGN.default.md` |
| `STACK.md` | YAML front matter values from Phase 1b answers (`appType`, `database`, `auth`, `ormProvider`) |
| `package.json` | `"name": "dk-launchpad"` → `"name": "{{PROJECT_SLUG}}"` |
| `prisma/seed.ts` | Replace any `"DK-WebTemplate"` / `"DK-Launchpad"` strings in console logs with `"{{PROJECT_NAME}}"` |
| `src/lib/brand.ts` | Top comment: replace `"DK-Launchpad"` with `"{{PROJECT_NAME}}"`. If user provided brand colors, also replace `BRAND_PRIMARY` and `BRAND_GRADIENT` values. |
| `prisma/schema.prisma` | Top comment: replace `"DK-Launchpad"` with `"{{PROJECT_NAME}}"` |
| `src/types/index.ts` | Comments referencing Launchpad/WebTemplate → `{{PROJECT_NAME}}` |
| `.env.example` | Top comment / project label updates |
| `README.md` | Title `dk-web-starter` → `{{PROJECT_SLUG}}`; replace marketing intro to reflect this is the downstream project (or leave with note that user should customize) |

**Do not edit `CODEMAP.md` or `COMPONENT.md` during setup.** They already describe the starter's structure accurately. They'll be updated by future code changes per the discipline rule in CLAUDE.md.

---

## Phase 3 — Environment file

1. Copy `.env.example` → `.env` (and `.env.example` → `prisma/.env` if that pattern exists in the project).
2. The exact required keys depend on the database choice from Phase 1b. See Phase 4 below — it tells you which keys to ask the user for.

---

## Phase 4 — Configure stack (routes by DB choice from Phase 1b)

This phase makes deterministic changes to `prisma/schema.prisma` and `.env.example` based on the chosen path. Pick **one** sub-section.

### Path 1: Supabase (default, end-to-end)

**No code changes** — the starter ships configured for Supabase.

Ask the user for these `.env` values:
- `DATABASE_URL` — Supabase pooler (port 6543, with `?pgbouncer=true`)
- `DIRECT_URL` — Supabase direct (port 5432)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If user doesn't have these handy, point them to Supabase dashboard → Project Settings → API and Database. Pause until `.env` is filled.

### Path 2: Local PostgreSQL (end-to-end)

**Pre-flight**: confirm the user has local Postgres running (`pg_isready` or `psql -l`). If not, stop and tell them to start it (Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`).

**Edit `prisma/schema.prisma`** — remove the `directUrl` line from the `datasource db` block:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // directUrl removed — only needed for Supabase pooler
}
```

**Edit `.env.example`** (and `.env`) — replace pooler templates with:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/{{PROJECT_SLUG}}"
NEXT_PUBLIC_SUPABASE_URL="<your Supabase project URL — used for auth only>"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="<your Supabase anon key>"
SUPABASE_SERVICE_ROLE_KEY="<your Supabase service role>"
```

Create the local DB if needed: `createdb {{PROJECT_SLUG}}` (or via psql).

Auth still uses Supabase. The user needs a Supabase project for auth even though app data is local.

### Path 3: SQLite (end-to-end)

**Edit `prisma/schema.prisma`**:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Then **scan the schema for incompatible types**:

- Native-type attributes like `@db.Text`, `@db.JsonB`, `@db.Citext`, `@db.Inet` — remove them. Prisma will fall back to SQLite-compatible defaults.
- `Json` fields — Prisma stores as TEXT on SQLite, still works.
- Enums — Prisma stores as TEXT on SQLite, still works. No change needed.
- Arrays (`String[]`, `Int[]`) — **not supported on SQLite**. If found, surface to the user and ask whether to convert (Json or junction table) or stop and reconsider.

**Edit `.env.example`** (and `.env`):

```
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_SUPABASE_URL="<your Supabase project URL — used for auth only>"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="<your Supabase anon key>"
SUPABASE_SERVICE_ROLE_KEY="<your Supabase service role>"
```

### Path 4: In-memory SQLite + mocked auth (prototype only)

This is the most invasive path. Pre-conditions: `appType=prototype`. If the user picked `in-memory` with `appType=end-to-end`, override to `prototype` and inform them.

**Schema** — apply the same edits as Path 3 (sqlite provider, scan for incompatible types).

**Edit `.env.example`** (and `.env`):

```
DATABASE_URL="file::memory:?cache=shared"
PROTOTYPE_MODE=true
# Supabase keys not needed in prototype mode — auth is mocked
```

**Mock auth files** — these ship with the starter at `src/lib/supabase/client-mock.ts` and `src/lib/supabase/server-mock.ts`. They export the same surface as the real clients but return a fixed demo user (see source for the user shape). They activate when `PROTOTYPE_MODE=true`.

**Confirm the wiring** — `src/lib/supabase/client.ts` and `server.ts` should already check `process.env.PROTOTYPE_MODE === 'true'` and re-export from the mock files. If they don't, the prototype path isn't implemented yet in the starter — surface this and stop with a clear message: *"Prototype mode requires `src/lib/supabase/{client,server}.ts` to check PROTOTYPE_MODE and re-export from `client-mock`/`server-mock`. This isn't wired up in your version of the starter. Please run setup with one of the real DB paths instead."*

**Boot bootstrap** — for in-memory mode, the DB lives only in process memory. A script at `scripts/prototype-bootstrap.mjs` runs `prisma db push --skip-generate` and the seed on each `npm run dev` boot. Verify the script exists; if not, surface the same kind of message as above.

---

## Phase 5 — Bootstrap dependencies + database

Run in order, reporting each result:

1. `npm install` — install dependencies
2. `npx prisma generate` — generate Prisma client (always required, all paths)
3. **Migration step (varies by path):**
   - **Paths 1, 2, 3** (real DB) — `npx prisma migrate dev --name initial`. If Prisma prompts to reset the DB, **ask the user before resetting**. Never reset without confirmation.
   - **Path 4** (in-memory) — skip migrate; `scripts/prototype-bootstrap.mjs` handles `db push` + seed at app boot.
4. **Seed step:**
   - **Paths 1, 2, 3** — `npx prisma db seed`
   - **Path 4** — skip; seed runs at boot

If any step fails, stop and surface the full error. Don't try to silently work around dependency issues.

---

## Phase 6 — Verify

1. `npm run build` — must pass with zero errors. If it fails, surface the error and stop.
2. `npm run dev` — should boot. Tell the user to visit `http://localhost:3000`.
3. **Auth verification varies by path:**
   - **Paths 1, 2, 3** — login with the seeded admin credentials (`prisma/seed.ts` defines the username/password — typically `admin@example.com` / `AdminPass123!`).
   - **Path 4** — visiting `/` should redirect to `/dashboard` with the mocked demo user already "logged in" — no login form interaction needed.
4. Optionally use the Chrome DevTools MCP to verify the login flow works end-to-end (if available).

---

## Phase 7 — Cleanup template artifacts

Once verification passes:

1. Delete `INSTALL.md` (this file)
2. Delete `_defaults/` folder
3. Ask the user: *"Want me to archive INSTALL.md as `docs/setup-archive.md` instead of deleting?"*

---

## Phase 8 — Summary

Report concisely:

- ✅ **Files filled**: list which templates were populated (CLAUDE/PRODUCT/DESIGN/STACK)
- 🧰 **Stack chosen**: app type + database + auth (from STACK.md)
- 📋 **Demo credentials** (Paths 1–3 only): from `prisma/seed.ts`
- ⚠️ **TODOs left**: any unfilled fields in PRODUCT.md or DESIGN.md
- 📁 **Folder rename warning** (if applicable): if `basename($PWD) !== {{PROJECT_SLUG}}`, remind the user: *"Your folder is named `<current>` but project slug is `<slug>`. After exiting Claude Code, rename: `mv ../<current> ../<slug>`."*
- 🚀 **Suggested next steps**:
  1. Customize `prisma/schema.prisma` for your domain
  2. (Path 4 prototype) Replace mock auth with real auth before deploying
  3. Replace the placeholder `dashboard/page.tsx` with your real dashboard
  4. Init `git init && git remote add origin <url>` if not done
  5. Update `COMPONENT.md` as you add new components (per CLAUDE.md discipline)

Congratulate briefly. Don't propose feature work unless asked.

---

## Notes for Claude executing this playbook

- **Use `AskUserQuestion`** for interview prompts. Group 2–4 related questions per call.
- **Don't assume product context.** Even if the user references existing work, still ask the structured questions.
- **Required-minimum gate**: product name + one-liner are non-negotiable. App type + DB are required for routing.
- **Never reset the database** without explicit user confirmation.
- **Stop on first hard failure** (Node version, npm install error, build error, missing Path 4 wiring).
- **Path 4 requires starter-side support** — if `client-mock.ts`/`server-mock.ts`/`prototype-bootstrap.mjs` are missing, the prototype path isn't implementable. Surface the gap and offer Path 3 (SQLite end-to-end with manual Supabase Auth project) as the closest alternative.
- **PRODUCT.md is user-initiated only** — fill it once during setup, then never touch it again unless the user explicitly asks. (See CLAUDE.md Update Discipline.)
