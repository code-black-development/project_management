# Design System

## Core Design Principles

These rules govern every UI decision in this codebase. An AI agent or developer touching any UI file must follow them.

1. **No DottedSeparator inside content areas.** `DottedSeparator` has been removed from all dashboard pages, modals, forms, and panels. It exists only in auth layouts (`/sign-in`, `/sign-up`). Use `border-t border-border` or a `border-b border-border pb-4 mb-4` header row instead.
2. **No Card wrappers from shadcn/ui.** Do not use `<Card>`, `<CardHeader>`, `<CardContent>` in dashboard UI. They add invisible padding layers and break the surface hierarchy. Build card sections manually with the standard pattern (see Panels and Cards).
3. **No raw Tailwind color scale values without dark counterparts.** Never write `bg-neutral-100`, `text-gray-800`, `bg-white` alone. Always use CSS variable-backed semantic utilities (`bg-background`, `bg-card`, `bg-muted`, `text-foreground`, etc.) or pair raw values with a `dark:` counterpart.
4. **No Tailwind opacity modifiers on custom CSS variable tokens.** `bg-border/8` will not generate unless explicitly configured. Use the token directly (`border-border`, `bg-muted`) or write the opacity in CSS.
5. **Compact, content-driven sizing.** Prefer default button sizes. Only use `size="sm"` for inline/icon actions. Never use `size="lg"` — it creates unnecessary vertical bulk. Avatar/icon placeholders should be `size-10` or `size-12` max, not `size-[72px]`.
6. **Every page section that has its own in-content `<h1>` must suppress the navbar heading.** Add the segment to the `isSelfHeadedPage` check in `components/navbar.tsx`. Current suppressed segments: `members`, `reports`, plus `tasks` and `projects` detail pages.
7. **Use semantic border tokens, not hardcoded values.** `border-border` resolves to `rgba(255,255,255,0.08)` in dark mode automatically. Never write `dark:border-white/8` (Tailwind doesn't generate arbitrary opacity steps by default).

---

## Dark Mode

Dark mode is class-based via Tailwind (`darkMode: ["class"]`). A custom `ThemeProvider` (`providers/theme-provider.tsx`) toggles the `dark` class on `<html>`, persists the preference to `localStorage` under the key `"theme"`, and respects system preference via `prefers-color-scheme`.

All color values are CSS variables, so components pick up dark mode automatically — as long as you use the semantic Tailwind utilities and not raw color scale values.

## Dark Mode Surface Hierarchy

Dark mode uses a layered surface stack. Each layer is subtly lighter than the one below. Never place a darker surface on top of a lighter one.

| Layer | Token / Class | Hex approx | Usage |
|---|---|---|---|
| Page base | `bg-background` | `#0B0D12` | Full page background (darkest) |
| Sidebar | `dark:bg-sidebar` | `#151821` | Left sidebar |
| Card | `bg-card` | `#11151D` | Content cards, modals, form sections |
| Muted | `bg-muted` | `#171B24` | Section containers, subtle backgrounds |
| Card hover | `hover:bg-accent` | `#1B2130` | Hover state on interactive cards/rows |
| Elevated | `bg-popover` | `#202634` | Dropdowns, menus, tooltips |

`sidebar` and `card-hover` are custom tokens defined in `tailwind.config.ts` via `--sidebar-bg` and `--card-hover` CSS variables.

## Dark Mode Color Tokens

Defined in `app/globals.css` under `.dark`. Full palette:

**Surfaces:**
- `--background: 223 25% 6%` → `#0B0D12`
- `--card: 221 26% 9%` → `#11151D`
- `--muted: 221 22% 12%` → `#171B24` (panels)
- `--sidebar-bg: 225 22% 11%` → `#151821`
- `--card-hover: 223 28% 15%` → `#1B2130`
- `--popover: 222 24% 17%` → `#202634`

**Text:**
- `--foreground: 0 0% 93%` → off-white primary text
- `--muted-foreground: 0 0% 65%` → secondary/muted text

**Accent (blue):**
- `--primary: 217 91% 60%` → `#3B82F6` (active states, interactive elements)
- `--accent-foreground: 213 93% 68%` → `#60A5FA` (lighter blue text on blue bg)

**Borders:**
- `--border: 0 0% 100% / 8%` → `rgba(255,255,255,0.08)` (subtle dividers, card outlines)
- `--input: 0 0% 100% / 10%` → `rgba(255,255,255,0.10)` (form inputs)

## Color Palette (light mode)

Defined in `app/globals.css` under `:root`. Zinc-based neutral palette.

| Token | Light |
|---|---|
| `--background` | white |
| `--foreground` | near-black |
| `--card` | white |
| `--primary` | dark charcoal |
| `--muted` | light gray (panel) |
| `--muted-foreground` | medium gray |
| `--border` | light gray |

In Tailwind: `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, etc.

---

## Component Library

**shadcn/ui** (new-york style, zinc base) with **Radix UI** primitives. Configuration is in `components.json`.

Add new components with:
```bash
npx shadcn@latest add <component>
```

This copies the component source into `components/ui/` so it can be customised freely.

---

## Typography Hierarchy

Four clear levels — use these consistently. Do not invent intermediate sizes.

| Level | Usage | Classes |
|---|---|---|
| Page title | In-page `<h1>` | `text-2xl font-semibold text-foreground` |
| Card/section title | Section header inside a card | `text-sm font-semibold text-foreground` |
| Item title | Task name, project name in rows/cards | `text-sm font-medium text-foreground` |
| Metadata | Due dates, labels, secondary info | `text-xs text-muted-foreground` |
| Section label | Uppercase category labels (form sections, sidebar) | `text-xs font-semibold uppercase tracking-wide text-muted-foreground` |

- Avoid `text-lg` for item titles — it creates visual competition with section headers.
- Avoid `text-xl font-bold` for card titles — `text-sm font-semibold` is the correct in-card header weight.
- Page `<h1>` belongs in the page content, not in the navbar. Suppress the navbar heading for any page that renders its own title.

## Text Truncation

For item titles in fixed-width containers, use `line-clamp-2` with a `title` attribute:

```tsx
<p className="text-sm font-medium line-clamp-2" title={item.name}>{item.name}</p>
```

For single-line truncation in narrow columns: `truncate` is acceptable.

---

## Standard Card Pattern

Every content section uses this exact structure. Do not use shadcn `<Card>` components.

```tsx
<div className="bg-card border border-border rounded-xl p-5">
  {/* Section header */}
  <p className="text-sm font-semibold text-foreground border-b border-border pb-4 mb-4">
    Section Title
  </p>
  {/* Content */}
</div>
```

When the header also needs action buttons:
```tsx
<div className="flex items-center justify-between border-b border-border pb-4 mb-4">
  <p className="text-sm font-semibold text-foreground">Section Title</p>
  <div className="flex items-center gap-x-1">
    {/* action buttons */}
  </div>
</div>
```

## Interactive Row Pattern

Used for clickable list items inside cards (tasks, worklogs, members, etc.):

```tsx
<Link
  href={...}
  className="flex items-start justify-between gap-x-4 px-3 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
>
  ...
</Link>
```

For non-link rows with hover:
```tsx
<div className="flex items-center gap-x-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
```

## Form/Modal Card Pattern

Forms and settings pages use the same card pattern. Do not use shadcn `<Card>`, `<CardHeader>`, or `<CardContent>`.

```tsx
<div className="bg-card border border-border rounded-xl">
  {/* Header */}
  <div className="flex items-center px-6 py-5 border-b border-border">
    <p className="text-base font-semibold text-foreground">Form Title</p>
  </div>

  {/* Body */}
  <div className="px-6 py-5 flex flex-col gap-y-5">
    {/* form fields */}
  </div>

  {/* Footer */}
  <div className="px-6 py-4 border-t border-border flex items-center justify-between">
    <Button variant="muted">Cancel</Button>
    <Button>Submit</Button>
  </div>
</div>
```

Form sections (e.g. "View settings", "Notifications") are separated with:
```tsx
<div className="border-t border-border pt-4 flex flex-col gap-y-4">
  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    Section Name
  </p>
  {/* fields */}
</div>
```

## Danger Zone Pattern

Used at the bottom of settings/edit forms:

```tsx
<div className="border border-destructive/30 bg-destructive/5 rounded-xl p-5">
  <p className="text-sm font-semibold text-foreground">Danger Zone</p>
  <p className="text-sm text-muted-foreground mt-1">
    This action is irreversible and will remove all associated data.
  </p>
  <Button className="mt-4" size="sm" variant="destructive" onClick={handleDelete}>
    Delete X
  </Button>
</div>
```

---

## Dividers

**The only divider used in this codebase is `border-t border-border` (or `border-b border-border`).**

- `DottedSeparator` is **removed from all dashboard and form UI**. It remains only in auth page layouts (`/sign-in`, `/sign-up`).
- Use a `border-b border-border` bottom-border on a header row to separate a section title from its content.
- Use a `border-t border-border` rule between distinct groups (e.g. form sections, sidebar major areas).
- Never use `<hr>`, `<Separator>`, or explicit margin tricks to fake visual separation.

---

## Sidebar

```tsx
<aside className="h-full bg-neutral-100 dark:bg-sidebar p-4 w-full flex flex-col gap-y-4">
  <Logo />
  <div className="border-t border-border" />
  <WorkspaceSwitcher />
  <Navigation />
  <div className="border-t border-border" />
  <Projects />
</aside>
```

`gap-y-4` handles all vertical spacing. No DottedSeparators. Two `border-t` dividers mark the major structural breaks (after logo, before projects).

## Sidebar Active State

```tsx
// Active nav item
"bg-white shadow-sm text-primary dark:bg-primary/10 dark:border-l-2 dark:border-primary dark:text-primary dark:shadow-none"

// Inactive nav item
"text-neutral-600 hover:text-primary dark:text-white/55 dark:hover:text-primary"
```

In dark mode, `text-primary` = `#3B82F6` (blue). The left border accent (`dark:border-l-2 dark:border-primary`) is the intentional active indicator in dark mode.

---

## Breadcrumb Pattern

Used on detail pages (task detail, member detail, project settings) instead of a "Back" button:

```tsx
<div className="flex items-center gap-x-1.5 text-sm text-muted-foreground">
  <Link href="/workspaces/.../section" className="hover:text-foreground transition-colors">
    Section Name
  </Link>
  <ChevronRightIcon className="size-3.5 shrink-0" />
  <span>Current Item Name</span>
</div>
```

Immediately below the breadcrumb sits the page `<h1>` (`text-2xl font-semibold text-foreground`).

---

## Buttons

### Variants in use

| Variant | Usage |
|---|---|
| `default` (primary) | Primary submit/confirm actions |
| `muted` | Cancel, secondary actions, icon sidebar buttons |
| `ghost` | Icon-only nav actions (back button, close) |
| `destructive` | Danger zone delete actions |
| `secondary` | Rarely used — prefer `muted` |

### Sizing rules

- Default size for most buttons in forms and footers.
- `size="sm"` for inline actions inside cards (Edit, Add, etc.).
- `size="xs"` for tight inline actions (upload/remove image label buttons).
- **Never `size="lg"`** — it adds unnecessary bulk.
- Icon-only buttons: `className="h-7 w-7 p-0"` or `className="h-8 w-8 p-0"` depending on context.

### Back buttons (edit/settings pages)

Use a ghost icon-only button, not a labelled secondary button:

```tsx
<Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0">
  <ArrowLeftIcon className="size-4" />
</Button>
```

---

## Icon Upload / Image Placeholder

Compact pattern — `size-12 rounded-lg`, not `size-[72px]`:

```tsx
{field.value ? (
  <div className="size-12 relative rounded-lg overflow-hidden shrink-0 border border-border">
    <Image src={...} alt="icon" fill className="object-cover" />
  </div>
) : (
  <div className="size-12 shrink-0 flex items-center justify-center rounded-lg bg-muted border border-border">
    <ImageIcon className="size-5 text-muted-foreground" />
  </div>
)}
```

Upload/Remove buttons use `variant="muted" size="xs"`.

---

## Stat / KPI Cards

Used on overview pages (members list, project headers):

```tsx
// Inline stat strip (preferred for compact summaries)
<div className="flex items-center gap-x-6 px-5 py-3 bg-card border border-border rounded-xl w-fit">
  <Stat value={42} label="members" />
  <div className="h-4 w-px bg-border" />
  <Stat value={17} label="assigned tasks" />
</div>

// Individual stat card (used in grid layouts)
<div className="bg-card border border-border rounded-xl px-4 py-3">
  <p className="text-xs text-muted-foreground">{label}</p>
  <p className="text-xl font-semibold text-foreground mt-1">{value}</p>
  {caption && <p className="text-xs text-muted-foreground mt-0.5">{caption}</p>}
</div>
```

Use `h-4 w-px bg-border` as a vertical rule between inline stats — never a `|` character or DottedSeparator.

---

## Grid Layouts

Two-column detail page layout (e.g. task detail, member detail):

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
  <div className="flex flex-col gap-y-4 min-w-0">
    {/* narrow left column */}
  </div>
  <div className="flex flex-col gap-y-4 min-w-0">
    {/* wide right column */}
  </div>
</div>
```

**Always add `items-start`** to prevent the shorter column from stretching to match the taller one.  
**Always add `min-w-0`** to grid children to prevent overflow when content is wide.

---

## Member / User Cards

Clickable member card (used in the members list grid):

```tsx
<Link href={...}>
  <div className="group flex items-center gap-x-3.5 px-4 py-3.5 bg-card border border-border rounded-xl hover:bg-accent transition-colors cursor-pointer">
    {/* Avatar: size-10 rounded-lg, bg-muted, text initials */}
    {/* Name + role badge inline */}
    {/* Stats in one muted line: text-xs text-muted-foreground/70 */}
  </div>
</Link>
```

---

## Kanban Cards

Each draggable card wrapper:
```tsx
<div className="bg-card border border-border rounded-md mb-2 group">
```

Card inner content uses `p-3 flex flex-col gap-y-2.5`. Footer section separated from body with `border-t border-border/30 dark:border-white/[0.06]` (softer than full border-border in dark mode).

Hover-only action menus use `opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity`.

---

## Calendar Event Cards

Left-border accent pattern to indicate status:
```tsx
<div className="bg-card border border-border border-l-4 rounded-sm hover:bg-accent transition-colors" style={{ borderLeftColor: statusColor }}>
```

---

## Status Badges

Task status badges use soft tinted colors — 10% opacity background with matching text. Never use solid saturated badge colors.

| Status | Classes |
|---|---|
| TODO | `bg-red-500/10 text-red-700 dark:text-red-400` |
| IN_PROGRESS | `bg-yellow-500/10 text-yellow-700 dark:text-yellow-400` |
| IN_REVIEW | `bg-blue-500/10 text-blue-700 dark:text-blue-400` |
| DONE | `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400` |
| BACKLOG | `bg-pink-500/10 text-pink-700 dark:text-pink-400` |

---

## Tabs (view switcher)

```tsx
// TabsList
"bg-neutral-100 dark:bg-muted border border-transparent dark:border-border"

// TabsTrigger active
"data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-popover dark:data-[state=active]:shadow-none"
```

---

## Empty States

Every list/section that can be empty must show an icon + heading + optional description. Never show a bare "No results" text.

```tsx
<div className="flex flex-col items-center justify-center py-8 text-center gap-y-2">
  <SomeIcon className="size-8 text-muted-foreground/40" />
  <p className="text-sm font-medium text-muted-foreground">No items yet</p>
  <p className="text-xs text-muted-foreground">Add one to get started.</p>
</div>
```

---

## Select Dropdowns

`SelectContent` must use `dark:bg-card dark:text-foreground` to match the trigger background in dark mode. Without this, the open dropdown is visually inconsistent with the closed state.

---

## Icon Library

Lucide React (`lucide-react`). Import icons directly: `import { SomeIcon } from "lucide-react"`.

## Animations

Framer Motion (`framer-motion`) for component animations. `tailwindcss-animate` for CSS-based transitions.

## Notifications

Sonner (`sonner`) for toast notifications. Use `toast.success()`, `toast.error()`, etc.

---

## Component Inventory

### Shared App Components (`components/`)

| Component | Purpose |
|---|---|
| `dark-mode-switch.tsx` | Dark/light/system mode toggle |
| `navbar.tsx` | Top navigation bar — suppresses its own heading for self-headed pages |
| `sidebar.tsx` / `mobile-sidebar.tsx` | Side navigation — uses `border-t border-border` dividers, no DottedSeparator |
| `navigation.tsx` | Primary nav links |
| `projects.tsx` | Project list in sidebar |
| `workspace-switcher.tsx` | Workspace selection dropdown |
| `logo.tsx` | App logo |
| `editor.tsx` | Rich text editor (Quill) wrapper |
| `responsive-modal.tsx` | Modal that adapts to screen size |
| `dotted-separator.tsx` | Legacy — auth layouts only |
| `dynamic-icon.tsx` | Dynamic icon rendering |
| `page-error.tsx` / `page-loader.tsx` | Error and loading states |
