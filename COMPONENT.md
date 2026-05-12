# COMPONENT.md

> Catalog of every UI component shipped with this project. **Update this file in the same commit that adds, renames, or removes a component, or adds a new variant.**
>
> Companion docs: [DESIGN.md](./DESIGN.md) (design tokens, patterns) · [CODEMAP.md](./CODEMAP.md) (where to add what)

**Component categories:**

| Folder | Source | Edit policy |
|--------|--------|-------------|
| `src/components/ui/` | shadcn/ui primitives | Do not edit — re-add via `shadcn` CLI if needed |
| `src/components/reui/` | ReUI components | Do not edit — re-add via `shadcn@latest add @reui/<name>` |
| `src/components/custom/` | Generic app building blocks | Free to edit |
| `src/components/layout/` | App chrome (header, sidebar) | Free to edit |
| `src/components/data-table/` | DataTable composition | Free to edit |

Each entry: short purpose · variants (if any) · `.stories.tsx` reference (if present).

---

## `src/components/ui/` — shadcn/ui primitives

### AlertDialog — `ui/alert-dialog.tsx`
Modal dialog for destructive/critical confirmations. Two-button (confirm/cancel).

### Avatar — `ui/avatar.tsx`
Round image avatar with fallback initial. Use `<UserAvatar>` (custom) for app users — wraps this.

### Badge — `ui/badge.tsx`
Status pill. Variants: `default | secondary | destructive | outline`. Story: `ui/badge.stories.tsx`

### Button — `ui/button.tsx`
Standard interactive button.
- Variants: `default | destructive | outline | secondary | ghost | link`
- Sizes: `default | sm | lg | icon`
- Story: `ui/button.stories.tsx`

### ButtonGroup — `ui/button-group.tsx`
Visually-joined row of buttons sharing borders.

### Calendar — `ui/calendar.tsx`
Date picker calendar. Built on `react-day-picker`. Embedded inside Popover for inputs.

### Card — `ui/card.tsx`
Container with subtle border + radius. Sub-parts: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. Story: `ui/card.stories.tsx`

### Checkbox — `ui/checkbox.tsx`
Binary checkbox. Pairs with `<Label>`. Story: `ui/checkbox.stories.tsx`

### Collapsible — `ui/collapsible.tsx`
Show/hide content under a trigger.

### Command — `ui/command.tsx`
Command palette UI (cmdk). Used for searchable lists and quick actions.

### Dialog — `ui/dialog.tsx`
Modal dialog for confirmations and short interactions.
- **Use for**: confirmations, short forms.
- **Don't use for**: side panels (use `<Sheet>` instead).
- Story: `ui/dialog.stories.tsx`

### DropdownMenu — `ui/dropdown-menu.tsx`
Dropdown menu with items, separators, sub-menus, checkboxes. Story: `ui/dropdown-menu.stories.tsx`

### Form — `ui/form.tsx`
React Hook Form integration. Wraps fields with `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`. Story: `ui/form.stories.tsx`

### Input — `ui/input.tsx`
Standard text input.

### InputGroup — `ui/input-group.tsx`
Input with leading/trailing addons (icons, prefixes).

### Kbd — `ui/kbd.tsx`
Keyboard shortcut chip — for showing key combos in tooltips/menus.

### Label — `ui/label.tsx`
Accessible form label. Always pair with form inputs.

### Popover — `ui/popover.tsx`
Floating panel anchored to a trigger. Used for date pickers, color pickers, info panels.

### ScrollArea — `ui/scroll-area.tsx`
Custom scrollable container with styled scrollbars.

### Select — `ui/select.tsx`
Dropdown select with keyboard navigation.

### Separator — `ui/separator.tsx`
Horizontal or vertical divider line.

### Sheet — `ui/sheet.tsx`
**Side panel** sliding from edge (top/right/bottom/left).
- **Use for**: side panels, slide-out forms, navigation drawers.
- **Don't use for**: confirmations (use `<Dialog>`).

### Sidebar — `ui/sidebar.tsx`
Sidebar primitive with collapsible state. Powers `<AppSidebar>` (layout).

### Skeleton — `ui/skeleton.tsx`
Loading placeholder bars/blocks.

### Sonner — `ui/sonner.tsx`
Toast notification provider (wraps `sonner` library). Mount once at root.

### Spinner — `ui/spinner.tsx`
Loading indicator. Use inside buttons during async, or as page-level loader.

### Switch — `ui/switch.tsx`
Toggle on/off control. Pair with `<Label>`.

