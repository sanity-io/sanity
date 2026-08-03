---
source: stories/status/ChangeResolver.stories.tsx
title: 'Internal notes'
blocks: 1
roundtrip: true
sourceHash: 4ee75b4902a2289a
---

<!-- @component -->

Every entry in Review Changes passes through this dispatcher before anything decides how to draw it, so a dispatcher this central inherits every gap of everything beneath it. One of those gaps is live: a documented, ordinary visibility pattern silently breaks the moment a field reaches this component.

|          |                                                                                                                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/field/diff/components/ChangeResolver.tsx`                                                                                                                                                                                |
| Tier     | CORE. `ChangeList` and `GroupChange` are its only two callers, and both feed it real, resolved `ChangeNode`s off the same builder                                                                                                                  |
| Audit    | 🔴 needs-work (`error-recovery`, `type-dispatch`). A real conditional-property capability is silently dropped for every change in this subsystem, and the "unknown change type" branch cannot be reached by the pipeline that is its only supplier |
| Patterns | `error-recovery` · `type-dispatch`                                                                                                                                                                                                                 |

Not a change renderer itself. Given one `ChangeNode`, it decides whether the visibility conditions hide it, then routes what survives to `FieldChange` (a leaf change) or `GroupChange` (a nested set of changes).

Four returns, quoted from the file:

```tsx
if (isHidden) return null

if (change.type === 'field') {
  return (
    <FieldChange change={change} readOnly={isReadOnly} addParentWrapper={props.addParentWrapper} />
  )
}

if (change.type === 'group') {
  return (
    <GroupChange
      change={change}
      data-testid={`group-change-${change.fieldsetName}`}
      readOnly={isReadOnly}
    />
  )
}

return (
  <Text>
    Unknown change type: <code>{(change as any).type || 'undefined'}</code>
  </Text>
)
```

Every story below is built from real documents through `buildObjectChangeList` (the exact function `ChangeList` calls), so the `ChangeNode` handed to `ChangeResolver` in each one is the real product of a real diff, never a hand-built literal.

**What reading it turned up.**

<details>
<summary><b>`parent` is never supplied to either conditional-property check, and this is a real, live gap, not a theoretical one.</b></summary>

Both `useConditionalProperty` calls (lines 24-40) carry the identical unresolved comment `// @todo: is parent missing here?`, and checking the hook they call confirms the comment is right: `ConditionalPropertyProps.parent` (`field/conditional-property/useConditionalProperty.tsx:11`) is a real, threaded-through option, and the _form_'s own resolver for the exact same `hidden`/`readOnly` mechanism, `resolveCallbackState` in `form/store/conditional-property/createCallbackResolver.ts:14-40`, declares `parent: unknown` as a **required** field and passes a real parent object down the tree on every call. So a `hidden: (context) => context.parent?.someField === "x"` callback (a documented, ordinary pattern: hide a field based on a sibling) resolves correctly while editing and resolves against `parent: undefined` the moment the same field shows up in Review Changes. Two identical `@todo`s left in place is the author's own record that this was noticed and not fixed.

</details>

<details>
<summary><b>The "unknown change type" fallback cannot be reached by the pipeline that is its only supplier.</b></summary>

`ChangeNode` is a closed union of exactly two members, `type ChangeNode = GroupChangeNode | FieldChangeNode` (`field/types.ts:262`), and the only place in the codebase that constructs one is `changes/buildChangeList.ts`, which literally writes `type: 'field'` or `type: 'group'` at its five call sites and nothing else. `ChangeResolver` has exactly two callers (`ChangeList`, `GroupChange`), and both only ever pass nodes from that builder. The fallback needs `(change as any).type` to compile for a reason: after the two `if (change.type === ...)` guards both return, TypeScript has already narrowed `change` to `never`, the cast is not defensive style, it is required, and its presence is the source admitting the branch is unreachable through its own type system. Same shape as the `return null` at the bottom of `MemberField` (forms subsystem): an exhaustive-looking dispatcher with one extra branch nothing can hand it.

</details>

<details>
<summary><b>Trace: how a change actually reaches `JsonFieldDiff`.</b></summary>

This is narrower than "any type with no diff component." That broader case, a _schema-declared_ field whose type has no registered diff renderer anywhere in its type chain, is `FallbackDiff`'s job (`FieldChange.tsx:66`: `change.diffComponent || FallbackDiff`), and it draws a generic before/after using the type's own preview, not raw JSON. `JsonFieldDiff` is reached by exactly one path: `buildObjectChangeList` also asks `getSortedUnknownChangedObjectFieldNames` (`changes/unknownObjectDiffFields.ts`) which fields **present in the diffed document data** are **not declared anywhere on the running schema type** (skipping only `_type`/`_key`/`_rev`/`_createdAt`/`_updatedAt`/`_system`). Each one becomes a `FieldChangeNode` typed `UNKNOWN_DOCUMENT_FIELD_SCHEMA_TYPE`, which hard-codes `components: {diff: JsonFieldDiff}` (`changes/unknownDocumentFieldSchema.ts`), so by the time `ChangeResolver` sees it, the routing decision was already made at build time, not by `ChangeResolver` or `FieldChange` inspecting anything live. In practice this fires for exactly the situation the JsonFieldDiff page names: a field that used to be in the schema and was removed, still present in older document revisions being compared. The `RoutedToJsonFieldDiff` story below reaches it with a real diff of an undeclared `legacyRating` field, nothing fabricated.

</details>

> **Why it matters:** the `parent` omission is the one worth fixing, since it silently breaks a documented, ordinary conditional-property pattern for one surface only, and nothing in the UI would tell a reviewer why a field is visible in the form and invisible, or the reverse, in Review Changes.
