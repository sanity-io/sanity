# Variants 2.0 design studio

A Studio that shows the Variants 2.0 designs working together, one surface per handoff
component (C1 to C8), each with any number of options (A, B, C, ...).

```
pnpm install                              # from the repo root
pnpm --filter sanity-variants-2-0-studio dev   # http://localhost:3350
```

Project and dataset default to Northfold (`ppsg7ml5` / `northfold`) so the schemas match the
seeded data. Override with `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`.

## How options work

- `options/registry.ts` lists each component and its options. Add an option by adding an entry.
- `OptionSlot` renders whichever option is in force; a missing renderer shows a placeholder.
- The toolbar picks the Nth option for every component (A, B, C, ...) or `Final`.
- The Variants 2.0 tool overrides one component. Choices persist in localStorage.

```tsx
<OptionSlot component="c3" options={{a: <PopoverV1 />, b: <FlyoutV2 />}} />
```

Pinned to the Studio revision Storybook uses (`21388ff`), so the real parts match.