### Table — `ui/table.tsx`
Basic semantic table primitives (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`). For data tables with sorting/visibility, use `<DataTable>` (data-table/).

### Tabs — `ui/tabs.tsx`
Tab list and panels. Standard pattern for setting groupings.

### Textarea — `ui/textarea.tsx`
Multi-line text input.

### Tooltip — `ui/tooltip.tsx`
Hover/focus tooltip. Requires `<TooltipProvider>` at root (mounted in app layout).

---

## `src/components/reui/` — ReUI components

### Alert — `reui/alert.tsx`
Inline alert banner with icon. Variants for info/warning/error/success. Story: `reui/alert.stories.tsx`

### Autocomplete — `reui/autocomplete.tsx`
Combobox with async/filterable suggestions.

### Badge — `reui/badge.tsx`
Extended badge with more variants and dot indicators. Story: `reui/badge.stories.tsx`

### DateSelector — `reui/date-selector.tsx`
Date and date-range picker UI.

### Filters — `reui/filters.tsx`
Filter bar with chips for table/list filtering.

### Stepper — `reui/stepper.tsx`
Multi-step process indicator (e.g., wizards, onboarding flows).

### Timeline — `reui/timeline.tsx`
Vertical timeline for activity log, events, history. Story: `reui/timeline.stories.tsx`

### DataGrid — `reui/data-grid/data-grid.tsx`
Full-featured data grid (TanStack Table-backed) with sub-components for advanced use cases:

- `data-grid-column-filter.tsx` — per-column filter inputs
- `data-grid-column-header.tsx` — sortable/draggable header cells
- `data-grid-column-visibility.tsx` — show/hide columns
- `data-grid-pagination.tsx` — page-size + page-number controls
- `data-grid-scroll-area.tsx` — virtualized scroll container
- `data-grid-table.tsx` — base table renderer
- `data-grid-table-dnd.tsx` — drag-and-drop rows
- `data-grid-table-dnd-rows.tsx` — DnD row internals
- `data-grid-table-virtual.tsx` — virtualized table renderer

**When to use DataGrid vs DataTable**: DataGrid for power-user tables (DnD, virtual scroll, complex filters). DataTable for standard CRUD lists.

---

## `src/components/custom/` — generic app components

### CheckboxListField — `custom/checkbox-list-field.tsx`
Form field that renders a list of checkboxes (e.g., multi-select permissions). React Hook Form integrated. Story: `custom/checkbox-list-field.stories.tsx`

### DetailRow — `custom/detail-row.tsx`
Label-value pair for detail panels (label on left, value on right). Used in user profiles, settings detail sheets. Story: `custom/detail-row.stories.tsx`

### GradientProgressBar — `custom/gradient-progress-bar.tsx`
Progress bar with brand gradient fill. For onboarding, upgrade progress, etc. Story: `custom/gradient-progress-bar.stories.tsx`

### KpiCard — `custom/kpi-card.tsx`
At-a-glance metric card: title + value + optional delta/trend. Tabular numerals. Story: `custom/kpi-card.stories.tsx`

### PageHeader — `custom/page-header.tsx`
Page-level header with title, description, and right-side action slot. Use at top of every `(platform)` page. Story: `custom/page-header.stories.tsx`

### UserAvatar — `custom/user-avatar.tsx`
Wraps `<Avatar>` with org-user awareness (handles fallback initials, role-based color, online status). Story: `custom/user-avatar.stories.tsx`

---

## `src/components/layout/` — app chrome

### AppHeader — `layout/app-header.tsx`
Top app bar: theme toggle, notification bell, org/user menus. Hooks into `useAppHeader()`. Story: `layout/app-header.stories.tsx`

### AppSidebar — `layout/app-sidebar.tsx`
Collapsible sidebar navigation. Reads nav items from `src/lib/sidebar-nav.ts`. Permission-gated items.

### HeaderOrganizationMenu — `layout/header-organization-menu.tsx`
Dropdown for switching active organization (multi-tenant aware).

### HeaderUserMenu — `layout/header-user-menu.tsx`
User profile dropdown: account, theme, sign-out. Story: `layout/header-user-menu.stories.tsx`

### PlatformShellLoader — `layout/platform-shell-loader.tsx`
Skeleton state for the platform shell while auth bootstrap is in flight.

---

## `src/components/data-table/` — table composition

### DataTable — `data-table/data-table.tsx`
Generic table with sorting, column visibility, pagination. Built on TanStack Table. Story: `data-table/data-table.stories.tsx`

### SortableHeader — `data-table/sortable-header.tsx`
Header cell with sort indicator (chevron up/down/none). Click to toggle. Story: `data-table/sortable-header.stories.tsx`

### ColumnVisibility — `data-table/column-visibility.tsx`
Dropdown menu for toggling visible columns. Story: `data-table/column-visibility.stories.tsx`

`index.ts` re-exports the public API.

---

## Conventions

- **Adding a new component**: pick the right folder per the table above. Add a `.stories.tsx` for any custom/layout/data-table addition.
- **Renaming/removing**: update this file in the same commit. If used elsewhere, also update `CODEMAP.md` reference.
- **Variants**: when adding a variant to an existing component, add a bullet to its entry above.
- **Cross-references**: composed-token patterns for a component live in `DESIGN.md`'s YAML front matter (`components.*`). Keep both files in sync.
