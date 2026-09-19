---
name: migrate-styled-components-to-vanilla-extract
description: Step-by-step procedure for migrating components in the Sanity monorepo off styled-components to vanilla-extract (zero-runtime CSS). Use when converting styled() components to .css.ts files, creating .css.ts files, handling CSS specificity against @sanity/ui, styling child elements with vanilla-extract, or when asked to migrate styling to vanilla-extract.
---

# Migrate styled-components to vanilla-extract

The repeatable procedure for converting this monorepo's styling from `styled-components` (the
Studio's legacy styling library) to [vanilla-extract](https://vanilla-extract.style). Adapted from
the `sanity-io/plugins` skill of the same name for this repo's setup.

**The infrastructure is already wired — never touch it during a component migration.**
`packages/sanity` and `packages/@sanity/vision` build `.css.ts` files into `lib/bundle.css` via
`vanillaExtract: true` in their `tsdown.config.ts`, expose the `./bundle.css` export, register
`vanillaExtractPlugin()` in their `vitest.config.mts`, and the dev studios register it in
`sanity.cli.ts`. A migration PR only converts component styles.

## Ground rules

- **Identical visual output is the goal.** This is a refactor, not a redesign — every rule and
  specificity outcome must be preserved. Copy CSS values verbatim; do not "improve" them.
- **Small PRs.** Migrate one component (or one tightly-coupled cluster) per PR, conventional-commit
  titled, e.g. `refactor(structure): migrate Scroller to vanilla-extract`.
- **Reference implementations:** `packages/@sanity/vision` (fully migrated, styled-components
  banned there by lint), `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.*`, and
  `packages/sanity/src/structure/panes/document/document-layout/DocumentLayout.*`.

## Step 1: Inventory

Classify each usage before touching code:

```bash
rg "from 'styled-components'" packages/sanity/src <target-dir>
```

| Usage                                               | Migration target                                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Static `styled.div` / `styled(Primitive)`           | `style()` in a colocated `.css.ts` + thin wrapper component (or plain `className`)                          |
| Overrides of `@sanity/ui` primitives' own styles    | `style()` with the `&&` specificity trick (see below)                                                       |
| Theme reads (`({theme}) => ...`, `getTheme_v2`)     | `--card-*` CSS custom properties if one exists, else `createVar()` + `assignInlineVars()` + `useTheme_v2()` |
| Prop-driven variants (`$isInvalid`, `css` branches) | one `style()` per state + conditional `clsx()` composition (or `styleVariants()`)                           |
| `keyframes` animations                              | vanilla-extract `keyframes()`                                                                               |
| Descendant selectors (`& img`, third-party classes) | class on the child directly, `${parent} &`, or scoped `globalStyle()`                                       |
| `createGlobalStyle`                                 | `globalStyle()` (scope it — never leak outside the component)                                               |
| `*.styled.tsx` modules                              | `.css.ts` + thin wrappers; keep the `.styled.tsx` file when call sites need it                              |
| Computed inline `style={{}}` objects                | static parts into `style()`, changing values via `createVar()` (Shape C below)                              |

## Step 2: Migrate the code

Create a `ComponentName.css.ts` next to the component. Files calling vanilla-extract APIs
(`style`, `styleVariants`, `createVar`, `globalStyle`, `keyframes`) **must** use the `.css.ts`
extension — a plain `.ts` file throws "Styles were unable to be assigned to a file" at runtime.

**Shape A — keep the component layer.** When the styled element is used like a component, replace
it with a `style()` rule plus a thin wrapper keeping the same name and API, so call sites don't
change. Type with `ComponentProps<typeof Primitive>` (or `ComponentProps<'div'>`) — never
`forwardRef`; `ref` is a regular prop on React 19 and flows through the spread. **Merge, don't
clobber:** a fixed `className={...}` after `{...props}` silently drops a caller's `className` —
merge with `clsx` (already a dependency):

```tsx
import {Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {floatingCard} from './FloatingCard.css'

export function FloatingCard(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props
  return <Card {...rest} className={clsx(floatingCard, className)} />
}
```

