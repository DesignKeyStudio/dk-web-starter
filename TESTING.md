# TESTING.md

> How this project is tested and where test cases are listed. Update it in the same commit that
> adds or changes user-visible behaviour: add the test, then add its case id below.
>
> Companion docs: [CLAUDE.md](./CLAUDE.md) · [CODEMAP.md](./CODEMAP.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

## Suites

| Suite | Command | Scope | Status |
|-------|---------|-------|--------|
| Unit + integration | `npm run test` | Vitest project `integration`: `tests/unit/**/*.test.ts` (mocked) and `tests/integration/**/*.int.test.ts` (real database) | Configured, no tests yet |
| Storybook | `npx vitest run --project storybook` | Every story rendered in headless Chromium | 30 story files, 103 tests passing (2026-10-17) |
| End-to-end | not set up | Real browser against a production build | See `TODO.md` (P2, Testing & CI) |

`npm run test` passes with no test files (`--passWithNoTests`) so a fresh project is green; it
starts enforcing as soon as the first test exists. First time running the Storybook suite:
`npx playwright install chromium`.

## Unit tests (`tests/unit/`)

Mock Prisma and Supabase. Use them for services in `src/lib/services/` and helpers in
`src/lib/`, where the logic does not need a real database.

## Integration tests (`tests/integration/`)

Name files `*.int.test.ts`. They run against a real database, so point `DATABASE_URL` at a
dedicated test database (a separate Supabase project or a local Postgres), never at production.
The first one to write is tenant isolation: a user in org A cannot read or change org B's data
through any service.

## End-to-end tests (when added)

Use Playwright in `tests/e2e/`, against `npm run build` + `npm run start` on its own port with its
own seeded database, so a run never touches dev data. Give every scenario a case id
(`TC-<AREA>-NN`, for example `TC-AUTH-01`) and add a row to the matching table below. Prefer
`getByRole` / `getByLabel` locators.

## Test cases

### Authentication

| ID | Scenario | Expected |
|----|----------|----------|
| TC-AUTH-01 | Open `/dashboard` or `/settings/users` signed out | Redirect to `/login` (`src/proxy.ts`) |

_Checked by hand on 2026-10-17 against `npm run dev` and `npm run start`; not automated yet._

## Adding a test

- Service behaviour: a unit test in `tests/unit/`, or an integration test in `tests/integration/`
  when the query itself is what you are testing.
- Screen behaviour: an e2e spec with the next `TC-<AREA>-NN` id and a row in the tables above.
- A bug fix gets a test that fails before the fix.
