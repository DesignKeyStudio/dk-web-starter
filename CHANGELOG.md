# Changelog

All notable changes to this project. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> These entries describe dk-web-starter itself. A project created from it replaces them with an
> empty `## [Unreleased]` section during setup (INSTALL.md, Phase 2).

## [Unreleased]

### Changed

- **Next.js 16.3.8** (from 16.1.6), React 19.2.8 and `eslint-config-next` 16.3.8.
- **`middleware.ts` is now `src/proxy.ts`**, the Next.js 16 name. The file has to sit next to
  `src/app/`: on 16.3 a proxy file at the repo root is ignored, which would let signed-out
  visitors open every protected page.
- `npm run test` passes while the project has no tests yet.

### Added

- `npm run typecheck` (`next typegen` + `tsc --noEmit`).
- `AGENTS.md`, the Next.js agent rules that `next dev` keeps current. Committing it stops
  `next dev` from appending the same block to `CLAUDE.md`.
- `allowedDevOrigins` for `localhost` and `127.0.0.1`, so the dev server works when browser tools
  open it on 127.0.0.1.
- `.claude/settings.json` with Claude Code permissions.
- `TESTING.md`, `DEPLOYMENT.md` and this changelog, with matching update rules in `CLAUDE.md`;
  verification now includes typecheck, lint, tests and a browser check.

### Fixed

- `npm run build` failed on a fresh clone: Storybook serves `public/`, which did not exist. An
  empty `public/` is now committed.
- Every Storybook test file failed to load because of `@storybook/addon-viewport`, a Storybook 9
  package. It is removed; the preview's viewports use Storybook 10's built-in
  `parameters.viewport.options`. All 103 story tests pass.
- After any `npm run build`, `npm run lint` also linted the built Storybook in `public/storybook/`
  (over 800 extra errors). Build output is now ignored.
- Each local build copied the previous Storybook build inside the new one, nesting a little
  deeper every time. The old build is now removed before Storybook runs.