Renaming a `Component.styled.ts` to `.tsx` (or `.ts` → `.tsx`) keeps extension-less import paths
at call sites unchanged.

**Shape B — flatten single-use wrappers.** When the styled element was an internal, single-use
`styled.div` with no meaningful API, delete it and put the class directly on the element:
`<div className={paragraph}>{children}</div>`.

**Shape C — dynamic values through CSS variables.** First check whether `@sanity/ui` already
exposes the value as a CSS custom property — prefer e.g. `var(--card-bg-color)` over JS theme
reads (see `ElementWithChangeBar.css.ts`). Otherwise keep static parts in `style()` and bridge
only changing values with `createVar()` + `assignInlineVars()` (from `@vanilla-extract/dynamic`,
not `@vanilla-extract/css`), reading the theme with `useTheme_v2()` (alias it
`useTheme_v2 as useThemeV2` to satisfy the camelCase lint):

```ts
// Wrapper.css.ts
import {createVar, style} from '@vanilla-extract/css'

export const paddingVar = createVar()
export const wrapper = style({paddingBottom: paddingVar})
```

```tsx
<div className={wrapper} style={assignInlineVars({[paddingVar]: `${space[4]}px`})} />
```

`assignInlineVars` omits `undefined` values, so one class serves every instance.

### Specificity against @sanity/ui: the `&&` trick

`@sanity/ui` still uses styled-components, which injects its styles at runtime — usually **after**
the extracted vanilla-extract stylesheet, so an equal-specificity class loses. When overriding a
primitive's own styles (e.g. `styled(Card)` overriding Card's background), double the class:

```ts
export const transparentCard = style({
  selectors: {
    '&&': {background: 'none'},
  },
})
```

Where styled-components silently won specificity battles via CSSOM insertion order, reach for
`&&` rather than `!important`. Plain-element styles (`styled.div`) need no trick.

### Child and descendant selectors

`style()` selectors **must target the current element**: `&` must be the subject. `'& img'` or
`` `& ${child}` `` are invalid (vanilla-extract throws at build time), but `` `${parent} &` `` is
valid (self, scoped under parent — define `parent` first). In order of preference:

1. Put a class directly on the child if you render it yourself.
2. ``selectors: {[`${parent}:hover &`]: {...}}`` on the child style for parent-state-dependent rules.
3. `globalStyle(`${root} img`, {...})` when you don't control the child (library-rendered DOM) —
   always scoped under a local class.

## Step 3: Verify

```bash
pnpm lint:fix                                  # oxfmt + oxlint (includes type checking)
pnpm build && pnpm vitest run --project=sanity <affected test paths>
```

Check `packages/sanity/lib/bundle.css` after the build: every migrated rule must appear there.

Verify **visual fidelity** in the dev studio (`pnpm dev`, see AGENTS.md for cloud-agent auth):
exercise the migrated component and compare against the pre-migration rendering — theme tones,
spacing, hover/focus states, stacking. Jsdom tests must not assert on vanilla-extract class names
or computed styles (runtime styles are disabled there — see AGENTS.md); assert on `data-testid`.
For high-traffic components, add a Chromatic story per the `sanity-visual-regression` skill so the
migration is sentinel-protected.

## End state per package

Once a package is fully migrated, a `no-restricted-imports` ban keeps styled-components from
creeping back — see the `packages/@sanity/vision/**` override in `.oxlintrc.json`. Per AGENTS.md,
`.oxlintrc.json` changes require an explicit maintainer request; propose the ban in the final
migration PR rather than adding it unprompted.

## Checklist

- [ ] `styled-components` import removed from the migrated component; emptied `.styled.tsx`
      modules deleted
- [ ] `.css.ts` colocated; CSS values copied verbatim; component layer preserved where call sites
      need it; `className` merged, not clobbered
- [ ] `&&` used where the original relied on styled-components injection order to beat @sanity/ui
- [ ] No build config, `package.json`, or exports changes (infra is already wired)
- [ ] `pnpm lint:fix`, `pnpm build`, and affected tests pass; rules present in `lib/bundle.css`
- [ ] Visual fidelity verified against the pre-migration rendering
