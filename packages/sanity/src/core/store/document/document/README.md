# Document-scoped store

This folder contains the document-scoped store implementation. Unlike the older
document-pair APIs, these modules start from an explicit `DocumentTarget` and
resolve it to one concrete document id before checkout, edit state, validation,
events, and operations are wired up.

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

- schema remains part of the higher-level document context where the Studio and
  validation need it
- operations receive only the document state and ids required to execute
- publish and unpublish are not blocked solely because a schema type has
  `liveEdit` enabled
