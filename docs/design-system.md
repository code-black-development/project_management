# Design System

## Dark Mode

Dark mode is class-based via Tailwind (`darkMode: ["class"]`). A custom `ThemeProvider` (`providers/theme-provider.tsx`) toggles the `dark` class on `<html>`, persists the preference to `localStorage` under the key `"theme"`, and respects system preference via `prefers-color-scheme`.

All color values are CSS variables, so components pick up dark mode automatically — as long as you use the semantic Tailwind utilities and not raw color scale values.

**Critical rule: never use raw Tailwind color scale values** (e.g. `bg-neutral-100`, `text-gray-800`) without a `dark:` counterpart. Always use the CSS variable-backed semantic utilities instead. Raw scale values do not respond to dark mode and will cause visual bugs.

## Color Palette

Defined as CSS variables in `app/globals.css`. Zinc-based neutral palette — no brand accent colors. Colors are consumed through semantic tokens, not raw Tailwind scales.

| Token | Light | Dark |
|---|---|---|
| `--background` | white | near-black (`240 10% 3.9%`) |
| `--foreground` | near-black | off-white |
| `--card` | white | near-black |
| `--primary` | dark neutral | off-white |
| `--secondary` | very light gray | dark gray |
| `--muted` | light gray | dark gray |
| `--accent` | light gray | dark gray |
| `--destructive` | red | darker red |
| `--border` | light gray | dark gray |

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

## Notifications

Sonner (`sonner`) for toast notifications. Use `toast.success()`, `toast.error()`, etc.
