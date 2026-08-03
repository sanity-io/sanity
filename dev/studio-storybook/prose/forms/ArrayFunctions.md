---
source: stories/forms/ArrayFunctions.stories.tsx
title: 'Quote'
blocks: 3
roundtrip: true
sourceHash: c055b05252826482
---

<!-- @component -->

Two files answer the same four questions about adding an array item, one for objects and one for primitives, and reading them side by side is the only way to catch where their labels have quietly stopped agreeing with themselves.

|          |                                                                                                                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions.tsx` and `packages/sanity/src/core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesFunctions.tsx`                                              |
| Tier     | CORE. The add/insert control rendered under every array field in the Studio, whether the array holds objects or primitives                                                                                                                         |
| Audit    | 🟡 needs-work (`sibling-drift`). The two files share one control-flow shape (four `if`/early-return branches, in the same order) but their internal labelling has drifted apart in ways a reader comparing only one file at a time would not catch |
| Patterns | `sibling-drift`                                                                                                                                                                                                                                    |

The add-item affordance under an array input, not the list of items, just the control that lets an author put a new one in. `ArrayOfObjectsInput` and `ArrayOfPrimitivesInput` each own a version of it, and the two are read here side by side rather than one at a time.

**What reading both files turned up.**

<details><summary><b>The four branches line up exactly.</b></summary>

`schemaType.options?.disableActions?.includes('add')` returns `null` first (ArrayOfObjectsFunctions.tsx:82-84, ArrayOfPrimitivesFunctions.tsx:44-46); then `readOnly` returns a disabled button under a tooltip (:86-94 / :48-63); then `maxReached` (from the shared `useArrayValidation()`) returns the same shape with a different tooltip (:96-104 / :65-80); then the enabled case renders one button for a single candidate type or a button-plus-menu for more than one. Every branch is in the same order in both files.

</details>

<details><summary><b>The `data-testid` values do not agree with themselves.</b></summary>

Objects is consistent: `add-read-object-button`, `add-max-reached-object-button`, `add-single-object-button`, `add-multiple-object-button`, each name matches the state it marks. Primitives is not: the read-only button carries `add-single-primitive-button` (ArrayOfPrimitivesFunctions.tsx:53), and the single-candidate-type button, the actual "add one item" case, carries `add-multiple--primitive-button` (:86, with a stray double dash). The two labels that should distinguish "read-only" from "one type available" instead say "single" and "multiple", and neither says what it marks. A test written against either string by name would be testing the wrong state.

</details>

<details><summary><b>The multi-type button on the primitives side has no `data-testid` at all.</b></summary>

Objects tags all four of its interactive buttons; primitives tags three of four, the `MenuButton` trigger for two-or-more candidate types (:94-120) is the one left unmarked.

</details>

<details><summary><b>The multi-type menus are not the same component.</b></summary>

Objects opens the real `InsertMenu` (`packages/sanity/src/insert-menu/InsertMenu.tsx`) through `useInsertMenuPopover` (ArrayOfObjectsFunctions.tsx:65-80): schema-configurable search, grouping and a grid/list toggle, shown here via `options.insertMenu.filter: true`. Primitives opens a plain `@sanity/ui` `MenuButton`/`Menu` (ArrayOfPrimitivesFunctions.tsx:94-120) with none of that, plus a reference-icon fallback chain (:101-106) objects does not need at this layer. Not a bug on its own, primitive candidates are rarely many enough to need search, but it means "the insert menu" is two different pieces of UI depending on which array shape asked for one.

</details>

<details><summary><b>Only the objects side logs telemetry on insert.</b></summary>

`handleAddBtnClick` in ArrayOfObjectsFunctions.tsx:42-49 logs `CreatedNewObject` with an `origin` distinguishing the tree-editing dialog from the default add. The primitives equivalent (:31-33) calls `insertItem` directly and logs nothing. Whether that is deliberate (a primitive value is not "an object created") or a gap is not answerable from these two files alone.

</details>

> **Why it matters:** read-only and max reached explain themselves identically on both sides, same disabled button, same tooltip copy. Add-disabled explains nothing on either side; the control simply is not there. That much is consistent. What is not consistent is the layer underneath: two siblings that answer the same four questions the same way on screen are wired to a labelling vocabulary that no longer describes what it is pointing at.

<!-- @story EnabledMultipleTypesObjects -->

`useInsertMenuPopover` (ArrayOfObjectsFunctions.tsx:65-80) opens the real `InsertMenu` (`packages/sanity/src/insert-menu/InsertMenu.tsx`): a search box, optional grouped tabs, and an optional grid/list toggle, all schema-configurable through `schemaType.options.insertMenu`. The search box here comes from `options.insertMenu.filter: true` on `objectsMulti` - the count-based default only shows it past five candidate types, and this schema only declares two.

<!-- @story EnabledMultipleTypesPrimitives -->

No `useInsertMenuPopover` on this side: the trigger opens a plain `@sanity/ui` `MenuButton`/`Menu` (ArrayOfPrimitivesFunctions.tsx:94-120), built with a reference-icon fallback chain (:101-106) the objects side does not carry at this layer. No search, no groups, no view toggle, and - unlike the read-only, max-reached and single-type buttons in the same file - no `data-testid`.
