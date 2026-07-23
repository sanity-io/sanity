# Standalone table field POC — notes

**What this is:** a Studio object field (`standaloneTableObject`) whose stored value is
plain nested arrays (`rows > row > cells > cell > value[]`) — no Portable Text wrapper —
edited through a _disguised_ Portable Text editor. EDEX-1810; branch `poc/standalone-table-field`.

## Files

- `schema.tsx` — `standaloneTable` document + `standaloneTableObject` type. Shape mirrors
  `customPlugins.tsx`'s containerTable: cell `value[]` holds a deliberately-narrow `block`
  (styles normal/quote, decorators strong/underline, no annotations, bullet list, inlineNote
  inline object) + `image`. The input attaches via `components.input` — plain schema, no new
  vocabulary.
- `helpers.ts` — the pure disguise machinery. `packageTableValue`/`unpackageTableValue`
  (object ⇄ one-block PT value, stable `_key: 'root'`), `scaffoldRows`, `isEmptyTable`,
  `isInsideCellPath`, `isRootedPath`/`rerootPath`/`rerootPatch`/`rerootPatches`.
  **`TABLE_SHAPE`** is the single shape-declaration site (container triplets); scaffold,
  cell-path check, and the input's `defineContainer` binding all derive from it.
  TODO(POC) there: ship version infers triplets from the schema type by convention.
- `helpers.test.ts` — 27 unit tests (vitest): round-trip identity, undefined ⇄ empty,
  key stability, sibling-field preservation, scaffold grid/keys, re-rooting incl. edge cases
  (empty path, foreign root key, root-block self-path → empty path, whole-value set() dropped,
  non-rooted patches dropped with warning, diffMatchPatch/insert extras preserved).
- `StandaloneTableInput.tsx` — the input. EditorProvider + PortableTextEditable + NodePlugin
  (containers from TABLE_SHAPE, minimal CSS-table renders) + BehaviorPlugin (one-block UX
  guards) + EventListenerPlugin (mutation → re-rooted granular form patches) +
  UpdateValuePlugin (external value sync with echo dedup) + FocusBridgePlugin.
- `vitest.config.poc.mts` (in test-studio root) — standalone test config; the repo's root
  vitest config needs `@repo/test-config` which the filtered install doesn't link, and
  `@sanity/types` must resolve via the `monorepo`/`source` condition (its `default` export
  points at unbuilt `lib/`). Run:
  `NODE_OPTIONS="--conditions=monorepo" vitest run --config vitest.config.poc.mts`

## Success criteria

| #   | Criterion                                                                                      | Status                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | Granular patches on real paths (`rows[_key==…].cells[_key==…].value[…]`, no `[0]`/root prefix) | **Unit-tested** (re-rooting + toFormPatch never emit whole-value set; empty-path and non-rooted patches dropped with warning)                                                                                                                                                                                        |
| b   | Toolbar narrowing in cells                                                                     | **Manual** — narrow cell block config is in place; verify in Studio: caret in cell disables everything the cell doesn't declare. NOTE: no toolbar is mounted in the POC input (see chrome delta); narrowing is observable via keyboard shortcuts (e.g. cmd+B works, cmd+I doesn't) or by adding the standard toolbar |
| c   | Image block inside a cell                                                                      | **Schema-ready, manual** — `image` is in the cell's `of`; POC input has no insert menu, so verify via paste/drag or API-level insert                                                                                                                                                                                 |
| d   | Comments/presence at depth                                                                     | **Boundary — see below**                                                                                                                                                                                                                                                                                             |
| e   | 3×3 scaffold on empty + re-scaffold after delete-all                                           | **Unit-tested** (scaffoldRows) + effect logic in input (scaffold guard releases when value becomes non-empty)                                                                                                                                                                                                        |
| f   | Clean stored shape                                                                             | **Unit-tested** (round-trip identity; scaffold patches are setIfMissing(shell) + set(rows) — granular, no wrapper array ever stored)                                                                                                                                                                                 |

## The (d) boundary: depth-addressable, not depth-rendered

