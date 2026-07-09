# Variant Document Editing Plan

This document is the working plan for enabling variant document editing in the Studio through the existing document pair, and for hardening the approach started on this branch (`sapp-3810`). It is written for people who did not follow the original design discussion.

## Context and decision

Three approaches were evaluated for wiring variant documents into the document store:

1. **Resolver id pair** — resolve `IdPair` asynchronously so `publishedId`/`draftId` can be variant version ids (and `undefined` when the documents do not exist). Rejected: it breaks hard invariants across the codebase (`getIdPairFromPublished` throws on version ids, `getPairListener` maps snapshots positionally, `@sanity/id-utils` brands `PublishedId`/`DraftId` as disjoint types, `memoizeKeyGen` omits `draftId`), and it pays much of the "remove the document pair" migration cost without its payoff.
2. **Leverage the version slot** — variant documents ride the existing `IdPair.versionId`, exactly like release versions. Base `publishedId`/`draftId` semantics stay untouched. **This is the chosen approach.**
3. **Remove the document pair** (single-document store, `document-store-document` branch) — the long-term direction, but too large to do now (~4,200 added lines across 82 files at last measure). Work in this plan should remain reusable toward it.

### Constraints

- **Scope ids are opaque.** Variant version ids have the shape `versions.<scopeId>.<groupId>` where `scopeId` is a server-generated hash. The Studio never computes scope ids client-side; they are discovered by lookup (the `_system` fields on version stubs from `useDocumentVersions`).
- **Consequences of opaque ids:**
  - Target resolution is asynchronous (a lookup must complete before we know which document to check out).
  - A missing variant document has no derivable id, so the release-style "create on first edit" flow is impossible for variants. Creation goes through `sanity.action.document.variant.create` (see `documents/createVariantScopedDocument.ts`), then the new stub must arrive before editing can start.

### How option 2 maps onto the pair

When a variant is selected and the target document exists, hooks are called with the variant `scopeId` in the existing `version` parameter (`useEditState(id, type, priority, scopeId)`), so the pair becomes:

| Slot          | Content                                                                      |
| ------------- | ---------------------------------------------------------------------------- |
| `publishedId` | base published id (the group id)                                             |
| `draftId`     | base draft id                                                                |
| `versionId`   | `versions.<scopeId>.<groupId>` — the variant document for the current bundle |

`editState.draft` / `editState.published` therefore keep describing the **base** pair, and `editState.version` / `value` describe what the user is editing. This matches how release versions already behave.

## Failure modes this plan defends against

1. **Silent base editing.** Every window where the variant `scopeId` is unavailable (variant definitions loading, version stubs loading, variant document missing, transitions after create/discard/publish) currently makes hooks fall back to the base pair — a patch issued in such a window writes to the base draft.
2. **Variant publish routed to the base publish action.** `serverOperations/publish.ts` sends `publishedId: idPair.publishedId` — for a variant-over-drafts document this would publish variant content **into the base published document**. This is data corruption, not a broken button.
3. **Scope hashes treated as release ids.** `editState.release` is currently `getVersionFromId(versionId)`; for variants that is an opaque hash that downstream code may match against releases, render, or put in intent URLs.
4. **Wrong publish gating.** The pair holds only the variant document for the _current_ bundle. The variant-over-published sibling (needed for "already published", `ifPublishedRevisionId` locking, and review-changes comparison) is in no pair slot.

## Core design decisions

### 1. Mount gate + target resolution tri-state

Do not mount the document editing subtree until the variant target is fully resolved, so listeners and patches are never wired against the wrong documents.

