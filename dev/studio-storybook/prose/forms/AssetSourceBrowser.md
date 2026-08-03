---
source: stories/forms/AssetSourceBrowser.stories.tsx
title: 'Upload'
blocks: 1
roundtrip: true
sourceHash: c7a670cd86a65310
---

<!-- @component -->

A field configured with three source plugins collapses, once read-only, to a single disabled button naming whichever source happens to be first in the array, an accident of declaration order, not a decision anyone made about which source to show.

|          |                                                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/files/common/AssetSourceBrowser.tsx`                                                                                                             |
| Tier     | SERVICE. The source picker for the same asset-service seam `FileInput` and `ImageInput` sit on, factored out so File, Image and Video inputs all choose a source through one component |
| Audit    | 🟡 needs-work (`source-visibility`). Read-only does not just disable the picker, it removes the ability to see that a choice ever existed                                              |
| Patterns | `source-visibility`                                                                                                                                                                    |

Not the asset picker dialog itself, the small control in front of it. Given a list of configured sources, it decides whether to show one plain "Browse" button or a menu of them, and hands the chosen `AssetSource` upward. `FileInput` and `ImageInput` both call it from their empty/upload-placeholder state (`FileAsset.tsx`, `ImageInput.tsx`); once an asset is bound, a different surface (`ActionsMenu`) takes over, so this component only ever appears before something is attached.

**What reading it turned up.**

<details><summary><b>One source collapses correctly.</b></summary>

`assetSources.length > 1 && !readOnly` (:59) is the only way into the menu branch. With one source it is always false, so the plain `Button` (:90-99) wires straight to `handleSelect(assetSources[0])`, one click, no menu to open first. The common case is not the one this component makes worse.

</details>

<details><summary><b>Read-only does not just disable the menu, it deletes the fact that one exists.</b></summary>

The same condition (:59) that gates the menu also gates on `!readOnly`, so a read-only field with four configured sources takes the exact same branch as a field with one: the plain, disabled `Button` (:90-99), labelled and `data-testid`-keyed off `assetSources[0]` alone. A viewer of a read-only field sees one button naming the first configured source and has nothing in the render telling them three more exist.

</details>

<details><summary><b>"No sources" and "every source failed" render identically, because the component cannot tell them apart.</b></summary>

`sourcesFromSchema?.length === 0` (:53-55) and `assetSources.length === 0` (:57) both `return null`, no button, no message, no `Tooltip`. There is no loading state and no error state anywhere in this file; a source that was declared but failed to resolve upstream and a field that never had one configured are the same `null` to this component.

</details>

<details><summary><b>The first `return null` is provably dead code under both real callers.</b></summary>

`StudioFileInput.tsx:40` and `StudioImageInput.tsx:36` both compute `const assetSources = sourcesFromSchema || fileConfig.assetSources`, and an empty array is truthy in JS, so when a schema sets `options.sources: []`, `assetSources` is already `[]` by the time this component runs. The check at :53-55 and the check at :57 catch the same input for either shipped caller; the first only matters for a hand-rolled caller that decouples `assetSources` from `schemaType.options.sources`, which the type permits but neither real caller does.

</details>

<details><summary><b>The `MenuButton`'s own `data-testid` is not stable.</b></summary>

`${dataTestIdPrefix}-select-button-${menuButtonId.replace(/:/g, '-')}` (:72) bakes a React-generated `useId()` value into the string. `menuButtonId` needs to be unique for the button/menu ARIA wiring; as a side effect, this is the one `data-testid` in the file nothing can hardcode. The per-source `MenuItem`s (:81) and the trigger `Button` (:67) do not have this problem, only the `MenuButton` wrapper itself does.

</details>

> **Why it matters:** read-only does not remove the ability to pick a source so much as it removes the ability to see that more than one exists. Three configured plugins shrink, once read-only, to a single disabled button naming whichever source happens to be first in the array.
