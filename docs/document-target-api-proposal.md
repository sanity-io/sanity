# Rethinking `documentPair` for Versions and Variants

## Summary

The current `documentPair` API was designed for a simpler model where a logical document had two concrete states: draft and published. That model worked well because the system could derive both IDs from a single published document ID.

With releases and versions, the model expanded to include an optional version document. This has already introduced fallback logic like `version || draft || published`, plus operation-specific branching for version documents.

With variants, this abstraction becomes harder to sustain. A variant can have its own draft, published document, and versions. In the upcoming model, release and variant membership may no longer be encoded in the document ID. Instead, it may live in `_system`, for example:

```ts
{
  _id: 'versions.kdla.page-1',
  _type: 'page',
  _system: {
    release: {_ref: '_.releases.foo'},
    variant: {_ref: '_.variants.bar'},
  },
}
```

This means the store can no longer reliably infer the correct editable document from `publishedId + version`.

## Problem

Today, `documentStore.pair.*` accepts a published document ID, a type, and an optional version:

```ts
documentStore.pair.editOperations(publishedId, typeName, version)
documentStore.pair.editState(publishedId, typeName, version)
```

Internally this becomes an `IdPair`:

```ts
{
  publishedId,
  draftId,
  versionId?,
}
```

That assumes all related document IDs can be derived mechanically from a base ID. Variants weaken that assumption.

The main problems are:

- The API guesses the target document instead of requiring an explicit target.
- The UI often has to choose between `version`, `draft`, and `published`.
- Initial values are derived from draft/published existence, which does not generalize cleanly to version-only or variant-specific documents.
- Operations contain branching logic for draft, published, live edit, and version behavior.
- Listening to multiple documents becomes less aligned with the UI, where the user is usually interacting with one specific selected document.

## Proposal

Introduce a new document target API that makes the selected document context explicit.

Instead of:

```ts
documentStore.pair.editOperations(publishedDocId, docTypeName, version)
```

move toward a descriptor like:

```ts
documentStore.document.editOperations({
  baseId,
  typeName,
  version,
  variant,
})
```

Where:

- `baseId` is the published ID of the document.
- `version` is either a release document ID, `"drafts"`, or `"published"`.
- `variant` is the variant document ID.

For example, `version` could point to a release document such as `_.releases.r8LxQ9fg6`, and `variant` could point to a variant document such as `_.variant.variantId`.

Preferably, this could start like a two-step model until we get the proper apis from content lake.

```ts
const target = await documentStore.resolveTarget({
  baseId,
  typeName,
  version,
  variant,
})

documentStore.document(target).editOperations()
```

The important distinction is between:

- **Selection descriptor**: what the UI or user selected, such as base ID, version, and variant.
- **Resolved edit target**: the concrete document ID the store should listen to, validate, patch, and use for permissions.

The public descriptor should avoid a separate `state` field. Variants can also have draft and published documents, so a state enum quickly becomes ambiguous or starts growing values like `draft-variant` and `published-variant`. The `version` and `variant` fields describe the selected document context without mixing lifecycle and variant concerns.

This gives us one central place to resolve variant and release membership, including querying `_system` when the ID no longer contains enough information.

## Expected Impact

The largest impact will be around form state and document operations.

`useDocumentForm` currently owns a lot of target-selection behavior: active release resolution, displayed value selection, permission target ID, presence ID, validation ID, read-only rules, and patch target. This is where much of the `version || draft || published` behavior appears.

The operation layer is also affected. Operations currently receive snapshots for draft, published, and optional version, then branch internally. For example, `patch` patches the version document if a version exists, otherwise patches published for live edit, otherwise patches draft.

Initial values need special attention. Today, initial value resolution checks draft and published existence. With variants, the initial value API should probably accept the resolved target and optionally an explicit seed source:

```ts
documentStore.initialValue({
  target,
  templateName,
  templateParams,
  seedFrom,
})
```

This avoids deriving initial content from whichever of version, draft, or published happens to exist.

Other affected areas include:

- `document-store.ts`
- `document-pair/snapshotPair.ts`
- `document-pair/editState.ts`
- `document-pair/operationArgs.ts`
- `document-pair/operationEvents.ts`
- `getPairListener.ts`
- validation and permissions
- presence
- history
- diff views
- document action hooks
- ID utilities such as `getIdPair`, `getVersionId`, and `getVersionFromId`

## Migration Strategy

Do not remove `documentPair` immediately. Instead, introduce the new target-based API beside it.

Recommended phases:

1. Add a `DocumentTarget` or `ResolvedDocumentTarget` model.
2. Add a central resolver that can map `{baseId, state, releaseId, variantId}` to a concrete document ID.
3. Implement new store APIs around resolved targets.
4. Internally adapt the new API to the existing pair machinery where possible.
5. Migrate high-level consumers first: `useDocumentForm`, `useEditState`, `useDocumentOperation`, validation, permissions, and presence.
6. Move fallback logic out of UI components and into target resolution.
7. Deprecate `documentStore.pair.*` once key consumers no longer rely on it.
8. Later, simplify or replace the pair internals when draft/published/version assumptions are no longer needed.

## Recommendation

We should treat `documentPair` as a legacy abstraction for the draft/published era. It can remain as an implementation detail during migration, but the API used by forms, operations, validation, and permissions should become target-based.

The new API should not guess which document the user is editing. It should operate on a resolved document target that includes the concrete document ID and enough metadata to understand its release, variant, and state.

This aligns the store with the UI: the user selects a specific document context, and the system edits exactly that document.
