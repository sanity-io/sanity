---
source: stories/forms/ArrayMembers.stories.tsx
title: 'Link'
blocks: 1
roundtrip: true
sourceHash: 8163da526b8b5c0c
---

<!-- @component -->

The dispatcher this page documents compiles, is exported, and renders correctly, and nothing in the shipped Studio ever calls it: the array list that actually renders every day reimplements the same check inline and bypasses it entirely.

|          |                                                                                                                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/core/form/members/array/` (`ArrayOfObjectsInputMember.tsx`, `ArrayOfObjectsInputMembers.tsx`, `MemberItemError.tsx`, `IncompatibleItemType.tsx`) and `.../array/items/` (`ArrayOfObjectsItem.tsx`, `ArrayOfPrimitivesItem.tsx`), six files, all exported from `members/index.ts`, none module-local |
| Tier     | CORE. Every item in every array of objects or primitives, in every document, resolves through this machinery                                                                                                                                                                                                             |
| Audit    | 🟡 needs-work (`type-dispatch`, `duplicate-logic`). The dispatcher pair for the object-array side is dead weight in the shipped app, and the one leaf it delegates to for errors has a drifted duplicate on the path that actually ships                                                                                 |
| Patterns | `type-dispatch` · `duplicate-logic`                                                                                                                                                                                                                                                                                      |

Both array member unions are closed to exactly two kinds, `ArrayOfObjectsMember = ArrayOfObjectsItemMember | ArrayItemError` and `ArrayOfPrimitivesMember = ArrayOfPrimitivesItemMember | ArrayItemError` (`store/types/members.ts:14,19`). `ArrayOfObjectsInputMember` switches on `member.kind`: `item` renders `ArrayOfObjectsItem`, `error` renders `MemberItemError`. `ArrayOfObjectsInputMembers` just maps an array of members through that dispatcher. `MemberItemError` in turn switches on `member.error.type`: today that is only ever `INVALID_ITEM_TYPE` (see the second finding below), which renders `IncompatibleItemType`, a popover button showing the incompatible value as JSON. There is no equivalent dispatcher for arrays of primitives; `ArrayOfPrimitivesInput.tsx` has always checked `member.kind` inline itself (`ArrayOfPrimitivesInput.tsx:211-231`) and calls `ArrayOfPrimitivesItem` or its own `ErrorItem` directly.

**What reading it turned up.**

<details><summary><b>`ArrayOfObjectsInputMember` and `ArrayOfObjectsInputMembers` have no caller anywhere in `packages/sanity/src`, other than each other and the `members/index.ts` barrel export.</b></summary>

Grepped both names across the whole package: every hit is one of the two files themselves or the barrel. The real array-of-objects list (`inputs/arrays/ArrayOfObjectsInput/List/VirtualizedArrayList.tsx:260`) renders `ArrayOfObjectsItem` directly for `kind: 'item'` and its own local `ErrorItem` (`List/ErrorItem.tsx`) for `kind: 'error'`, never going through this dispatcher. `components/FormInput.tsx:229-244`, the other place a single array member gets rendered in isolation, used to draw one input at an absolute path, reimplements the identical two-branch `member.kind` check inline and calls `ArrayOfObjectsItem` / `MemberItemError` directly rather than calling `ArrayOfObjectsInputMember`. Contrast the object side: `ObjectInputMember` (this page's sibling) is genuinely live, reached via `ObjectInputMembers` from `inputs/ObjectInput/ObjectInput.tsx`. The array-of-objects dispatcher pair has no such caller. It compiles, it is exported, and (per this page) it renders correctly, it is just never asked to.

</details>

<details><summary><b>`MemberItemError`'s own `error.type` dispatch is narrower than it looks, and unlike the array side's dead branch, its dead branch is not silent.</b></summary>

`ArrayItemError.error` (`store/types/memberErrors.ts:141-146`) is typed as exactly `InvalidItemTypeError`, not a union, so the `else` in `MemberItemError.tsx:10-13` (`t('inputs.array.error.unexpected-error', ...)`) is unreachable by the type system today, the same way `ArrayOfObjectsInputMember`'s own fallback is. But if it were ever reached, a future error type added to the union without a matching branch here, it prints visible text, not nothing. Across everything on this page, the only place a real or forced failure renders as nothing at all is `ArrayOfObjectsInputMember`'s own fifth branch (see `Unhandled`, the first finding's dead code), never `MemberItemError`.

</details>

<details><summary><b>`IncompatibleItemType` (this directory) is a near-duplicate of `inputs/arrays/ArrayOfObjectsInput/List/IncompatibleItemType.tsx`, the copy actually reached by the shipped list and by `ArrayOfPrimitivesInput`'s `ErrorItem`, and the two have drifted.</b></summary>

This copy's popover repeats the trigger button's own "type is incompatible" line as the first paragraph inside the popover itself, before the title; the `List/` copy opens straight with the title, no repeated prompt. Since this copy is reached only through `MemberItemError` (the finding above), which in turn is reached only through `FormInput.tsx`'s path-scoped render (the first finding), the drift is real content, in the one place this copy is ever seen, not a difference nobody encounters.

</details>

<details><summary><b>`ArrayOfObjectsItem` is the one dispatch target with a foot in both worlds; `ArrayOfPrimitivesItem` has exactly one caller and no dispatcher layer ever grew up around it.</b></summary>

It is called by the dead dispatcher (the first finding above), by the live `VirtualizedArrayList.tsx:260`, and by `FormInput.tsx:234`. `ArrayOfPrimitivesItem` has exactly one caller, `ArrayOfPrimitivesInput.tsx`: the primitives side never got an `ArrayOfObjectsInputMember` equivalent, so it never accumulated an unused middle layer either.

</details>

**Answering the brief's questions directly.**

- Every declared member kind: handled, or silently dropped? Both unions are closed to exactly two kinds (`item`, `error`) and `ArrayOfObjectsInputMember` handles both. Nothing is silently dropped for a kind either union actually declares.
- An array item whose type was removed from the schema: what renders? `getItemType`/`getPrimitiveItemType` (`store/utils/getItemType.ts`) fail to match the item's resolved type name against the array's current `of` list, so the resolver hands back `kind: 'error'`, `error.type: 'INVALID_ITEM_TYPE'` (`store/formState.ts:1206-1219` for objects, `:1303-1315` for primitives), the IncompatibleItemType popover button, JSON value and all. See `ObjectErrorKind` / `PrimitiveErrorKind` below, both driven by a real document with a stale `_type`, not a fabricated error object.
- Is a failed-validation item distinguishable from one still resolving? Not by anything in this directory. `ArrayOfObjectsItemMember` / `ArrayOfPrimitivesItemMember` (`store/types/members.ts:24,45`) carry no pending/loading field at all; `ArrayOfObjectsItem` / `ArrayOfPrimitivesItem` forward whatever `validation` markers happen to be attached to the item, verbatim, to whatever renders it. Structural resolution (`item` vs `error`) is synchronous; `validateDocument` is async and runs separately, at the document level. A freshly-resolved item with validation not yet computed and a genuinely valid item are the same shape here: there is no still-checking state distinct from no-errors-found-yet.
- Is there anywhere a failure renders as nothing at all? Yes, exactly one place, and it takes forcing: `ArrayOfObjectsInputMember`'s fifth branch (the first finding's dead code, `//@ts-expect-error` and all), see `Unhandled`. Every reachable state, including the one real error kind, renders something visible.

> **Why it matters:** a dispatcher can compile, export cleanly, and render every state correctly, and still be dead code if nothing in the shipped app calls it. The real array list bypasses this one and reimplements its two-branch check by hand, so the two copies are already free to drift, and one leaf they both eventually reach, the incompatible-type popover, already has.
