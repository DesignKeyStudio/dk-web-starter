---
version: alpha
name: {{PROJECT_NAME}}
description: {{ONE_LINE_DESIGN_INTENT}}

colors:
  primary: "{{HEX}}"
  on-primary: "{{HEX}}"
  primary-container: "{{HEX}}"
  on-primary-container: "{{HEX}}"
  secondary: "{{HEX}}"
  on-secondary: "{{HEX}}"
  tertiary: "{{HEX}}"
  on-tertiary: "{{HEX}}"
  surface: "{{HEX}}"
  on-surface: "{{HEX}}"
  surface-variant: "{{HEX}}"
  on-surface-variant: "{{HEX}}"
  background: "{{HEX}}"
  on-background: "{{HEX}}"
  outline: "{{HEX}}"
  error: "{{HEX}}"
  on-error: "{{HEX}}"
  success: "{{HEX}}"
  warning: "{{HEX}}"

typography:
  display:
    fontFamily: "{{FONT_FAMILY}}"
    fontSize: "{{SIZE}}"
    fontWeight: "{{WEIGHT}}"
    lineHeight: "{{LINE_HEIGHT}}"
  h1:
    fontFamily: "{{FONT_FAMILY}}"
    fontSize: "{{SIZE}}"
    fontWeight: "{{WEIGHT}}"
    lineHeight: "{{LINE_HEIGHT}}"
  h2:
    fontFamily: "{{FONT_FAMILY}}"
    fontSize: "{{SIZE}}"
    fontWeight: "{{WEIGHT}}"
    lineHeight: "{{LINE_HEIGHT}}"
  h3:
    fontFamily: "{{FONT_FAMILY}}"
    fontSize: "{{SIZE}}"
    fontWeight: "{{WEIGHT}}"
    lineHeight: "{{LINE_HEIGHT}}"
  body:
    fontFamily: "{{FONT_FAMILY}}"
    fontSize: "{{SIZE}}"
    fontWeight: "{{WEIGHT}}"
    lineHeight: "{{LINE_HEIGHT}}"
  body-small:
    fontFamily: "{{FONT_FAMILY}}"
    fontSize: "{{SIZE}}"
    fontWeight: "{{WEIGHT}}"
    lineHeight: "{{LINE_HEIGHT}}"
  caption:
    fontFamily: "{{FONT_FAMILY}}"
    fontSize: "{{SIZE}}"
    fontWeight: "{{WEIGHT}}"
    lineHeight: "{{LINE_HEIGHT}}"

rounded:
  none: "0px"
  sm: "{{PX}}"
  md: "{{PX}}"
  lg: "{{PX}}"
  xl: "{{PX}}"
  full: "9999px"

spacing:
  xs: "{{PX}}"
  sm: "{{PX}}"
  md: "{{PX}}"
  lg: "{{PX}}"
  xl: "{{PX}}"
  2xl: "{{PX}}"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "{{PX}}"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
    padding: "{{PX}}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{{PX}}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{{PX}}"
---

# Design

> Design rules and visual identity for this project. Follows the [Google Stitch DESIGN.md specification](https://github.com/google-labs-code/design.md) — YAML front matter (above) holds machine-readable tokens; the prose below holds rationale and constraints. **Keep tokens and prose in sync.**

## Overview

{{BRAND_PERSONALITY_AND_VISUAL_FEEL}}

The UI should evoke {{ADJECTIVES_DESCRIBING_FEEL}} — describe the tone (clinical, warm, premium, playful, restrained, dense, breathing, etc.) in 2–4 sentences. State what the product is *not* aiming for (e.g., "not retro, not maximalist").

## Colors

{{COLOR_PALETTE_RATIONALE}}

- **Primary** — the dominant brand color; reserved for the single most important action per screen. Don't use it for decoration.
- **Surface / Background** — neutral canvases. Surface sits on background, never the reverse.
- **Tertiary / Accent** — highlight color for occasional emphasis (badges, status, callouts). Use sparingly.
- **Error / Success / Warning** — semantic only. Never use red for non-error decoration.

Light and dark mode are both supported via `next-themes` with the `class` strategy. CSS variables in `src/app/globals.css` provide the runtime values.

## Typography

{{TYPOGRAPHY_RATIONALE}}

- Single typeface (`{{FONT_FAMILY}}`) handles all weights and sizes.
- Headings use a clear scale (display → h1 → h2 → h3); body sits at `body`, secondary text at `body-small`, metadata/labels at `caption`.
- Line height is generous for body (≥1.5) and tight for headings (~1.1–1.25).
- Never style by hex/px outside the token system — pull from `typography.*`.

## Layout

{{LAYOUT_RATIONALE}}

- Spacing scale follows the YAML `spacing.*` tokens. Don't introduce one-off pixel values; pick the nearest scale step.
- Sidebar: fixed `{{SIDEBAR_WIDTH}}` on desktop, drawer on mobile (`use-mobile.ts` hook).
- Page content: `max-w-7xl` with `px-6` horizontal padding.
- Breakpoints: Tailwind defaults (`sm`, `md`, `lg`, `xl`, `2xl`).
- Card padding: pull from `spacing.md` or `spacing.lg`.

## Elevation & Depth

{{ELEVATION_RATIONALE}}

- Use shadow sparingly — flat surfaces with subtle borders are preferred over heavy elevation.
- Z-index scale: sidebar (20) < header (30) < dropdowns (40) < dialogs/sheets (50) < toasts (60).
- Sheets and dialogs use a single semi-transparent overlay; never stack overlays.

## Shapes

{{SHAPES_RATIONALE}}

- Border radius pulls from `rounded.*` tokens. Default UI element radius is `rounded.md`.
- Cards use `rounded.lg`; pill-shape elements (badges, chips) use `rounded.full`.
- Avoid mixing radius values in the same composition — pick one and stick.

## Components

{{COMPONENTS_RATIONALE}}

This section describes the *patterns*; the full catalog of component files and their props lives in [COMPONENT.md](./COMPONENT.md).

- **Side panels** — `<Sheet>` (from `src/components/ui/sheet.tsx`), not `<Dialog>`.
- **Confirmation dialogs** — `<Dialog>` (modal, two-button: confirm / cancel).
- **Forms** — React Hook Form + Zod + shadcn `<Form>` components. Inline errors below the field.
- **Loading states on mutations** — button shows action verb ("Saving…", "Deleting…", "Creating…") and disables during async.
- **Permission gating** — `useAuthStore((s) => s.hasPermission)` for UI gating.
- **Theming** — `next-themes` with `class` strategy; theme toggle lives in the header.

When introducing a new shared component pattern, add the composed-token entry under YAML `components.*` above and document the pattern here.

## Do's and Don'ts

**Do**

- Use `colors.primary` for the single most important action per screen.
- Pull every color, size, and spacing value from the YAML tokens above.
- Update the YAML token block in the same commit when changing visual rules.
- Cross-reference `COMPONENT.md` when adding new components.

**Don't**

- Don't use raw hex values, raw `px` values, or arbitrary Tailwind classes (`text-[#abcdef]`) outside the token system.
- Don't introduce a new font family without updating `typography.*` tokens first.
- Don't mix two side-panel patterns (`<Sheet>` and `<Dialog>`) for the same purpose.
- Don't use `colors.error` for decoration — it's reserved for actual error states.
- Don't stack motion on initial page load.

---

**Accessibility floor (always):** WCAG AA contrast (4.5:1 body, 3:1 large text/UI), focus rings visible on all interactive elements, 44×44px minimum tap target on touch, `aria-label` on icon-only buttons, `<Label>` on form fields, respect `prefers-reduced-motion`.
