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

### The cascade model (why order is not yours to rely on)

Three stylesheets meet on a migrated element, and their order differs between `sanity dev` and
`sanity build`:

| Sheet                                     | `sanity build`                                 | `sanity dev`                                                                                                               |
| ----------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| vanilla-extract (`bundle.css`)            | one static file, loaded first                  | one `<style>` per `.css.ts` module, injected when the module evaluates — lazy chunks land **after** styled-components' tag |
| `@sanity/ui` (styled-components, runtime) | `<style data-styled>` appended on first render | same                                                                                                                       |
| `ui5` (`styles.css`)                      | static file                                    | static file                                                                                                                |

Consequences:

- **Never rely on order against `@sanity/ui`.** On an equal-specificity tie the winner flips between
  dev and prod. Beat the primitive's own rule by specificity: `&&` (0,2,0) beats a plain component
  class (0,1,0). If the primitive rule you override already has two classes or a pseudo-class chain
  (e.g. Card's `&[data-as='button']:not(:disabled)[data-selected]`), count its specificity and
  exceed it — `&&&`, or `&&[data-as='button']`. Read the rule in
  `node_modules/@sanity/ui/dist/*.js` when unsure. `!important` stays banned.
- **styled-components gave you order for free; vanilla-extract does not.** A `styled(X)` wrapper
  was always injected after `X`, so its equal-specificity declarations won. After migration, both
  classes live in `bundle.css` in **module evaluation order**: within one `.css.ts` file, definition
  order; across files, the importing file comes after the imported one. So for a
  `styled(LocalStyledThing)` chain, define the override **below** the base in the same `.css.ts`
  (or compose it with `style([base, {...}])`). For an override whose base lives in another
  `.css.ts`, import that class into the overriding file — the import is what guarantees the
  ordering — or use `&&`.
- **Two classes on one element from unrelated files** (e.g. a `styled.div` root class plus a
  parent-state selector `${parent}:hover &` defined elsewhere) are ordered by the same rule.
  When a declaration must win regardless of file order, raise its specificity rather than
  betting on order.
- **`@media` blocks are hoisted.** vanilla-extract emits a file's media queries after that file's
  base rules, which is what styled-components effectively did too. Media conditions cannot read
  custom properties, so theme breakpoints are written as literals from the default theme (table
  below) with a comment naming the theme key they mirror.

#### What each `@sanity/ui` primitive sets on itself

Use `&&` when the migrated rule overrides one of these; plain `style()` otherwise.

| Primitive                                                                                         | Own declarations (via its props or defaults)                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Box`                                                                                             | `display` (block, or the `display` prop), `box-sizing`, `flex`/`flex-shrink`/`flex-grow` props, `margin*`, `padding*`, `height`, `overflow`, `column`/`row` grid props, `list-style: none` for `as="ul"/"ol"`                                                                       |
| `Flex`                                                                                            | Box + `display: flex`, `flex-direction`, `flex-wrap`, `align-items`, `justify-content`, `gap`                                                                                                                                                                                       |
| `Stack`                                                                                           | Box + `display: grid`, `grid-template-columns`, `grid-auto-rows`, `gap`                                                                                                                                                                                                             |
| `Grid`, `Inline`                                                                                  | Box + `display`, `gap`, `grid-*`, `align-items`                                                                                                                                                                                                                                     |
| `Card`                                                                                            | Box + `background-color`, `color`, `color-scheme`, every `--card-*` variable, `border`/`border-color` (`border` prop), `border-radius` (`radius`), `box-shadow` (`shadow`, focus ring), `&[data-as='button'                                                                         | 'a']`hover/pressed/selected/disabled variants,`outline`, `font`, `text-align`, `appearance`, `width` (button) |
| `Container`                                                                                       | Box + `max-width`, `margin: 0 auto`                                                                                                                                                                                                                                                 |
| `Text`, `Label`, `Heading`, `Code`                                                                | `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `color` (`--card-fg-color` / muted / accent), `text-align`; descendant rules for `& code`, `& a` (color `--card-link-color`, focus ring), `& strong`, `& svg`; the inner `span` handles `text-overflow` |
| `Button`                                                                                          | Card-like colors per `mode`/`tone`, `padding`, `border-radius`, `font`, `box-shadow`, `cursor`, `&:disabled`, `&:not(:disabled):hover`, `& [data-ui='Text']`                                                                                                                        |
| `TextInput`, `TextArea`, `Select`                                                                 | wrapper `position: relative`; the inner `input`/`textarea`/`select` gets font, color, padding, border via presentation `span`; `--input-*` variables                                                                                                                                |
| `Skeleton`, `TextSkeleton`, `LabelSkeleton`                                                       | `background-color`, `border-radius`, `animation`, `width`, `height`                                                                                                                                                                                                                 |
| `Popover`, `Tooltip`, `Layer`, `Dialog`                                                           | `position`, `z-index`, `pointer-events`, `max-width`; Popover/Tooltip content Card colors                                                                                                                                                                                           |
| `Badge`, `KBD`, `Spinner`, `Switch`, `Checkbox`, `Radio`, `Avatar`, `Tab`, `TreeItem`, `MenuItem` | fully self-styled — treat every declaration as an override (`&&`)                                                                                                                                                                                                                   |

#### Theme reads → CSS variables

`getTheme_v2(theme)` inside a styled template and `useTheme_v2()` inside the wrapper read the
same context, including the nearest `Card`'s `tone` and `scheme`. Prefer a variable `@sanity/ui`
already publishes on the nearest Card (they follow tone and scheme for free):

| Theme read                                                        | CSS variable                                                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `color.bg`, `color.fg`, `color.border`, `color.icon`              | `--card-bg-color`, `--card-fg-color`, `--card-border-color`, `--card-icon-color`       |
| `color.muted.bg`, `color.muted.fg`, `color.accent.fg`             | `--card-muted-bg-color`, `--card-muted-fg-color`, `--card-accent-fg-color`             |
| `color.focusRing`, `color.backdrop`                               | `--card-focus-ring-color`, `--card-backdrop-color`                                     |
| `color.badge.<tone>.{bg,fg,dot,icon}`                             | `--card-badge-<tone>-{bg,fg,dot,icon}-color`                                           |
| `color.avatar.<hue>.{bg,fg}`                                      | `--card-avatar-<hue>-{bg,fg}-color`                                                    |
| `color.link.fg`, `color.code.{bg,fg}`, `color.kbd.{bg,fg,border}` | `--card-link-fg-color`, `--card-code-{bg,fg}-color`, `--card-kbd-{bg,fg,border}-color` |
| `color.shadow.{outline,umbra,penumbra,ambient}`                   | `--card-shadow-{outline,umbra,penumbra,ambient}-color`                                 |
| `color.skeleton.{from,to}`                                        | `--card-skeleton-color-{from,to}`                                                      |
| `color.hairline.{soft,hard}`                                      | `--card-hairline-{soft,hard}-color`                                                    |
| card focus ring box-shadow (`focusRingStyle(...)`)                | `--card-focus-ring-box-shadow` (set by Card/Button on `:focus-visible`)                |

Everything else — `color.selectable.*`, `color.solid.*`, `color.input.*`, `color.button.*`,
`color.syntax.*`, `color._dark`, `space[n]`, `radius[n]`, `font.*`, `container[n]`,
`avatar.sizes[n]`, `input.*`, `shadow[n]` — goes through Shape C: `createVar()` in the `.css.ts`,
`useTheme_v2()` + `assignInlineVars()` in the wrapper. Keep the same theme key names in the var
names (`space3Var`, `radius2Var`) so the intent survives. Do not hardcode scale values: a studio
may build its own theme with different `space`, `radius`, or `font` scales.

Only `@media` conditions get literals, mirrored from the default theme:

| Key         | Default values                         |
| ----------- | -------------------------------------- |
| `media`     | `[360, 600, 900, 1200, 1800, 2400]` px |
| `container` | `[320, 640, 960, 1280, 1600, 1920]` px |

Write them as `'@media': {'screen and (min-width: 600px)': {...}}` with a comment such as
`// media[1]`.

### Wrapper contract

A wrapper that replaces an exported styled component must keep call sites working without edits:

- Same export name, same prop names — including transient `$props`, which become regular props
  the wrapper consumes (do not rename them; callers in other directories still pass them).
- `className` and `style` **merge** (`clsx`, spread) — never clobber.
- `ref` flows through props (React 19). No `forwardRef`, no `displayName`.
- `.attrs({...})` values become JSX props on the primitive inside the wrapper; `forwardedAs`
  becomes `as`.
- A prop-driven `css` branch becomes one `style()` per branch plus `clsx(cond && cls)`; a
  prop-driven **value** becomes a `createVar()` set with `assignInlineVars`. Prefer
  `styleVariants()` for a closed set of values.
- Shared `css` mixins (`export const focusRingStyles = css\`...\``) become an exported
`StyleRule`object or`style()`class in a`.css.ts`; importers compose it with
`style([mixin, {...}])`.
- A test that asserted a computed style of a migrated component (`toHaveStyle`) cannot pass in
  jsdom anymore (runtime styles are disabled). Assert the state through a `data-*` attribute the
  wrapper sets instead; add the attribute if none exists.

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