- **There are two async resolutions, not one.** `getSelectedVariant` returns `undefined` both while variant definitions load and when no variant is selected. While definitions load, `getTargetDocument` matches `!version._system.variant` and resolves to the **base** document even after `useDocumentVersions` settles. The gate must wait for **both** variant-definition resolution (`useAllVariants`) and version-stub resolution (`useDocumentVersions`).
- **Gate off the raw sticky param.** The gate condition derives from `router.stickyParams.variant` (synchronously available), never from `selectedVariant` (ambiguous while loading).
- **Only gate when a variant param is present.** Base and release editing derive ids synchronously today; do not tax them with an extra round trip.
- **Use `loading`, not stub presence.** `useDocumentVersions` emits `{loading: true, versions: []}` while stubs are being fetched; `versions.length` cannot distinguish "none" from "still fetching".
- **Transitions remount.** The variant document can be created, discarded, or moved (release publish → variant-over-published) while the pane is open. Include the resolved target identity in the `DocumentPaneProviderWrapper` key (currently `${documentType}-${options.id}-${selectedPerspectiveName}`) so target changes remount through the same gate instead of falling back in place. This also fixes form state being reused across variant switches today.

### 2. Store-level target guard

Operations must be disabled by the document store itself when a target (release or variant) is selected but its document does not exist.

- **The store cannot detect this on its own for variants.** It only receives the resolved `scopeId`, which is absent exactly when the target is missing. The caller must declare intent: the pair API gains a `target` parameter (see WS2).
- **Disabling is not enough for `patch`.** `serverOperations/patch.ts` has `disabled: () => false` and `useDocumentForm` calls `patch.execute(...)` without checking `disabled`. The guard must make `execute` throw (mirroring `GUARDED` in `operations/helpers.ts`), with the disabled reason as the UI layer on top.
- **Releases can be self-derived.** `idPair.versionId` set + version snapshot `null` + (draft or published exists) means "existing document not in the selected release" — disable mutating operations at store level too (codifies the read-only rule that currently lives only in `useDocumentForm`).
- **Carve-outs to preserve:**
  - New documents (no draft, published, or version snapshots): typing must still create the release version locally (deterministic id). Does not apply to variants.
  - `restore` (history restore into a release) legitimately creates missing versions.

## Workstreams

### WS1 — Target resolution as first-class state, plus the mount gate

Replaces the current pattern of threading `useTargetDocument()` into ~12 files where each call site decides what `undefined` means.

- [x] Discriminate variant-definition loading in the perspective machinery (`perspective/PerspectiveProvider.tsx`, `perspective/types.ts`): `PerspectiveContextValue` exposes `selectedVariantName` (the raw requested variant, available synchronously) and `variantsLoading`.
- [x] Evolve `hooks/useTargetDocument.ts` into `useTargetDocumentState(documentGroupId)` returning a discriminated union (final shape):
  - `{status: 'resolving'}` — a lookup (variant definitions or version stubs) is in flight; never fall back to the base pair.
  - `{status: 'ready', targetDocument, scopeId, variant}` — resolution finished; covers both variant targets and base/release targeting (`targetDocument` undefined only when no variant is selected and the base pair legitimately applies).
  - `{status: 'variant-missing', variant, bundle}` — variant selected, no variant-scoped version for the bundle.
  - `{status: 'variant-definition-document-not-found', requestedVariantName}` — the sticky param names no definition; surfaced as an error banner, never treated as "no variant".
- [x] Mount gate in `structure/panes/document/DocumentPane.tsx` (`DocumentPaneInner`): renders `LoadingPane` while a variant is requested and the target is `resolving`; the target identity (variant name + target document id or status) is appended to the `DocumentPaneProviderWrapper` key so target transitions remount through the gate.
- [x] Resolved state provided through the document pane context (`DocumentPaneProvider.tsx` → `targetDocumentState` on `DocumentPaneContextValue`); in-pane call sites read the context, out-of-pane/prop-driven consumers (`DocumentEventsPane`, `DiscardVersionDialog`, diff components, release-plugin actions in core) call the hook directly. Actions disable while the target is `resolving` instead of silently operating on the base pair.
- [x] `readOnly` derived centrally from target state (`variant-missing`/`variant-definition-document-not-found`/`resolving`-with-variant → read-only) in `DocumentPaneProvider.tsx`, with a belt-and-braces guard inside `useDocumentForm.ts` for consumers outside the gated pane. Side effect: the variant-only `value`/guard branches in `useDocumentForm` now key off `isVariantTarget` instead of a truthy scopeId, so plain release targets keep the release code paths.

