---
source: stories/forms/PortableTextObjectsAndToolbar.stories.tsx
title: 'Mention'
blocks: 1
roundtrip: true
sourceHash: 9f820ec10d2601ed
---

<!-- @component -->

Two of the three default object renderers escalate their tone on a validation error, and the third computes the identical booleans and stays silent, so a block-level object failing validation looks exactly like a valid one unless someone opens it.

|          |                                                                                                                                                                                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/PortableText/{object,toolbar,presence-cursors}/*`                                                                                                                                                                                                           |
| Tier     | SERVICE. The chrome around the editor `PortableTextInput.stories.tsx` already mounts at full depth: the embedded-object frames (block, inline, annotation), the two actions popovers riding on top of them, the format/insert toolbar, and the presence cursors that show where a collaborator is |
| Counted  | `object/` 8 exported pieces (11 counting the three `Default*Component` renderers separately) · `toolbar/` 5 · `presence-cursors/` 1                                                                                                                                                               |
| Findings | 3                                                                                                                                                                                                                                                                                                 |

Everything a Portable Text block or inline object is _dressed in_ once it lands in the editor, plus the toolbar above it and the collaborator cursors beside it. `object/modals/*` (edit dialogs) has its own page, `PortableTextEditModals.stories.tsx`; this page picks up everything else in `object/`, `toolbar/` and `presence-cursors/`.

> **Why it matters:** `DefaultAnnotationComponent` and `DefaultInlineObjectComponent` both escalate their tone to `critical`/`caution` on a validation error; `DefaultBlockObjectComponent` computes the identical `hasError`/`hasWarning` booleans and only sets a boolean `data-invalid`/`data-warning` attribute, never a tone. A block-level object failing validation looks exactly like a valid one unless you inspect the DOM or open it; the two lighter-weight object kinds do not share this gap.

### Counted against the brief

`object/` (excluding `modals/`, already storied) has **8 exported pieces**, not the ~10 estimated: `Annotation`, `BlockObject`, `BlockObjectActionsMenu`, `CombinedAnnotationPopover`, `InlineObject`, `InlineObjectToolbarPopover`, `Plugins` (exports `PortableTextEditorPlugins`), `TablePlugin` (exports `PortableTextTablePlugin`). `helpers.ts` exports one pure function (`_getModalOption`), not a component. Counting the three `Default*Component` exports (`DefaultAnnotationComponent`, `DefaultBlockObjectComponent`, `DefaultInlineObjectComponent`) separately from their dispatchers brings the total to 11, which is probably where "about 10" came from.

`toolbar/` has **5 exported components**, not 4: `Toolbar`, `ActionMenu`, `BlockStyleSelect`, `CustomIcon`, `InsertMenu`. (`helpers.tsx`, `hooks.ts`, `useApplicableSchema.ts`, `types.ts` and `index.ts` are not components.) A same-named `InsertMenu.stories.tsx` already exists in this chapter, but it stories a _different_ component, `packages/sanity/src/insert-menu/InsertMenu`, the array-input "Add item" menu, so it does not cover `toolbar/InsertMenu.tsx` at all.

`presence-cursors/` has exactly **1** exported component, `UserPresenceCursor`; that count matched.

### What is already covered elsewhere, and skipped here

`PortableTextInput.stories.tsx` mounts `Annotation` (`AnnotationLink`), `BlockObject` (`BlockObject`, the `Current`/`Recommended` pair), `InlineObject` (`InlineObject`), `Toolbar` (every `PostEditor` render), `BlockStyleSelect` (`BlockStyleMenuOpen`) and `toolbar/InsertMenu` (`InsertMenuOpen`, the deprecation pair) at full depth through the real editor. This page does not repeat those; it covers the pieces that page does not reach on its own: the two actions popovers, the two `Default*Component` renderers as renderers in their own right (not through the dispatcher), `ActionMenu`, `CustomIcon`, presence cursors, and the plugin-registration layer.

### Findings worth a ledger entry

<details><summary><b>Toolbar insert races an in-flight async resolve against the live selection.</b></summary>

`Toolbar.tsx:216-236`: `handleInsertBlock`/`handleInsertInline` `await resolveInitialValue(type)`, which itself can take a visible detour through a "Resolving initial value…" toast past `SLOW_INITIAL_VALUE_LIMIT` (300ms), and only then call `PortableTextEditor.insertBlock`/`insertChild` against the editor's _current_ selection. Nothing re-checks that the selection (or the mounted state of this toolbar) is still what it was when Insert was clicked; a slow resolver plus a moved caret inserts at the wrong place with no signal that this happened.

</details>

<details><summary><b>An unresolvable Portable Text item type is silently dropped, not shown broken.</b></summary>

`formState.ts:1206-1218` gives an array-of-objects item whose `_type` matches nothing in `of` a `kind: "error"` member (`INVALID_ITEM_TYPE`), distinct from the `INCOMPATIBLE_TYPE` case `PortableTextEditModals.stories.tsx` already covers for `ObjectInputMember`. `hooks/usePortableTextMembers.tsx:71` (`usePortableTextMemberItemsFromProps`) then walks `members` with `if (member.kind !== "item") continue`; an error-kind member never becomes a `PortableTextMemberItem`, so `Annotation`/`BlockObject`/`InlineObject` never resolve a `memberItem` for it. Whether the block still renders at all is decided by `@portabletext/editor`’s own schema-driven block dispatch, outside `packages/sanity` and outside what this page can verify without a build (this session ran without one, per instruction); flagged as open rather than asserting a render not seen.

</details>

<details><summary><b>`UserPresenceCursor` has no fallback for a user with no display name.</b></summary>

`@sanity/types`’ `User.displayName` is optional; `presence-cursors/UserPresenceCursor.tsx:112-164` renders `{user.displayName}` directly with no fallback and derives its own `data-testid` from it (`presence-cursor-${user.displayName?.split(" ").join("-")}`), so a user with no display name hovers to an empty label and a `data-testid="presence-cursor-undefined"`. Upstream, `store/presence/presence-store.ts:233-252` already filters out any session whose user profile _fails to resolve_ entirely (`userSessionPairHasUser`), so this is reachable only through a resolved user record that has no name set, not through a broken lookup.

</details>
