# Variants 2.0 design studio

A Studio that shows the Variants 2.0 designs working together, one surface per handoff
component (C1 to C8), each with any number of options (A, B, C, ...).

```
pnpm install                              # from the repo root
pnpm --filter sanity-variants-2-0-studio dev   # http://localhost:3350
```

Project `ppsg7ml5`, dataset `variants-2-0` (private): Nordic Books plus every state in `PERMUTATIONS.md`.
Seed or refresh it with `pnpm seed` (needs `sanity login`); inspect with `node seed/verify.mts`.
Override with `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` (`northfold` switches to the Northfold schema).

## How options work

- `options/registry.ts` lists each component and its options. Add an option by adding an entry.
- `OptionSlot` renders whichever option is in force; a missing renderer shows a placeholder.
- The floating control (bottom left) picks the Nth option for every component (A, B, C, ...) or `Final`.
- Per-component overrides are in the same panel. Choices persist in localStorage.

```tsx
<OptionSlot component="c3" options={{a: <PopoverV1 />, b: <FlyoutV2 />}} />
```

Pinned to the Studio revision Storybook uses (`21388ff`), so the real parts match.

## Stock Studio first

The `beta.variants` flag is off, so the Studio is stock (no Variant selector, no Variants tool,
no inventory). Variants 2.0 designs are additions on top of it, mounted through `OptionSlot`.

## Presentation and scheduled drafts

- Presentation previews `SANITY_STUDIO_PREVIEW_ORIGIN` (default `http://localhost:3456`, the Northfold storefront).
  The storefront has no visual-editing or draft mode yet, so this is a plain preview without overlays.
- Scheduled drafts is switched on explicitly in `sanity.config.ts`.
