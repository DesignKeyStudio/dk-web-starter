---
version: alpha
name: dk-web-starter-defaults
description: Indigo-accented neutral palette with Inter typography; production-grade SaaS feel — restrained, clinical, agent-readable.

# Note: The starter uses OKLCh in CSS for perceptual uniformity. Hex values below are sRGB approximations
# for Stitch tooling compatibility. The authoritative values live in src/app/globals.css.

colors:
  primary: "#3D38B0"             # oklch(0.45 0.16 270)
  on-primary: "#FCFCFC"          # oklch(0.99 0 0)
  primary-container: "#5A56C9"   # primary hover/container
  on-primary-container: "#FFFFFF"
  secondary: "#F5F4F7"           # oklch(0.965 0.005 270)
  on-secondary: "#564E66"        # oklch(0.38 0.02 265)
  tertiary: "#5A56C9"            # accent — same family as primary, slightly lighter
  on-tertiary: "#FFFFFF"
  surface: "#FFFFFF"             # card
  on-surface: "#15141F"          # foreground
  surface-variant: "#EFEDF3"     # muted/accent
  on-surface-variant: "#7A7383"
  background: "#FAFAFB"          # oklch(0.985 0.003 270)
  on-background: "#15141F"
  outline: "#E5E2EA"             # border
  error: "#E13B2D"               # destructive
  on-error: "#FCFCFC"
  success: "#21A87C"             # oklch(0.59 0.17 163)
  warning: "#E8B92E"             # oklch(0.80 0.16 85)
  info: "#2A77E0"                # oklch(0.55 0.20 245)
  sidebar: "#0E0F1B"             # oklch(0.11 0.04 265) — dark navy
  on-sidebar: "#B4B0BA"          # oklch(0.77 0.01 265)

typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4

rounded:
  none: "0px"
  sm: "6px"     # calc(--radius - 4px)
  md: "8px"     # calc(--radius - 2px)
  lg: "10px"    # --radius
  xl: "14px"    # calc(--radius + 4px)
  full: "9999px"

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
  button-destructive:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-error}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
  badge:
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.sm}"
    typography: "{typography.caption}"
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.on-sidebar}"
---

# DESIGN.md — Starter Defaults

> These are the fallback values that `INSTALL.md` uses to populate `DESIGN.md` when the user doesn't have brand-specific values yet. They reflect what the starter ships with out of the box. Replace tokens with the user's answers when provided.

## Overview

A restrained, clinical, agent-readable SaaS aesthetic. The starter aims for premium-but-quiet: dense information, generous whitespace inside that density, indigo primary as the single brand voice, neutral surroundings. Not playful, not maximalist, not retro. Dark mode is a first-class peer to light mode.

## Colors

- **Primary (indigo)** — `#3D38B0` (OKLCh `0.45 0.16 270`). Single most important action per screen. Don't use for decoration.
- **Background / Surface** — very light neutral (`#FAFAFB`) on light mode; near-black indigo (`#0E0F1B`) shifts on dark.
- **Tertiary / Accent** — the lighter-end of the indigo family (`#5A56C9`). Sparingly for highlights, hovers, gradient ends.
- **Error / Success / Warning / Info** — semantic only. WCAG-AA contrast against on-color.
- **Sidebar** — dark navy by design. Stays dark even in light mode for contrast and product distinction.

Light and dark mode share the OKLCh palette; only lightness shifts. Both modes are supported via `next-themes` with the `class` strategy. Authoritative values live in `src/app/globals.css`.

## Typography

- Single typeface: **Inter** (loaded via `next/font` in `src/app/layout.tsx`).
- Heading scale tightens line-height (1.1–1.3); body relaxes it (1.5).
- Display is for marketing/hero only; product UI rarely goes above h1.
- Tabular figures for KPI cards and tables (`font-variant-numeric: tabular-nums`).

## Layout

- 4 / 8 / 16 / 24 / 32 / 48 px spacing scale.
- Sidebar: `290px` fixed on desktop (`--sidebar-width`), drawer on mobile via `use-mobile.ts`.
- Page content: `max-w-7xl` with `px-6` horizontal padding.
- Card padding: `spacing.lg` (24px) for content cards, `spacing.md` (16px) for compact KPI cards.
- Form field gap: `space-y-4` (16px) between fields.
- Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536).

## Elevation & Depth

- Flat-first. Prefer subtle 1px borders (`colors.outline`) over heavy shadows.
- Shadow only on floating surfaces: dropdown menus, popovers, sheets, dialogs.
- Z-index ladder:
  - sidebar: 20
  - sticky header: 30
  - dropdowns/popovers: 40
  - sheets/dialogs: 50
  - toasts (sonner): 60
- Single overlay for modals/sheets — never stack overlays.

## Shapes

- Default radius: `rounded.md` (8px).
- Cards: `rounded.lg` (10px).
- Pills / badges / chips: `rounded.full`.
- Inputs and buttons: `rounded.md`.
- Mixing radii in one composition is forbidden — pick one scale step per composition.

## Components

The shipped component patterns. Full file catalog in [COMPONENT.md](../COMPONENT.md).

- **Side panels** → `<Sheet>` (`src/components/ui/sheet.tsx`), not `<Dialog>`.
- **Confirmation modals** → `<Dialog>` with two buttons (primary action + cancel).
- **Forms** → React Hook Form + Zod + shadcn `<Form>`. Inline field errors. Submit button shows `"Saving…"` / `"Creating…"` / `"Deleting…"` and disables during async.
- **Permission gating** → `useAuthStore((s) => s.hasPermission)` for conditional rendering.
- **Theme toggle** → in the app header. Persisted via `next-themes` localStorage.
- **Data tables** → `<DataTable>` from `src/components/data-table/`, with sortable headers and column visibility.
- **KPI cards** → `<KpiCard>` for at-a-glance metrics; tabular numerals.

## Do's and Don'ts

**Do**

- Use `colors.primary` for the single most important action per screen.
- Pull every color, size, and spacing value from the YAML tokens.
- Use the OKLCh values in `globals.css` as authoritative; hex above is for Stitch tooling.
- Keep dark mode in parity with light mode — every token has a dark variant.

**Don't**

- Don't introduce a new font family. Inter handles every weight needed.
- Don't use `colors.error` for decoration — semantic only.
- Don't write raw hex or `oklch()` outside the `globals.css` token block. Use CSS variables / Tailwind utilities.
- Don't add elevation to inline elements (only floating surfaces).
- Don't animate on initial page load.

---

**Accessibility floor:** WCAG AA (4.5:1 body, 3:1 large text/UI), focus rings visible (`focus-visible:` utilities), 44×44px minimum tap target on touch, `aria-label` on icon-only buttons, `<Label>` on form fields, respect `prefers-reduced-motion`.
