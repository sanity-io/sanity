# Variants Tool Architecture

This document describes the current architecture of the Variants Studio tool, what functionality is already covered, and the main work that is still pending.

For how variant _document editing_ works through the document pair (target resolution, store guards, operation routing, publish-state UI), see [`EDITING.md`](./EDITING.md). For the underlying plan and per-workstream checklists, see [`EDITING_PLAN.md`](./EDITING_PLAN.md). For the user-facing guide (what variants are and how editors work with them), see [`USER_GUIDE.md`](./USER_GUIDE.md).

## Scope

The Variants tool is registered by `plugin/index.tsx` under the `sanity/variants` plugin name and is gated by `beta.variants.enabled`. The tool route is `/variants`, with detail pages mounted at `/variants/:variantId`.

Variant definitions are stored as system documents:

- Document type: `system.variant`
- ID path: `_.variants.*`
- Type shape: `SystemVariant` in `types.ts`

`_.variants.*` is the definitive system path for variant definition document IDs. Code should reference `VARIANT_DOCUMENTS_PATH` rather than hardcoding the literal so the path stays defined in a single place.

## Data Model

A variant document currently contains:

- `_id` and `_type`
- `conditions: Record<string, string>`
- `priority`, defaulting to `0`
- optional `metadata`, currently used for `title` and Portable Text `description`

`conditions` is persisted as an object because that is the shape expected by the document. The UI does not edit that object directly. It keeps condition rows locally while the user is typing so duplicate keys, incomplete rows, and partial key edits do not collapse or lose values.

## Store And Operations

Read state lives in `store/createVariantsStore.ts`.

- The store is lazily initialized on first subscription.
- It uses `listenQuery` to fetch and keep all variants fresh.
- The state is shared through `useVariantsStore` and consumed by `useAllVariants`.
- The query filters by `VARIANT_DOCUMENT_TYPE` and `VARIANT_DOCUMENTS_PATH`.

Write operations live in `store/createVariantOperationsStore.ts` and go through the actions API (see `ACTIONS.md`).

- `createVariant` issues a `sanity.action.variant.definition.create` action.
- `updateVariant` issues a `sanity.action.variant.definition.edit` action that sets `conditions`, `priority`, and optional `metadata` (unsetting `metadata` when absent).
- `deleteVariant` issues a `sanity.action.variant.definition.delete` action.

The action payloads are typed locally through the temporary `SanityClientWithVariantsActions` wrapper in `store/variantsClient.ts`. That wrapper exists only until `@sanity/client` exports these variant definition action types.

## Routing

`tool/VariantsTool.tsx` switches between overview and detail based on `router.state.variantId`.

Route helpers live in `tool/util.ts`:

- `getVariantId` strips the document path for readable URLs.
- `decodeVariantIdFromRoute` turns a short URL segment back into the full document ID.

The overview links to short URLs such as `/variants/loyal-customers`, not full IDs such as `/variants/_.variants.loyal-customers`.

## Overview Page

`tool/overview/VariantsOverview.tsx` renders the main variants table.

Covered behavior:

- Loading, error, and empty states.
- Search by title, ID suffix, condition keys, and condition values.
- Table rows that navigate to the detail route.
- Create variant button.
- Row actions menu with `Delete variant`.

The table uses the shared releases table component so the row layout, sorting, and virtualization match other Studio tooling.

## Create And Edit Dialogs

Create and edit share the same dialog shell and form:

- `components/dialog/VariantDialog.tsx` owns submit state, validation display, save button state, and error toasts.
- `CreateVariantDialog.tsx` provides default variant values and calls `createVariant`.
- `EditVariantDialog.tsx` converts an existing `SystemVariant` into `EditableSystemVariant` and calls `updateVariant`.
- `VariantForm.tsx` owns title, description, and condition row editing.

The detail page intentionally uses a read-only summary plus an edit dialog instead of inline editing. Inline title/description editing was considered, but the dialog approach is simpler while the feature is still evolving and lets create/edit share the same validation behavior.

## Condition Row UX

`VariantForm` keeps an array of condition rows:

```ts
interface ConditionRow {
  id: string
  key: string
  value: string
}
```

