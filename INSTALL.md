# INSTALL.md — Setup playbook for Claude Code

> **You are Claude Code, being asked to set up a new project from the `dk-web-starter` template.** Read this file in full first, then execute each phase in order. Surface progress to the user as you go.

## How the user invokes this

They will say something like:
> *"Set up a new project from this starter using INSTALL.md"*
> *"Based on the dk-web-starter template, set up a new project for me using INSTALL.md"*

When that happens, follow this playbook.

---

## Phase 0 — Pre-flight checks

Verify before doing anything:

- You're in a fresh clone/download of `dk-web-starter` (look for `package.json`, `prisma/`, `src/`, `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`).
- Node.js is installed (`node --version`, requires ≥20).
- The user knows they need a Supabase project (or has one already).
- `.env.example` exists, `.env` does not exist (or is empty — we're about to fill it).

If any of these fail, stop and tell the user what's missing. Don't try to "fix" Node versions or invent a Supabase project.

---

## Phase 1 — Interview

Be conversational, not a form. Group related questions. Use the `AskUserQuestion` tool to gather answers.

### 1a. Product info — REQUIRED MINIMUM: name + one-liner

Ask these:

1. **What is the product called?** → fills `{{PROJECT_NAME}}`
2. **In one sentence, what does it do?** → fills `{{PRODUCT_ONE_LINER}}` and `{{PROJECT_DESCRIPTION_ONE_LINE}}`
3. **Who's the target user?** *(skip → write `TODO: target user` in PRODUCT.md and warn at end)*
4. **What problem does it solve?** *(skip → TODO)*
5. **3–5 features for the MVP?** *(skip → TODO)*
6. **Any domain terms readers should know?** *(skip → leave glossary empty)*

If the user doesn't have a product name + one-liner, **stop here**. Tell them: "Come back when you can name the product and describe it in one sentence — those are the only required fields."

### 1b. Design info — entirely optional, defaults available

Ask:

1. **Do you have brand colors / a design system to apply?**
   - If yes → ask: primary color, gradient (if any), font preference, logo path
   - If no → say: "I'll use the starter defaults. You can override later by editing `DESIGN.md` and `src/lib/brand.ts`."
2. **Any specific UI rules to lock in beyond what the starter already enforces?** *(usually skip — starter defaults are reasonable)*

When the user opts for defaults on any question, **read `_defaults/DESIGN.default.md`** and use those values to fill the corresponding sections in `DESIGN.md`.

### 1c. Repo info

Ask:

1. **GitHub repo URL?** *("skip — I'll add the remote later" is fine)*

---

## Phase 2 — Fill templates

Replace `{{PLACEHOLDERS}}` across files using the interview answers. For skipped product fields, write `TODO: <field name>` so they're visible.

| File | What to fill |
|------|--------------|
| `CLAUDE.md` | `{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION_ONE_LINE}}` |
| `PRODUCT.md` | All `{{...}}` — use `TODO:` markers for skipped items |
| `DESIGN.md` | All `{{...}}` — use values from `_defaults/DESIGN.default.md` for items the user opted to default |
| `package.json` | `"name"` field (kebab-case from product name) |
| `README.md` | Title and intro |

**Do not edit `CODEMAP.md` during setup.** It already describes the starter's structure and is accurate as-is. The user (or future Claude sessions) will update it as the project grows.

---

## Phase 3 — Environment

1. Copy `.env.example` → `.env`.
2. Walk the user through filling the required values. The set is:
   - `DATABASE_URL` — Supabase pooler URL (port 6543, with `?pgbouncer=true`)
   - `DIRECT_URL` — Supabase direct URL (port 5432)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. If the user doesn't have these handy, point them to the Supabase project dashboard → Project Settings → API and Database, and pause until they confirm `.env` is filled.

---

## Phase 4 — Bootstrap

Run in order, reporting each result:

1. `npm install`
2. `npx prisma generate`
3. `npx prisma migrate dev --name initial` — if Prisma prompts to reset the DB, **ask the user before resetting**. Never reset without confirmation.
4. `npx prisma db seed` — creates demo org + admin user

If any step fails, stop and surface the full error. Don't try to silently work around dependency issues.

---

## Phase 5 — Verify

1. `npm run build` — must pass with zero errors. If it fails, surface the error and stop.
2. Tell the user to run `npm run dev` and visit `http://localhost:3000`. They should be able to log in with the seeded admin credentials (see `prisma/seed.ts` for username/password).
3. Optionally use the Chrome DevTools MCP to verify the login flow works end-to-end (if available).

---

## Phase 6 — Cleanup template artifacts

Once verification passes, the following files have served their purpose and should be removed from the downstream project:

1. Delete `INSTALL.md` (this file)
2. Delete `_defaults/` folder
3. *(Optional)* Remove this starter from `git remote` if the user has set a new origin

Ask the user before deleting in case they want to keep `INSTALL.md` archived (`docs/setup-archive.md`).

---

## Phase 7 — Summary

Report concisely:

- ✅ **Files filled**: list which templates were populated
- 📋 **Demo credentials**: from `prisma/seed.ts`
- ⚠️ **TODOs left**: any unfilled fields in PRODUCT.md or DESIGN.md
- 🚀 **Suggested next steps**:
  1. Customize `prisma/schema.prisma` for your domain
  2. Edit `src/lib/brand.ts` if you skipped brand colors
  3. Replace the placeholder `dashboard/page.tsx` with your real dashboard
  4. Init `git init && git remote add origin <url>` if not done

Congratulate briefly. Don't propose feature work unless asked.

---

## Notes for Claude executing this playbook

- **Use `AskUserQuestion`** for interview prompts. Group 2–4 related questions per call.
- **Don't assume product context.** If the user mentions an existing project's product (e.g., "for our CRM"), still ask the structured questions — context drift is real.
- **Required-minimum gate**: product name + one-liner are non-negotiable. Everything else can be `TODO:`.
- **Never reset the database** without explicit user confirmation, even if Prisma suggests it.
- **Stop on first hard failure** (Node version, npm install error, build error). Don't paper over.
- After the summary, the setup is done. Hand control back to the user.
