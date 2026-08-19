---
name: sanity-i18n-translate
description: Use the <Translate> i18n component correctly, especially its components map and componentProps. Use when rendering locale strings that contain markup or embedded components, when adding or reviewing <Translate> usages, or when the @repo/i18n/no-inline-translate-components lint rule fires.
---

# Sanity i18n Translate

## Start Here

`<Translate>` (from `packages/sanity/src/core/i18n/Translate.tsx`) renders locale resources that
contain markup, eg `'Search for "<Red>{{keyword}}</Red>"'`. The `components` prop maps tag names
in the locale string to React components or intrinsic HTML tag names.

Prefer the plain `t()` function when the message has no markup — `<Translate>` is more expensive
to render.

## Law: never define `components` inline

Components in the `components` map MUST be stable, module-scope components. Never define them
inline during render — each render then creates a new component identity, so React unmounts and
remounts the subtree (losing state, DOM, and focus). This is the same class of bug as
`react/no-unstable-nested-components`, and it is enforced for `<Translate>` by the in-repo oxlint
rule `@repo/i18n/no-inline-translate-components` (implemented in
`lint/oxlint-plugin-repo-i18n.mjs`, wired via `jsPlugins` in `.oxlintrc.json`).

The rule only sees object literals written directly in the JSX attribute. Maps built during
render some other way (`useMemo`, `useCallback`, factory calls) are just as wrong — hoist those
too, even though the rule cannot flag them.

```tsx
// ❌ Wrong - new component identity every render (and fails the lint rule)
;<Translate t={t} i18nKey="key" components={{Badge: ({children}) => <strong>{children}</strong>}} />

// ❌ Wrong - useMemo does not fix the identity problem across dependency changes
const components = useMemo(() => ({Badge: ({children}) => <b>{children}</b>}), [])
```

## How to fix each shape

**Plain HTML wrapper** — map to the intrinsic tag name as a string. Strings never receive
`componentProps`, so no stray DOM attributes:

```tsx
<Translate t={t} i18nKey="key" components={{Code: 'code', Emphasis: 'em'}} />
```

**Static markup** (fixed link, styled wrapper) — hoist a module-scope component:

```tsx
function DocsLink({children}: {children?: ReactNode}) {
  return <a href="https://www.sanity.io/docs">{children}</a>
}

;<Translate t={t} i18nKey="key" components={{DocsLink}} />
```

**Component that needs data from render** — hoist it and pass the data through `componentProps`.
The object is forwarded to every non-string component in the map (including exotic ones like
`memo` components), so declare only the props each component reads:

```tsx
function VersionBadge({children, tone}: {children?: ReactNode; tone?: BadgeTone}) {
  return <VersionInlineBadge $tone={tone}>{children}</VersionInlineBadge>
}

;<Translate
  t={t}
  i18nKey="key"
  components={{VersionBadge}}
  componentProps={{tone: getReleaseTone(release)}}
/>
```

## Gotchas

- `componentProps` drives the generic: literal values widen (`{tone: 'caution'}` infers
  `{tone: string}`). Use `as const` on literals that must stay narrow:
  `componentProps={{tone: 'caution' as const}}`.
- `TComponentProps` is constrained to `object` - primitives and `null` are compile errors.
- Components receive `children` only for wrapping tags (`<X>...</X>`); self-closing tags
  (`<X/>`) render the component without children. Declare `children` optional.
- Unmapped lowercase tags only render when listed in `RECOGNIZED_HTML_TAGS` in `Translate.tsx`;
  anything else falls back to interpolated plain text with a console warning.
- Do not call component factories (eg `getVersionInlineBadge`) inside the hoisted component
  either - that recreates the render-time identity problem one level down, and the React
  Compiler lint flags it. Render the underlying component with a prop instead.

## Reference implementations

- `packages/sanity/src/core/releases/tool/detail/ReleaseActivityListItem.tsx` - componentProps
  passing an event object.
- `packages/@sanity/vision/src/components/VisionGuiResult.tsx` - componentProps passing data to a
  self-closing component pair.
- `packages/sanity/src/core/studio/components/navbar/search/components/common/FilterLabel.tsx` -
  several components sharing one componentProps object.
- `packages/sanity/src/core/i18n/__tests__/Translate.test.tsx` - behavior coverage, including
  memo components and non-forwarding to intrinsic tags.
