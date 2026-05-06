# Document-scoped store

This folder contains the document-scoped store implementation. Unlike the older
document-pair APIs, these modules start from an explicit `DocumentTarget` and
resolve it to one concrete document id before checkout, edit state, events, and
operations are wired up.

## Why operation args do not include schema

The document-scoped operation layer intentionally does not carry `schema` in
`DocumentOperationArgs`.

In the pair-based operation model, schema was used by some operations to check
`liveEdit` and decide whether the operation should target the draft or published
document. That made sense there because pair operations own the draft/published
choice.

In this implementation, that choice has already happened before an operation is
created. The caller provides a `DocumentTarget`, and the store resolves that
target to the concrete document id the operation should use. Once the operation
receives `documentId`, `target`, `draftId`, and `publishedId`, it no longer
needs schema information to decide where to act.

Live-edit rules are UI affordances, not operation invariants here. For example,
the Studio may still call `publish.execute()` to resolve an obsolete draft for a
live-edit schema type. If a draft or version document exists and the operation is
otherwise valid, the document-scoped operation should be allowed to run.

Keeping schema out of `DocumentOperationArgs` makes this boundary explicit:

- schema remains part of the validation-specific context where validation needs it
- operations receive only the document state and ids required to execute
- publish and unpublish are not blocked solely because a schema type has
  `liveEdit` enabled

## Validation is composed separately

Validation still needs schema and i18n so validation rules can run with the same
context they receive elsewhere in the Studio. That does not mean the core
document facade needs those dependencies.

`createDocumentStoreDocument()` only owns the document-scoped
checkout/edit/operation streams. `createDocumentValidation()` adapts the shared
target resolver and memoized edit state into the public `document.validation(...)`
method by combining:

- validation-only context (`getClient`, reference availability, schema, i18n,
  current user)
- the shared memoized target resolver
- the memoized document edit state lookup

This keeps the main document facade easy to test while preserving the public
`documentStore.document.validation(...)` API.