### WS2 — Store-level guard and an honest `EditStateFor`

- [ ] Add a `target` parameter (alongside back-compat `version?: string`) to `pair.editState` / `editOperations` / `documentEvents` / `consistencyStatus` in `store/document/document-store.ts` and the hooks (`useEditState`, `useDocumentOperation`, `useConnectionState`, `useSyncState`, `useDocumentSyncState`):
  - `{kind: 'release', releaseId}` | `{kind: 'variant', scopeId, variantId}` | `{kind: 'variant-missing', variantId}`
- [ ] `editOperations.ts` / `operations/helpers.ts`: `variant-missing` → emit an all-disabled `OperationsAPI` with a new reason `TARGET_NOT_FOUND` whose `execute` throws. Independently self-derive the release case inside `createOperationsAPI` (versionId set, version snapshot null, draft/published exists) for `patch`, `publish`, `unpublish`, `discardChanges`, `commit` — excluding `restore` and the new-document flow.
- [ ] `useDocumentForm.ts`: check `patch.disabled` in the `patchRef` assignment path in addition to `readOnly`.
- [ ] `editState.ts`: add `scopeId: string | undefined` to `EditStateFor`; set `release` only for `kind: 'release'` targets (cross-check `versionSnapshot._system` once loaded). Migrate consumers that want the bundle segment (`DocumentStatusLine` → `useSyncState`, `DocumentActionsProvider` release matching, events attribution in `getEditEvents.ts`) from `release` to `scopeId`. Kills the "opaque hash rendered or routed as a release id" bug class, including `PresenceMenuItem` intent params.
- [ ] Tests: adapt the `document-store.test.ts` suite from the resolver WIP commit (`8017c55`) to assert guard emission order and pair-id preparation.

### WS3 — Variant-aware operations (the corruption-critical work)

- [ ] Route by target kind in `serverOperations/publish.ts`, `unpublish.ts`, `delete.ts`, `discardChanges.ts`: variant targets go to `sanity.action.document.variant.publish/unpublish/delete` with `{publishedId, variantId, bundleId}`; `bundleId` via `variants/documents/getBundleIdFromPerspective.ts`; `ifSourceRevisionId` from the version snapshot; `ifPublishedRevisionId` from the sibling stub (WS4). Extend action typings in `variants/store/variantsClient.ts` and `variants/ACTIONS.md` (only definitions + create exist today).
- [ ] Tripwire in the base path: base `publish`/`unpublish` throw (and log telemetry) if `snapshots.version?._system?.variant` is set. Must not rely on upstream routing being correct.
- [ ] Gating from the sibling: `publish.disabled` (`ALREADY_PUBLISHED`, revision lock) and `unpublish.disabled` (`NOT_PUBLISHED`) must read the **variant-over-published** state, which is in no pair slot. Version stubs carry `_id`, `_rev`, `_system` live (`observePaths`); pass the sibling stub through the target param so `operationArgs` exposes it — no second pair listener needed for gating.
- [ ] Decide duplicate semantics for variants (current path would duplicate variant content into a new base draft) — product decision, do not inherit it.
- [ ] Only after the above: remove the `useIsEditingVariantDocument` kill-switch (`DocumentStatusBar.tsx`, `DocumentActionShortcuts.tsx`) and the `DocumentPanelHeader.tsx` "DO NOT MERGE" inventory hack.

### WS4 — Variant publish-state in UI, diffs, history

