---
name: vanilla-extract-migration
description: >-
  Patterns and constraints for migrating styled-components to @vanilla-extract/css
  in the Sanity monorepo. Use when creating .css.ts files, converting styled()
  wrappers, handling CSS specificity against @sanity/ui, or styling child elements
  with vanilla-extract.
---

# Vanilla-Extract Migration Guide

## File Naming

All files that call vanilla-extract APIs (`style`, `styleVariants`, `createVar`, `globalStyle`, etc.) **must** use the `.css.ts` extension. A plain `.ts` file causes a runtime error:

> Styles were unable to be assigned to a file.

## Specificity: Overriding @sanity/ui

`@sanity/ui` still uses styled-components. Vanilla-extract classes often lose to styled-components injection order. Use this technique to win:

### Double-class selector (`&&`)

```ts
export const root = style({
  selectors: {
    '&&': {resize: 'vertical'},
  },
})
```

### 3. Runtime theme via CSS variables

Read theme values with `useTheme_v2()` and inject them via `assignInlineVars()`:

```ts
import {createVar, style} from '@vanilla-extract/css'
export const paddingVar = createVar()
export const wrapper = style({
  selectors: {
    '&&': {
      paddingBottom: paddingVar,
    },
  },
})
```

```tsx
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'

const theme = useThemeV2()
<div className={wrapper} style={assignInlineVars({ [paddingVar]: `${theme.sanity.v2.space[4]}px` })} />
```

**Note:** `assignInlineVars` is exported from `@vanilla-extract/dynamic`, not `@vanilla-extract/css`.

## Styling Child / Descendant Elements

`style()` selectors **must target the current element (`&`)**. Selectors like `'&& img'` or `'&& > div'` that target children are **silently ignored**.

The key rule: `&` must be the **target** of the selector. `& ${child}` is invalid (targets child), but `${parent} &` is valid (targets self, scoped under parent).

### 1. Preferred: apply class directly

If you own the child element in JSX, create a separate style and pass it as `className`:

```ts
export const image = style({objectFit: 'scale-down', width: '100%'})
```

```tsx
<img className={image} src={src} />
```

### 2. Parent-scoped selectors: `${parent} &`

When a child style depends on a parent's state (hover, data-attributes, etc.), define both styles and use `${parent} &` on the child:

```ts
// ✅ Valid — & is the target, parent is context
export const parent = style({})
export const child = style({
  selectors: {
    [`${parent} &`]: {opacity: 0},
    [`${parent}:hover &`]: {opacity: 1},
  },
})
```

```ts
// ❌ Invalid — targets child, not &
export const child = style({})
export const parent = style({
  selectors: {
    [`& ${child}`]: {opacity: 0},
  },
})
```

**Note:** `parent` must be defined before `child` for this to work.

### 3. Fallback: `globalStyle()`

When you don't control the child element at all (e.g. rendered by a library component), use `globalStyle`:

```ts
import {globalStyle, style} from '@vanilla-extract/css'

export const root = style({})

globalStyle(`${root} img`, {
  objectFit: 'scale-down',
  width: '100%',
})
```

## Converting a Styled Component

### Before (styled-components)

```tsx
import {Card} from '@sanity/ui'
import {styled} from 'styled-components'

const Root = styled(Card)`
  position: relative;
  min-height: 3.75rem;
`
```

### After (vanilla-extract)

**ComponentName.css.ts:**

```ts
import {style} from '@vanilla-extract/css'

export const root = style({
  selectors: {
    '&&': {
      position: 'relative',
      minHeight: '3.75rem',
    },
  },
})
```

**ComponentName.tsx:**

```tsx
import {Card} from '@sanity/ui'
import {root} from './ComponentName.css'
;<Card className={root} />
```

### Dynamic props that accessed the theme

When the styled component used theme values via interpolation, read the theme at runtime and inject values as CSS custom properties.

**Before (styled-components):**

```tsx
import {getTheme_v2} from '@sanity/ui/theme'
import {styled, css} from 'styled-components'

const Wrapper = styled.div((props) => {
  const {space} = getTheme_v2(props.theme)
  return css`
    margin-bottom: ${space[5] * -1}px;
    padding-bottom: ${space[4]}px;
  `
})
```

**After (vanilla-extract):**

```ts
// ComponentName.css.ts
import {createVar, style} from '@vanilla-extract/css'

export const marginBottomVar = createVar()
export const paddingBottomVar = createVar()

export const wrapper = style({
  marginBottom: marginBottomVar,
  paddingBottom: paddingBottomVar,
})
```

```tsx
// ComponentName.tsx
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {marginBottomVar, paddingBottomVar, wrapper} from './ComponentName.css'

const theme = useThemeV2()
const {space} = getThemeV2(theme)

<div
  className={wrapper}
  style={assignInlineVars({
    [marginBottomVar]: `${space[5] * -1}px`,
    [paddingBottomVar]: `${space[4]}px`,
  })}
/>
```

## Common Gotchas

| Issue                                         | Cause                                | Fix                                                   |
| --------------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| "Styles were unable to be assigned to a file" | File is `.ts` instead of `.css.ts`   | Rename to `.css.ts`                                   |
| `assignInlineVars` not found                  | Imported from `@vanilla-extract/css` | Import from `@vanilla-extract/dynamic`                |
| Child styles silently ignored                 | `'&& img'` inside `style()`          | Direct `className`, `${parent} &`, or `globalStyle()` |
| `@sanity/ui` styles winning                   | Equal specificity, injection order   | Use `&&` or `data-sanity-ui4` attribute selectors     |
| Lint: identifier not in camelCase             | `useTheme_v2`                        | Alias: `useTheme_v2 as useThemeV2`                    |
