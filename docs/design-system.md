# Design System

## Dark Mode

Dark mode is class-based via Tailwind (`darkMode: ["class"]`). A custom `ThemeProvider` (`providers/theme-provider.tsx`) toggles the `dark` class on `<html>`, persists the preference to `localStorage` under the key `"theme"`, and respects system preference via `prefers-color-scheme`.

All color values are CSS variables, so components pick up dark mode automatically — as long as you use the semantic Tailwind utilities and not raw color scale values.

**Critical rule: never use raw Tailwind color scale values** (e.g. `bg-neutral-100`, `text-gray-800`) without a `dark:` counterpart. Always use the CSS variable-backed semantic utilities instead (`bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, etc.). Raw scale values do not respond to dark mode and will cause visual bugs.

## Dark Mode Surface Hierarchy

Dark mode uses a layered surface stack — each level is subtly lighter than the one below. Always respect this order; never place a darker surface on top of a lighter one.

| Layer | Token | Usage |
|---|---|---|
| Base | `bg-background` | Page background |
| Panel | `bg-muted` | Section containers (task list, project list) |
| Card | `bg-card` | Individual item cards inside panels |
| Sidebar | `bg-neutral-800` | Sidebar (hardcoded — predates CSS variable adoption) |

The CSS variables for dark mode (`app/globals.css`):
- `--background`: `240 10% 3.9%` — near black
- `--card`: `240 8% 8%` — just above background so cards are visible
- `--muted`: `240 3.7% 15.9%` — panel grey
- `--border`: `240 4% 20%` — readable border in dark mode

**Do not** use `dark:bg-neutral-*` hardcoded values for new components — update the CSS variables if the token system needs extending.

## Color Palette

Defined as CSS variables in `app/globals.css`. Zinc-based neutral palette — no brand accent colors. Colors are consumed through semantic tokens, not raw Tailwind scales.

| Token | Light | Dark |
|---|---|---|
| `--background` | white | near-black (`240 10% 3.9%`) |
| `--foreground` | near-black | off-white |
| `--card` | white | just above background (`240 8% 8%`) |
| `--primary` | dark neutral | off-white |
| `--secondary` | very light gray | dark gray |
| `--muted` | light gray | panel gray (`240 3.7% 15.9%`) |
| `--accent` | light gray | dark gray |
| `--destructive` | red | darker red |
| `--border` | light gray | readable gray (`240 4% 20%`) |

In Tailwind, these are used as: `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, etc.

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

## Icon Library

Lucide React (`lucide-react`). Import icons directly: `import { SomeIcon } from "lucide-react"`.

## Animations

Framer Motion (`framer-motion`) for component animations. `tailwindcss-animate` for CSS-based transitions.

## Typography Hierarchy

Four clear levels — use these consistently. Mixing levels (e.g. using a section title style for an item title) weakens the visual hierarchy.

| Level | Usage | Classes |
|---|---|---|
| Page title | Navbar h1 | `text-2xl font-semibold` |
| Section title | List/panel headers (Tasks, Projects, Members) | `text-base font-semibold` |
| Item title | Task name, project name in cards | `text-sm font-medium` |
| Metadata | Due dates, labels, secondary info | `text-xs text-muted-foreground` |

## Text Truncation

For item titles in cards, use `line-clamp-2` (wraps to two lines before cutting) rather than `truncate` (hard single-line cut). Always add a `title` attribute so the full text is available on hover:

```tsx
<p className="text-sm font-medium line-clamp-2" title={item.name}>{item.name}</p>
```

## Dotted Separator

`DottedSeparator` is used sparingly. It belongs in the sidebar (between major sections) and in the auth layout. Do not use it inside dashboard content cards — use `border-b border-border` on the header row instead:

```tsx
<div className="flex items-center justify-between border-b border-border pb-4 mb-4">
  ...
</div>
```

## Notifications

Sonner (`sonner`) for toast notifications. Use `toast.success()`, `toast.error()`, etc.