- [ ] `PublishAction.tsx`, `UnpublishVersionAction.tsx`, `DiscardChangesAction.tsx` dialogs: gate on the sibling stub, not `editState.published`.
- [ ] `hooks/useDocumentIdStack.ts`: when a variant is active, build the stack from stubs matched on `_system.variant` (variant-over-published → variant-over-drafts → variant-over-release) instead of deriving via `getVersionId(editState.id, releaseId)`. Upstream comparison then reuses existing machinery: `useEditState(id, type, 'default', <scopeId of variant-over-published>)` → `selectUpstreamVersion` picks it from the `version` slot. The second pair listener this implies is confined to review-changes/diff contexts.
- [ ] `EventsInspector.tsx` `CompareWithPublishedView`: compare the displayed variant against variant-over-published, not base published.
- [ ] Events/history: verify hash-bundle attribution fails soft in `getEditEvents.ts`; `HistoryRestoreAction` targets the variant version id.

### WS5 — Permissions

- [ ] `store/grants/documentPairPermissions.ts`: accept target kind; for variant targets the `publish`/`unpublish` templates must check grants against the variant ids (sibling stub id), not `getPublishedId(draft._id)` / `getDraftId(published._id)`.
- [ ] Verify the grants engine matches `versions.<hash>.*` paths against real dataset ACLs (manual, dev studio) — do this early; a mismatch could invalidate parts of the design.

### WS6 — Peripheral subsystems

- [ ] Comments: thread `scopeId` through `CommentsWrapper` → `CommentsProvider` (currently `selectedReleaseId` only) so `documentValue`/revision attach to the variant.
- [ ] Presence: `FormView` subscribes on the base `documentId` while the form reports on `value._id`. Decide group-level vs variant-scoped presence; group-level is acceptable short-term, but make it a decision.
- [ ] UI truthfulness: loading gates keyed on `!draft && !published` (`DocumentPanelHeader`, `DocumentPanelSubHeader`, `DocumentHeaderTabs`, `FormView` spinner) must count the version; `hasObsoleteDraft` skips under variant targets; `isNewDocument` / `mustChooseNewDocumentDestination` get per-target semantics; `DocumentStatusLine` fallback timestamps prefer the version under a variant.
- [ ] Presentation (`PostMessageRefreshMutations`) and scheduled publishing (SAPP-3986 / SAPP-3987 TODOs): explicit out-of-scope guards rather than silent base behavior.

## Sequencing

1. **WS1 → WS2** are the safety net and unblock everything; land them first. WS1 is mergeable to `main` behind the variant param being absent (it is inert without a variant selected).
2. **WS3** is the highest-risk item and depends on the backend variant actions (Step 4 of the platform plan). Build the routing + tripwire now against the action spec; keep the kill-switch until the actions exist to test against.
3. **WS4** depends on WS3's sibling plumbing.
4. **WS5 / WS6** are parallelizable after WS1.

Each workstream carries its own unit tests (operation payload tests like the existing `serverOperations/publish.test.ts`, target-state hook tests, `useDocumentIdStack` stacks). The end-to-end flow (create variant from banner → edit → verify base untouched → publish) needs a manual dev-studio pass once WS3 is testable against a dataset with variant actions enabled.

## Immediate fixes on this branch

- [x] `DocumentPaneProviderWrapper` key does not include the variant → form state is reused across variant switches. (Fixed as part of WS1: target identity is part of the key.)
- [x] Anywhere the branch infers loading from stub presence: use `useDocumentVersions().loading`, never `versions.length`. (Fixed as part of WS1: consumers converge on `useTargetDocumentState`, which consumes the loading flags; `DocumentStatusBar` no longer recomputes from stubs.)

## Open decisions

- Duplicate semantics for variant documents (WS3).
- Presence scoping: group-level vs variant-scoped (WS6).
- Whether `variant-missing` read-only state should offer creation inline (current `DocumentNotInVariantBanner` CTA) for release-bundle variants once `sanity.action.document.variant.create` supports release `bundleId`s.
