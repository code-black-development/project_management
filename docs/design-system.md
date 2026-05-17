# Design System

## Dark Mode

Dark mode is class-based via Tailwind (`darkMode: ["class"]`). A custom `ThemeProvider` (`providers/theme-provider.tsx`) toggles the `dark` class on `<html>`, persists the preference to `localStorage` under the key `"theme"`, and respects system preference via `prefers-color-scheme`.

All color values are CSS variables, so components pick up dark mode automatically — as long as you use the semantic Tailwind utilities and not raw color scale values.

**Critical rule: never use raw Tailwind color scale values** (e.g. `bg-neutral-100`, `text-gray-800`) without a `dark:` counterpart. Always use the CSS variable-backed semantic utilities (`bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, etc.). Raw scale values do not respond to dark mode and will cause visual bugs.

## Dark Mode Surface Hierarchy

Dark mode uses a layered surface stack. Each layer is subtly lighter than the one below. Never place a darker surface on top of a lighter one.

| Layer | Token / Class | Hex approx | Usage |
|---|---|---|---|
| Page base | `bg-background` | `#0B0D12` | Full page background (darkest) |
| Sidebar | `dark:bg-sidebar` | `#151821` | Left sidebar |
| Panel | `bg-muted` | `#171B24` | Section containers (Tasks, Projects, Members) |
| Card | `bg-card` | `#11151D` | Individual item cards inside panels |
| Card hover | `dark:hover:bg-card-hover` | `#1B2130` | Card hover state |
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

## Component Library

**shadcn/ui** (new-york style, zinc base) with **Radix UI** primitives. Configuration is in `components.json`.

Add new components with:
```bash
npx shadcn@latest add <component>
```

This copies the component source into `components/ui/` so it can be customised freely.

28 components live in `components/ui/`:
`avatar`, `badge`, `button`, `calendar`, `card`, `chart`, `checkbox`, `combobox`, `command`, `dialog`, `drawer`, `dropdown-menu`, `form`, `input`, `label`, `popover`, `progress`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, plus a custom `emalInput`.

## Shared App Components

Custom components built on top of shadcn/ui primitives live in `components/`:

| Component | Purpose |
|---|---|
| `dark-mode-switch.tsx` | Dark/light/system mode toggle |
| `navbar.tsx` / `navbar-routes.tsx` | Top navigation |
| `sidebar.tsx` / `mobile-sidebar.tsx` | Side navigation |
| `logo.tsx` | App logo |
| `editor.tsx` | Rich text editor (Quill) wrapper |
| `responsive-modal.tsx` | Modal that adapts to screen size |
| `workspace-switcher.tsx` | Workspace selection |
| `dotted-separator.tsx` | Visual divider |
| `dynamic-icon.tsx` | Dynamic icon rendering |
| `page-error.tsx` / `page-loader.tsx` | Error and loading states |

## Typography Hierarchy

Four clear levels — use these consistently.

| Level | Usage | Classes |
|---|---|---|
| Page title | Navbar h1 | `text-2xl font-semibold` |
| Section title | List/panel headers | `text-base font-semibold` |
| Item title | Task name, project name in cards | `text-sm font-medium text-foreground` |
| Metadata | Due dates, labels, secondary info | `text-xs text-muted-foreground` |

Avoid `text-lg` for item titles — it creates visual competition with section headers.

## Text Truncation

For item titles in cards, use `line-clamp-2` with a `title` attribute:

```tsx
<p className="text-sm font-medium line-clamp-2" title={item.name}>{item.name}</p>
```

## Panels and Cards

**Panels** (Tasks, Projects, Members containers):
```tsx
"col-span-1 bg-muted border border-border rounded-xl p-5"
```

**Section header row** (inside panels — replaces dotted separator):
```tsx
"flex items-center justify-between border-b border-border pb-4 mb-4"
```

**Cards** (inside panels):
```tsx
"shadow-none rounded-xl border border-border hover:bg-accent transition-colors dark:hover:bg-card-hover"
```

`border-border` works for both light and dark mode — the CSS variable resolves to a white/8% rgba in dark mode automatically. Never use `dark:border-white/8` directly (Tailwind does not generate arbitrary opacity steps by default).

## Sidebar Active State

```tsx
// Active nav item
"bg-white shadow-sm text-primary dark:bg-primary/10 dark:border-l-2 dark:border-primary dark:text-primary dark:shadow-none"

// Inactive nav item
"text-neutral-500 hover:text-primary dark:text-white/55 dark:hover:text-primary"
```

In dark mode, `text-primary` = `#3B82F6` (blue). This is intentional — `--primary` is blue in dark mode only.

## Dotted Separator

`DottedSeparator` is used sparingly. The default colour is `hsl(var(--border))` so it automatically adapts to dark mode. Use it only in the sidebar (between major sections) and in auth layouts. Do not use it inside dashboard content panels.

Inside panels, use a `border-b border-border` on the section header row instead.

## Buttons (action/icon buttons)

The `muted` button variant is used for secondary icon actions (plus, settings). It adapts to dark mode:
- Light: `bg-neutral-200 text-neutral-600`
- Dark: `bg-muted text-muted-foreground border border-border hover:bg-accent` — uses CSS variable tokens, not hardcoded opacity values

## Status Badges

Task status badges use soft tinted colors — a 10% opacity background with a matching dark text (light mode) or light text (dark mode). Never use solid saturated badge colors; they clash in both modes.

| Status | Classes |
|---|---|
| TODO | `bg-red-500/10 text-red-700 dark:text-red-400` |
| IN_PROGRESS | `bg-yellow-500/10 text-yellow-700 dark:text-yellow-400` |
| IN_REVIEW | `bg-blue-500/10 text-blue-700 dark:text-blue-400` |
| DONE | `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400` |
| BACKLOG | `bg-pink-500/10 text-pink-700 dark:text-pink-400` |

## Tabs (view switcher)

The `TabsList` uses `bg-neutral-100 dark:bg-muted` with a transparent border in light mode and `dark:border-border` in dark mode. The active `TabsTrigger` uses `data-[state=active]:bg-white data-[state=active]:shadow-sm` in light mode and `dark:data-[state=active]:bg-popover dark:data-[state=active]:shadow-none` in dark mode. This keeps the active tab elevated but not blindingly bright.

## Icon Library

Lucide React (`lucide-react`). Import icons directly: `import { SomeIcon } from "lucide-react"`.

## Animations

Framer Motion (`framer-motion`) for component animations. `tailwindcss-animate` for CSS-based transitions.

## Notifications

Sonner (`sonner`) for toast notifications. Use `toast.success()`, `toast.error()`, etc.
