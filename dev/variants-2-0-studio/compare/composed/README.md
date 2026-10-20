# Composed compare bar

The Storybook `ComposedAddressBar` (comparison surfaces), ported so the studio can mount it for compare options D, E and F without Storybook.

Source: `sanity-labs/sanity-studio-storybook-variants-2-0`, branch `explorations/variants-2-0`, commit `0c9f1e058e`, `lib/explorations/comparison-surfaces/`.

## Mount it

```tsx
import {ComposedCompareBar} from './compare/composed/ComposedCompareBar'

<ComposedCompareBar
  anchor={{bundle: 'drafts', values: {audience: 'members'}}}
  counterpart={{bundle: 'published', values: {audience: 'members'}}}
  facets={facets}            // {key, values[]}[]  (buildConditionFacets(variants))
  variants={definitions}     // {_id, conditions, metadata?}[]
  bundles={[{id: 'drafts', label: 'Draft'}, {id: 'published', label: 'Published'}, ...releases]}
  onAnchorChange={...}
  onCounterpartChange={...}  // undefined when the comparison is cleared
  layout="tiers"
  maxCompared={1}
  onRefuse={(reason) => toast(reason)}
/>
```

`composedModel.ts` is the pure mapping (`toBar`, `fromBar`, `sideOfAddress`, `addressOfSide`, `variantForValues`, `valuesForVariant`). Check it with `node journeys/verify-composed-model.mts` from `dev/variants-2-0-studio`.

## Files

| File                     | From                    | State                                   |
| ------------------------ | ----------------------- | --------------------------------------- |
| `composedAddress.tsx`    | `composedAddress.tsx`   | Ported, small changes below             |
| `addressAffordance.tsx`  | `addressAffordance.tsx` | Ported, unused code removed             |
| `axisIcons.ts`           | `axisIcons.ts`          | Slimmed                                 |
| `comparisonFixtures.ts`  | `comparisonFixtures.ts` | Slimmed to limits plus a small fallback |
| `csChrome.tsx`           | `csChrome.tsx`          | Slimmed to the studio chrome            |
| `composedModel.ts`       | new                     | Pure address mapping                    |
| `ComposedCompareBar.tsx` | new                     | The adapter                             |

## Changes

Behaviour changes:

1. **`maxCompared` and `onRefuse` (new props on `ComposedAddressBar`).** Every write goes through one guard. A change that would leave more than `maxCompared` keys holding two values is not applied, and `onRefuse('Open beta compares one dimension at a time')` is called (`OPEN_BETA_REFUSAL`). Default is unlimited, which is the Storybook behaviour. The bundle (Draft, Published or a release) is one key, so `bundle` compared plus `audience` compared is two and is refused at `maxCompared={1}`. The menus still offer the second compare action; the refusal is how the reader learns why it did nothing.
2. **`structuralAxes` (new prop).** The bundle axis takes its values from props instead of the fixed `Draft, Published, Q3 launch, Spring campaign`. A new optional `StructuralAxis.versionIds` maps a value to `drafts`, `published` or a release name so the chip draws the real release avatar (`c1/StateMenu` `VersionGlyph`). The Storybook used the first fixture release for every release.
3. **`useCsChrome`, `useRowActionMode`, `chipHeightFor`** return the `studio` chrome as constants. The `classic` chrome and its React context are gone, so no `createContext` is needed there.
4. **`axisIcon('experiment')`** is `RocketIcon` (what `c1/dimensionIcons` uses). The Storybook used a Lucide flask, which the studio does not depend on.
5. **Fixtures.** `richVariants` (about 120 definitions) is replaced by `fallbackVariants` (11 definitions), used only when `variants` is not passed. The bar's logic does not read it otherwise.
6. **`measureRef` effect in `AddDimensionMenu`** measures only while the popover is open (`if (!open || !element) return`). It could not measure a closed popover anyway.

Lint-only changes, same behaviour: default `React` import replaced by named imports, `ChipSurface` takes its icon as a component prop (`Glyph`) instead of an element (static-components), `ComparisonSentence` helpers hoisted to module scope, `planFor` ends in `default`, `instanceof` instead of type assertions, dependency arrays trimmed (`comparedKey`, `controlledRung`), unused variables and the unused `keepLast` and `compared` destructures removed, TSDoc characters escaped, two single-line `react/exhaustive-effect-dependencies` suppressions (the same rule and form the existing studio files use) on effects whose extra dependency is the re-measure trigger, `PILL_RADIUS` is the CSS variable `var(--v2-pill-radius, 999px)` from `options/ShapeStyles.tsx`.

## What the studio cannot do with it

- **It does not read or set the real Studio perspective.** The bar is controlled: it renders `anchor` and `counterpart` and calls back. The caller maps `anchor` to the global perspective and `counterpart` to the Against pane (`compare/address.ts` `localPerspective` and `localVariant`).
- **The left side is not read-only.** Both sides are edited through the same chips; the bar has no read-only mode. The caller can ignore `onAnchorChange` to freeze it.
- **A key on one side only cannot be drawn** (`representable` is false). `toBar` drops it. The studio's address has one variant per side, so this matters only for a composite.
- **A composite has no variant.** `addressOfSide` returns `variant: null` when the values match no single definition. The studio's `Address.variant` cannot hold that; the caller decides (refuse, or show Add dimension disabled).
- **Bundle labels must be unique.** Two releases with the same title collide as values. The caller should make labels unique.
- **`single` mode** still lists the Storybook's four version options. Use `mode="composed"` (the adapter does).
- **Not mounted anywhere.** No existing studio file was edited. It was not run in a browser; it is type-checked, linted and the mapping is checked.
