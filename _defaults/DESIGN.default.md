# DESIGN.md — Starter Defaults

> These are the fallback values that `INSTALL.md` uses to fill `DESIGN.md` when the user doesn't have brand-specific values yet. They reflect what the starter ships with out of the box. Replace this content with the user's answers when provided.

## Brand

- **Primary color**: `BRAND_PRIMARY` in `src/lib/brand.ts` (slate-based neutral, dark-mode friendly)
- **Gradient**: `BRAND_GRADIENT` in `src/lib/brand.ts`
- **Logo**: `public/logo.svg` (placeholder — replace with your brand)

## Typography

- **Font family**: Inter, loaded via `next/font` in `src/app/layout.tsx`
- **Heading scale**: Tailwind defaults — `text-3xl` (h1), `text-2xl` (h2), `text-xl` (h3), `text-lg` (h4)
- **Body**: `text-sm` with `leading-relaxed`

## Spacing & layout

- Tailwind 4/8/12/16/24px spacing scale
- Sidebar: fixed 280px on desktop, drawer on mobile (`use-mobile.ts` hook)
- Page content: `max-w-7xl` with `px-6` horizontal padding
- Card padding: `p-6`
- Form field gap: `space-y-4`

## Color tokens

- Tailwind v4 with shadcn/ui theme variables in `src/app/globals.css`
- Light/dark mode via `next-themes` (`class` strategy)
- CSS variables: `--background`, `--foreground`, `--primary`, `--muted`, `--border`, etc.
- See the bottom of `globals.css` for the full token list

## Accessibility floor

- All interactive elements keyboard-focusable
- Focus rings visible via Tailwind `focus-visible:` utilities
- Minimum tap target: 44×44px on touch devices
- Color contrast: WCAG AA (4.5:1 body text, 3:1 large text and UI components)
- `aria-label` on icon-only buttons
- Form fields have associated `<Label>` components

## Animation & motion

- Respect `prefers-reduced-motion` (Tailwind `motion-safe:` utilities)
- Transition duration: 150–250ms with `ease-in-out`
- No motion on initial page load (avoid jarring first paint)
