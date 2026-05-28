# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server
npm run dev

# Production build (runs tsc -b then vite build)
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

**npm auth workaround**: The global `~/.npmrc` has Azure DevOps credentials that conflict with the public npm registry. Prefix all `npm install` commands with env overrides:

```bash
npm_config_registry=https://registry.npmjs.org/ npm_config_always_auth=false npm install <package>
```

The project-level `.npmrc` already sets the correct registry, but the global file overrides it for installs.

## Architecture

**Stack**: Vite 8 · React 19 · TypeScript 6 · SCSS (via sass) · React Router DOM 7

```
src/
  styles/
    _variables.scss     # All design tokens (colors, spacing, layout, metal colors)
  components/           # Reusable UI library (~40 components, each in its own folder)
    index.ts            # Barrel re-export for all components
  layouts/
    AppLayout/          # NavBar + Sidebar shell wrapping page content
  pages/
    SearchPage/         # /search route — hero, search bar, card grid
  App.tsx               # BrowserRouter + Routes; / redirects to /search
  main.tsx              # React root mount
```

### Styling

Every component has a co-located `.scss` file. All files import variables with:
```scss
@use '../../styles/variables' as v;
```
then reference tokens as `v.$color-brand`, `v.$space-16`, etc.

**No inline styles.** All visual variants are expressed as SCSS modifier classes (BEM `&--modifier` pattern). Never add `style={...}` props to components.

### TypeScript constraints

`tsconfig.app.json` enables `verbatimModuleSyntax`, which requires type-only imports to use `import type`:
```ts
import type { BadgeVariant } from './Badge';   // ✓
import { BadgeVariant } from './Badge';         // ✗ — TS error
```
`noUnusedLocals` and `noUnusedParameters` are on — remove unused imports immediately.

### Component conventions

- Each component lives in `src/components/<Name>/<Name>.tsx` + `<Name>.scss`.
- Named exports only (no default exports from components).
- Props that affect appearance use typed string unions + SCSS modifier classes, not inline styles or style props.
- Icons are always inline SVG (`fill="none"`, `stroke="currentColor"`, `strokeWidth={1.8}` for 14px, `1.8` for 18px).
- React `ReactNode` for icon props; import as `import type { ReactNode } from 'react'`.

### Routing and layout

`AppLayout` (`src/layouts/AppLayout/`) provides the full-page shell: fixed `NavBar` + scrollable `Sidebar` + `main` content area. All routes that need the app chrome wrap their page component with `<AppLayout>`.

The `NavBar` is `position: fixed` at `$nav-height` (54px). `AppLayout__body` uses `margin-top: $nav-height` and `height: calc(100vh - $nav-height)` so the sidebar and main fill the remaining viewport.

### Design tokens (key values)

| Token | Value |
|-------|-------|
| `$color-brand` | `#C85A0A` (orange) |
| `$color-bg` | `#F8F5F2` (warm off-white) |
| `$color-white` | `#FFFFFF` |
| `$nav-height` | `3.375rem` (54px) |
| `$sidebar-width` | `13.125rem` (210px) |
| `$font-sans` | DM Sans |
| `$font-mono` | DM Mono |

Spacing uses `$space-N` tokens where N is the pixel value (e.g. `$space-16` = 1rem = 16px). Full list is in `src/styles/_variables.scss`.

### Badge variants

`BadgeVariant` covers: `oxide` · `sulfide` · `carbonate` · `silicate` · `native` · `phosphate` · `sulfate` · `halide` · `float-vg` · `float-g` · `float-m` · `float-p` · `float-n` · `info` · `ok` · `warn` · `bad`.

### HomeCard icon variants

`HomeCardIconVariant`: `brand` (orange) · `green` · `blue` · `brown` (amber) · `olive`