This row state is an important part of the form architecture. Persisting conditions as an object is fine after validation, but object keys are awkward while editing:

- duplicate keys collapse in an object
- incomplete rows cannot be represented safely
- partial key edits can move or lose values

The form only serializes rows back to `variant.conditions` when every row has both a key and value and there are no duplicate keys.

Covered behavior:

- title is required
- at least one complete condition is required
- add-condition is disabled until the current row is complete
- duplicate keys show an inline error
- the remove button is disabled for a single empty row
- partial key editing remains safe

## Condition Autocomplete

Condition key/value autocomplete is intentionally data-driven. We do not maintain a separate list of allowed keys or values.

`components/dialog/conditionSuggestions.ts` derives suggestions from existing variants:

- key suggestions are the unique keys already used in other variant conditions
- value suggestions are scoped to the selected key
- values for unrelated keys are not suggested
- suggestions are filtered case-insensitively
- free-text keys and values are still allowed

`ConditionAutocompleteInput.tsx` wraps `@sanity/ui` `Autocomplete`.

Important behavior:

- selecting a suggestion is handled through `onChange`
- free-text typing is handled through `onQueryChange`
- `onQueryChange(null)` means the autocomplete query closed and should not clear the row
- while the input is focused, the wrapper avoids forcing the current row value back into `Autocomplete.value`, because doing so closes the suggestion popover while typing

The autocomplete is a consistency aid, not a schema constraint. Users can still introduce new condition patterns when needed.

## Detail Page

`tool/detail/VariantDetail.tsx` renders the current detail surface.

Covered behavior:

- loading and not-found states
- back navigation
- read-only title, description, and condition summary
- edit dialog
- documents table wired to display variant documents
- footer with creation status and a detail-specific actions menu

The detail actions menu is separate from the overview row menu. This is intentional because the two menus are expected to diverge as the detail page gains more actions.

## Documents Table

`tool/detail/VariantDocumentsTable.tsx` lists documents that belong to a variant.

Data flow:

- `useVariantDocuments(variantId)` fetches a flat list of variant-scoped document versions.
- `groupVariantDocumentsByGroup()` optionally groups that flat list into one row per document group
- the table renders bundle chips, type, preview, and edited columns using the shared releases table component

To revert to one row per document version, pass the flat `useVariantDocuments()` results directly to the table and switch `rowId` from `groupId` to `document._id`.

## Footer

`VariantDetailFooter.tsx` mirrors the release detail footer pattern.

Covered behavior:

- created status on the left
- right-side action slot
- detail-specific menu button
- delete action navigates back to the overview after success

The delete action currently does not confirm or check whether the variant has documents.

## Test Coverage

Focused unit/integration coverage lives under `packages/sanity/src/core/variants`.

Covered areas include:

- variants store query/listen behavior
- create/update/delete operations
- ID generation
- invalid variant detection
- overview table behavior and routing
- create/edit dialog validation and submit behavior
- condition row validation and partial-edit regressions
- condition suggestion helpers
- detail page rendering, edit dialog, footer, and detail delete menu

Focused command:

```sh
pnpm vitest run --project=sanity packages/sanity/src/core/variants/
```

E2E coverage lives in `e2e/tests/variants/variantTool.spec.ts`.

Covered areas include:

- happy-path create flow
- required title and complete condition validation
- duplicate condition keys
- partial key editing
- autocomplete suggestions from existing variants
- delete flow from the overview
- cleanup by title prefix

Useful e2e type check:

```sh
pnpm exec tsgo --project e2e/tsconfig.json --noEmit
```

The focused browser e2e command is:

```sh
pnpm test:e2e -- --project=chromium e2e/tests/variants/variantTool.spec.ts
```

Local browser execution has previously hit `EMFILE: too many open files, watch` before launching the browser. The spec has been authored and typechecked, but should be run in an environment without that watcher limit.

## Pending Work

- Drop the local `SanityClientWithVariantsActions` typing wrapper once `@sanity/client` exports the variant definition action types.
- Decide how document counts affect deleting variants.
- Add a delete confirmation or disabled state once variants can have documents.
- Expand the detail-specific actions menu independently from the overview row menu.
- Reassess whether inline detail editing is needed after the dialog-based edit flow has been used.
