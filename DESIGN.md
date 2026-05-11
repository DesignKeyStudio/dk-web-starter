# DESIGN.md

> Design rules and visual identity for this project. **Update this file whenever you add or change a pattern, token, or rule that other code should follow.**

## Brand

- **Primary color**: {{BRAND_PRIMARY}}
- **Gradient**: {{BRAND_GRADIENT}}
- **Logo**: {{LOGO_PATH_OR_DESCRIPTION}}
- **Source of truth in code**: `src/lib/brand.ts`

## Typography

- **Font family**: {{FONT_FAMILY}}
- **Heading scale**: {{HEADING_SIZES}}
- **Body**: {{BODY_SIZE_AND_LINE_HEIGHT}}

## Spacing & layout

{{SPACING_RULES}}

## Color tokens

{{COLOR_TOKENS_OR_REFERENCE_TO_TAILWIND_CONFIG}}

## Component patterns

- **Side panels** — use `<Sheet>` (from `src/components/ui/sheet.tsx`)
- **Confirmation dialogs** — use `<Dialog>` (from `src/components/ui/dialog.tsx`)
- **Forms** — React Hook Form + Zod + shadcn `<Form>` components
- **Loading states on mutations** — button shows action verb ("Saving...", "Deleting...", "Creating...") and disables during async
- **Permission gating** — `useAuthStore((s) => s.hasPermission)` for UI gating
- **Theming** — `next-themes` with `class` strategy; theme toggle in header

## Accessibility floor

{{A11Y_REQUIREMENTS}}

## Animation & motion

{{MOTION_RULES}}

---

**On adding new design rules**: if a pattern needs to be applied in more than one place, document it here. If it's used once, don't bother — DESIGN.md is for *shared* rules, not every styling choice.