The storage design carries (d)'s data model: comments/presence key off document paths, and
every patch this input emits lands on real `….rows[…].cells[…]` paths, so a comment anchored
at a cell path _resolves_. What the POC does **not** deliver is the in-editor UI wiring —
presence cursors, comment range-decorations, the selection-scoped comment button — which live
in Studio's `PortableTextInput` layer, not in the bare `EditorProvider` this POC mounts.
`onPathFocus` currently reports field-level focus only (`[]`), not deep paths.

Escape routes, costed:

1. **Wrap Studio's real `PortableTextInput`** over the synthetic array. It IS publicly
   importable (`sanity` → core → form → inputs, incl. the `BlockEditor` alias), so this is
   POC-testable. Cost: it takes `PortableTextInputProps` (array-member form-state contract),
   so the wrapper must synthesize member state around the object value — the path-rewrite
   risk relocates from the patch stream (1 choke point, solved) to form-store member
   synthesis (N props). Chrome comes for free if the provider context reaches it.
2. **Ship in core** — the input uses Studio's internals directly; the wrapping problem
   dissolves. This is the packaging decision, not a POC decision.

## Chrome delta (honest list)

- `@portabletext/plugin-table` is not a test-studio dependency (and the environment could
  not add deps — see below), so the POC renders containers with minimal CSS-table divs via
  `defineContainer` render props (the `customPlugins.tsx` route). Studio's in-PT table
  chrome (row/col insert/delete controls, cell selection) is `packages/sanity` internal
  (`form/inputs/PortableText/object/Plugins.tsx`) and is not mounted here.
- No toolbar, no insert menus — deliberately out of scope; the applicable-schema gating that
  narrows the toolbar in cells is a toolbar feature, so (b) is only _indirectly_ observable
  in the POC (shortcuts/behaviors honor the narrow schema).

## One-block invariant: two layers

The authoritative guard is re-rooting: a patch produced for any top-level block other than
the synthetic root is not rooted at `{_key:'root'}` and is **dropped** (with a warning), so
the _stored value_ can never gain a sibling block. The `BehaviorPlugin` guards
(`insert.block`/`insert.blocks` swallowed unless the selection is inside a cell) are a UX
layer to stop the _editor's local state_ from transiently diverging (showing a block that is
never stored). The behavior layer is thinner than plugin-one-line's six behaviors (no
`insert.break` interception — in-cell breaks are legitimate here, unlike one-line) and is
best-effort: runtime editor behavior was not exercised in this environment.

## Deviations from the brief

- **Scaffold via form patches, not editor behaviors.** The input scaffolds by emitting
  `setIfMissing` + `set(rows)` on the field when the _value_ is empty, instead of raising
  an editor-level insert on focus. Rationale: the document stays the single source of
  truth, the logic is unit-testable, and delete-all → value empties → effect re-fires →
  re-scaffold falls out naturally. UpdateValuePlugin then pushes the scaffolded value into
  the editor.
- **Patch source is `mutation` events** (`event.patches`), matching StringInputPortableText's
  event wiring. The editor's patch vocabulary observed in types: set/setIfMissing/unset/
  insert/diffMatchPatch; `insert` with `position:'replace'` maps to keyed `set` (single item)
  and is otherwise dropped with a warning.
- **Environment constraints shaped verification**: container memory is hard-capped at 2GiB;
  `pnpm install`/`pnpm add` (any lockfile resolution) OOMs, so no new dependencies; the full
  test-studio typecheck OOM'd the implementation run (tsgo over the monorepo-condition
  source graph), and a *scoped* attempt (tsconfig including only these four files) also
  OOM'd — under the `monorepo` condition, any file importing `sanity` pulls the whole
  source-graph type surface, which does not fit in 2GiB. **Typecheck: environment-blocked.**
  Verification floor for this POC: 27/27 unit tests green + lefthook format/lint (biome,
  0 warnings) on commit. Run `pnpm --filter sanity-test-studio check:types` on a normal
  dev machine before promoting this beyond POC.

## Patch-stream reality (the sizing question, answered)

Re-rooting stayed **one choke point**: the `mutation` event listener. All translation lives
in `rerootPatches` + `toFormPatch` (~60 lines total, pure, tested). Nothing else in the
input consumes or rewrites paths. The disguise never leaked a synthetic path outward in the
reviewed code; the one inbound surface (UpdateValuePlugin) packages rather than rewrites.
