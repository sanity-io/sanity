---
name: migrate-styled-components-to-panda-css
description: Step-by-step procedure for migrating components in the Sanity monorepo off styled-components to Panda CSS (zero-runtime, build-time extracted CSS). Use when converting styled() components to .css.ts files, creating .css.ts files, handling CSS specificity against @sanity/ui, styling child elements with Panda, or when asked to migrate styling to Panda CSS.
---

# Migrate styled-components to Panda CSS

The repeatable procedure for converting this monorepo's styling from `styled-components` (the
Studio's legacy styling library) to [Panda CSS](https://panda-css.com). Adapted from the
`sanity-io/plugins` skill for vanilla-extract, which this repo used before Panda.

**The infrastructure is already wired — never touch it during a component migration.**
`packages/sanity` builds its `.css.ts` files into `lib/bundle.css` through the `panda` option of
`@sanity/tsdown-config` in its `tsdown.config.ts` (`panda.config.ts` next to it), exposes the
`./bundle.css` export, registers `@pandacss/vite` in its `vitest.config.mts`, and the dev
studios, Storybook and the browser suite point their own `@pandacss/vite` instance at the
package (`packages/sanity/panda.config.ts` is the repository's only Panda project). A migration
PR only converts component styles.

## Ground rules

- **Identical visual output is the goal.** This is a refactor, not a redesign — every rule and
  specificity outcome must be preserved. Copy CSS values verbatim; do not "improve" them.
- **Small PRs.** Migrate one component (or one tightly-coupled cluster) per PR, conventional-commit
  titled, e.g. `refactor(structure): migrate Scroller to Panda CSS`.
- **Reference implementations:**
  `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.*` (data attributes for
  parent-state selectors), `packages/sanity/src/structure/panes/document/document-layout/DocumentLayout.*`,
  and for the dynamic shapes `packages/sanity/src/core/components/popoverDialog/PopoverContainer.*`
  (responsive widths through per-breakpoint variables) and
  `packages/sanity/src/core/form/inputs/PortableText/text/TextBlock.styles.*` (per-level variants,
  private custom properties, theme-driven colors).

## Step 1: Inventory

Classify each usage before touching code:

```bash
rg "from 'styled-components'" packages/sanity/src <target-dir>
```

| Usage                                               | Migration target                                                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Static `styled.div` / `styled(Primitive)`           | `css()` in a colocated `.css.ts` + thin wrapper component (or plain `className`)                                          |
| Overrides of `@sanity/ui` primitives' own styles    | `css()` with the `&&` specificity trick (see below)                                                                       |
| Theme reads (`({theme}) => ...`, `getTheme_v2`)     | `--card-*` CSS custom properties if one exists, else a named custom property set through inline `style` + `useTheme_v2()` |
| Prop-driven variants (`$isInvalid`, `css` branches) | one `css()` per state + conditional `clsx()` composition (the modifier doubled with `&&`), or an object of `css()` calls  |
| `keyframes` animations                              | Panda `keyframes()` from `#styled-system/css`                                                                             |
| Descendant selectors (`& img`, third-party classes) | class on the child directly, or a nested `'& img'` / `'& .third-party'` selector on the parent class                      |
| `createGlobalStyle`                                 | nested selectors under a local class (never leak outside the component)                                                   |
| `*.styled.tsx` modules                              | `.css.ts` + thin wrappers; keep the `.styled.tsx` file when call sites need it                                            |
| Computed inline `style={{}}` objects                | static parts into `css()`, changing values through custom properties (Shape C below)                                      |

## Step 2: Migrate the code

Create a `ComponentName.css.ts` next to the component. Only `.css.ts` files are Panda sources
(`include` in `panda.config.ts`): a `css()` call anywhere else is neither extracted into
`bundle.css` nor rewritten to class names, so its styles never render. Import from
`#styled-system/css` (the generated runtime, mapped by the package's `imports`; it exists after
`pnpm install`, which runs `panda codegen`). The build rewrites every statically resolvable call
into its class names, so the published code carries no Panda runtime — keep the style objects
literal (no loops, no values computed from imports) and pass the module's own constants only.

**Shape A — keep the component layer.** When the styled element is used like a component, replace
it with a `css()` rule plus a thin wrapper keeping the same name and API, so call sites don't
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
reads (see `ElementWithChangeBar.css.ts`). Otherwise keep static parts in `css()` and bridge only
changing values with a named custom property the wrapper sets inline, reading the theme with
`useTheme_v2()` (alias it `useTheme_v2 as useThemeV2` to satisfy the camelCase lint):

```ts
// Wrapper.css.ts
import {css} from '#styled-system/css'

/** Set inline by `Wrapper` from the theme */
export const paddingVar = '--wrapper-padding'
export const wrapper = css({paddingBottom: `var(${paddingVar})`})
```

```tsx
<div className={wrapper} style={{[paddingVar]: `${space[4]}px`} as CSSProperties} />
```

Name the property after the component and the theme key (`--wrapper-space-4`), since it is
global to the page; one class serves every instance.

### Specificity against @sanity/ui: the `&&` trick

`@sanity/ui` v4 still uses styled-components, which injects its styles at runtime — **after** the
extracted stylesheet, so an equal-specificity class loses. When overriding a primitive's own
styles (e.g. `styled(Card)` overriding Card's background), double the class:

```ts
export const transparentCard = css({
  '&&': {background: 'none'},
})
```

Where styled-components silently won specificity battles via CSSOM insertion order, reach for
`&&` rather than `!important`. Plain-element styles (`styled.div`) need no trick.

### The cascade model (why order is not yours to rely on)

Three stylesheets meet on a migrated element:

| Sheet                                     | `sanity build`                                      | `sanity dev`                                                                                                |
| ----------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Panda (`bundle.css`)                      | one static file, imported first by the entry chunks | one stylesheet (`@repo/pandacss/panda.css`) filled by `@pandacss/vite`, imported first by the runtime entry |
| `@sanity/ui` (styled-components, runtime) | `<style data-styled>` appended on first render      | same                                                                                                        |
| `ui5` (`styles.css`)                      | static file                                         | static file                                                                                                 |

Panda writes its rules into cascade layers; the studio ships them without any (`cascadeLayers:
false` for `bundle.css`, the same pass for the dev stylesheet — see the "Panda CSS" section of
AGENTS.md). CSS outside any layer beats every layered rule regardless of specificity, so layers
would hand the studio's hover, focus and selected states to any unlayered rule that also matches.
Unlayered, the studio's rules cascade like the vanilla-extract output did: by specificity, then
source order. Do not write `@layer` in a `.css.ts`.

Consequences:

- **Beat `@sanity/ui`'s rules by specificity, not by order.** `@sanity/ui`'s styled-components
  rules are injected at runtime, after the static stylesheets, and `ui5`'s component classes load
  as static CSS too; order is theirs, so a rule of yours that must win over one of theirs has to
  be more specific: `&&` (0,2,0) beats a plain component class (0,1,0). If the primitive rule you
  override already has two classes or a pseudo-class chain (e.g. Card's
  `&[data-as='button']:not(:disabled)[data-selected]`), count its specificity and exceed it —
  `&&&`, or `&&[data-as='button']`. Read the rule in `node_modules/@sanity/ui/dist/*.js` when
  unsure. `!important` stays banned.
- **Panda emits one rule per declaration, not one per class.** `css({display: 'flex', opacity: 1})`
  returns two class names, one per declaration, and `bundle.css` holds every distinct
  `property: value` pair once, grouped by property with the values **sorted alphabetically**. So
  when two of your classes set the same property on one element (`clsx(rootBox, muted && rootBoxMuted)`),
  the value that sorts last wins — `opacity: 1` beats `opacity: 0.8` whatever the declaration
  order. A modifier that must win doubles its class: `rootBoxMuted = css({'&&': {opacity: 0.8}})`.
  The same holds for a `styled(LocalStyledThing)` chain, which styled-components ordered for you.
- **Shorthands come before longhands.** `padding: 0` in one class and `paddingLeft: '4px'` in
  another on the same element always resolve to the longhand, regardless of order.
- **Parent-state selectors key on data attributes, never on an empty class.** A Panda class name
  is a list of atomic names, so `` `${parent}:hover &` `` cannot be built from it, and a class
  that exists only to be targeted is not an option either. Have the parent render its identity
  and state as data attributes (`data-change-bar-wrapper=""`, `data-focused={hasFocus ? '' :
  undefined}`) and write `'[data-change-bar-wrapper][data-focused] &': {...}` or
  `'[data-change-bar-wrapper]:hover &': {...}` on the child — see `ElementWithChangeBar.css.ts`.
  Read a state attribute together with the identity attribute: generic names like `data-focused`
  and `data-disabled` are rendered by other components too, and `:not([data-changed])` on its own
  matches every ancestor. Attributes a library component already renders (`'[data-ui="Card"] &'`)
  work the same way.
- **`@media` blocks are grouped.** Panda emits a file's media queries after the base rules,
  which is what styled-components effectively did too. Media conditions cannot read custom
  properties, so theme breakpoints are written as literals from the default theme (table
  below) with a comment naming the theme key they mirror.

#### What each `@sanity/ui` primitive sets on itself

Use `&&` when the migrated rule overrides one of these; plain `css()` otherwise.

| Primitive                                                                                         | Own declarations (via its props or defaults)                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Box`                                                                                             | `display` (block, or the `display` prop), `box-sizing`, `flex`/`flex-shrink`/`flex-grow` props, `margin*`, `padding*`, `height`, `overflow`, `column`/`row` grid props, `list-style: none` for `as="ul"/"ol"`                                                                                                 |
| `Flex`                                                                                            | Box + `display: flex`, `flex-direction`, `flex-wrap`, `align-items`, `justify-content`, `gap`                                                                                                                                                                                                                 |
| `Stack`                                                                                           | Box + `display: grid`, `grid-template-columns`, `grid-auto-rows`, `gap`                                                                                                                                                                                                                                       |
| `Grid`, `Inline`                                                                                  | Box + `display`, `gap`, `grid-*`, `align-items`                                                                                                                                                                                                                                                               |
| `Card`                                                                                            | Box + `background-color`, `color`, `color-scheme`, every `--card-*` variable, `border`/`border-color` (`border` prop), `border-radius` (`radius`), `box-shadow` (`shadow`, focus ring), button/link hover/pressed/selected/disabled variants, `outline`, `font`, `text-align`, `appearance`, `width` (button) |
| `Container`                                                                                       | Box + `max-width`, `margin: 0 auto`                                                                                                                                                                                                                                                                           |
| `Text`, `Label`, `Heading`, `Code`                                                                | `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `color` (`--card-fg-color` / muted / accent), `text-align`; descendant rules for `& code`, `& a` (color `--card-link-color`, focus ring), `& strong`, `& svg`; the inner `span` handles `text-overflow`                           |
| `Button`                                                                                          | Card-like colors per `mode`/`tone`, `padding`, `border-radius`, `font`, `box-shadow`, `cursor`, `&:disabled`, `&:not(:disabled):hover`, `& [data-ui='Text']`                                                                                                                                                  |
| `TextInput`, `TextArea`, `Select`                                                                 | wrapper `position: relative`; the inner `input`/`textarea`/`select` gets font, color, padding, border via presentation `span`; `--input-*` variables                                                                                                                                                          |
| `Skeleton`, `TextSkeleton`, `LabelSkeleton`                                                       | `background-color`, `border-radius`, `animation`, `width`, `height`                                                                                                                                                                                                                                           |
| `Popover`, `Tooltip`, `Layer`, `Dialog`                                                           | `position`, `z-index`, `pointer-events`, `max-width`; Popover/Tooltip content Card colors                                                                                                                                                                                                                     |
| `Badge`, `KBD`, `Spinner`, `Switch`, `Checkbox`, `Radio`, `Avatar`, `Tab`, `TreeItem`, `MenuItem` | fully self-styled — treat every declaration as an override (`&&`)                                                                                                                                                                                                                                             |

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
`avatar.sizes[n]`, `input.*`, `shadow[n]` — goes through Shape C: a named custom property in the
`.css.ts`, `useTheme_v2()` + an inline `style` object in the wrapper. Keep the same theme key
names in the property names (`--wrapper-space-4`, `--wrapper-radius-2`) so the intent survives. Do
not hardcode scale values: a studio may build its own theme with different `space`, `radius`, or
`font` scales.

Only `@media` conditions get literals, mirrored from the default theme:

| Key         | Default values                         |
| ----------- | -------------------------------------- |
| `media`     | `[360, 600, 900, 1200, 1800, 2400]` px |
| `container` | `[320, 640, 960, 1280, 1600, 1920]` px |

Write them as `'@media screen and (min-width: 600px)': {...}` with a comment such as
`// media[1]`.

### Wrapper contract

A wrapper that replaces an exported styled component must keep call sites working without edits:

- Same export name, same prop names — including transient `$props`, which become regular props
  the wrapper consumes (do not rename them; callers in other directories still pass them).
- `className` and `style` **merge** (`clsx`, spread) — never clobber.
- `ref` flows through props (React 19). No `forwardRef`, no `displayName`.
- `.attrs({...})` values become JSX props on the primitive inside the wrapper; `forwardedAs`
  becomes `as`.
- A prop-driven `css` branch becomes one `css()` per branch plus `clsx(cond && cls)`, the branch
  doubled with `&&` when it overrides the base class (see the cascade model); a prop-driven
  **value** becomes a custom property set inline. Prefer an object of `css()` calls for a closed
  set of values (`root.narrow`, `root.wide`).
- Shared `css` mixins (an `export const focusRingStyles = css` tagged template) become a
  `css.raw({...})` object in a `.css.ts`; importers compose it with `css(mixin, {...})`, which
  merges the objects before emitting the class names.
- A test that asserted a computed style of a migrated component (`toHaveStyle`) cannot pass in
  jsdom anymore (no stylesheet is loaded there). Assert the state through a `data-*` attribute the
  wrapper sets instead; add the attribute if none exists.

### Child and descendant selectors

A nested key with `&` is a selector where `&` stands for the class's own element, in any
position: `'& img'`, `'& > span'`, `'& .third-party-class'`, `'[data-ui="Card"] &'`. In order of
preference:

1. Put a class directly on the child if you render it yourself.
2. `'[data-parent][data-state] &': {...}` on the child class for parent-state-dependent rules,
   keyed on data attributes the parent renders (see the cascade model).
3. `'& img': {...}` on the parent class when you don't control the child (library-rendered DOM) —
   always scoped under a local class.

### Strict property values

`panda.config.ts` sets `strictPropertyValues`, which restricts enumerable properties (`display`,
`position`, `scrollbarWidth`, …) to their CSS keywords and catches typos. A `var()` on such a
property needs Panda's escape hatch, square brackets around the value:
`scrollbarWidth: '[var(--scrollbar-width)]'` emits `scrollbar-width: var(--scrollbar-width)`.

## Step 3: Verify

```bash
pnpm lint:fix                                  # oxfmt + oxlint (includes type checking)
pnpm build && pnpm vitest run --project=sanity <affected test paths>
```

Check `packages/sanity/lib/bundle.css` after the build: every migrated rule must appear there.
The build warns about a `css()` call it could not resolve statically; such a call keeps Panda's
runtime in the bundle and must be rewritten with literal values.

Verify **visual fidelity** in the dev studio (`pnpm dev`, see AGENTS.md for cloud-agent auth):
exercise the migrated component and compare against the pre-migration rendering — theme tones,
spacing, hover/focus states, stacking. Jsdom tests must not assert on Panda class names or
computed styles (no stylesheet is loaded there — see AGENTS.md); assert on `data-testid`. For
high-traffic components, add a Chromatic story per the `sanity-visual-regression` skill so the
migration is sentinel-protected.

## End state

The monorepo's own code no longer imports `styled-components`; `eslint/no-restricted-imports` in
`.oxlintrc.json` bans the module everywhere (the global rule and every override that repeats it).
The dependency itself stays declared because `@sanity/ui@4` requires it as a peer and still
injects its own styles at runtime — which is exactly why the cascade rules above still matter for
every new `.css.ts`. Use this skill for new components and for plugin or example code that still
carries styled-components.

## Checklist

- [ ] `styled-components` import removed from the migrated component; emptied `.styled.tsx`
      modules deleted
- [ ] `.css.ts` colocated; CSS values copied verbatim; component layer preserved where call sites
      need it; `className` merged, not clobbered
- [ ] `&&` used where the original relied on styled-components injection order to beat @sanity/ui,
      and on modifier classes that override a base class on the same element
- [ ] No build config, `package.json`, or exports changes (infra is already wired)
- [ ] `pnpm lint:fix`, `pnpm build`, and affected tests pass; rules present in `lib/bundle.css`
- [ ] Visual fidelity verified against the pre-migration rendering
