# Spike R1 — wrap Studio's real `PortableTextInput` — VERDICT

**Question (route 1 from POC-NOTES.md):** what does it cost to mount Studio's
_real_ `PortableTextInput` — not the bare `EditorProvider` the POC uses — over
the standalone table field's synthetic one-block array, so depth-rendered chrome
(presence cursors, comment range-decorations, in-editor block-object editing)
comes from Studio's own machinery?

**Short answer:** the table _chrome_ is reachable and cheaper than POC-NOTES
feared — Studio's PT table plugin exposes an **officially-supported extension
point** for binding to an existing dataset shape, and our `rows/cells/value`
maps onto it 1:1. But the three headline reasons to want route 1 —
**comments UI**, **in-editor block-object editing**, and **granular inbound
patching** — do _not_ come free. Each needs form-store or provider internals a
custom input cannot reach. **This confirms route 2 (ship in core)** for those
features. Route 1 is a legitimate demo of the chrome and a proof that the path
arithmetic is a solved single choke point; it is not the ship vehicle.

> **Verification status.** Findings below are grounded in reading the actual
> prop/context consumption in `PortableTextInput` and its children, per the
> spike's method guidance — _not_ in a running Studio. The 2 GiB container
> cannot run `sanity dev` for this graph, and full typecheck OOMs (same as the
> POC — see POC-NOTES.md). The pure path arithmetic **is** unit-tested (26
> tests, `pathBridge.test.ts`). Everything tagged _(runtime-unverified)_ needs a
> dev machine to confirm. Where a claim is code-verified, the file/function is
> cited.

---

## The enabling discovery POC-NOTES didn't have

POC-NOTES route 1 assumed we'd re-teach the editor our container nesting. We
don't. Studio's `PortableTextInput` mounts `PortableTextEditorPlugins`
(`form/inputs/PortableText/object/Plugins.tsx`), which mounts
`PortableTextTablePlugin` (`object/TablePlugin.tsx`) — a wrapper over
`@portabletext/plugin-table`'s `defineTable({containers})`. That plugin takes
**per-role containers** (`table`/`row`/`cell`), each a `defineContainer(...)`
with a configurable `type` + `arrayField`. Its own docstring
(`PortableTextPluginsProps.plugins.table.containers`, `blockProps.ts`) states the
intent verbatim: _"binding the plugin to your own type and field names (adopting
a table shape that already exists in your dataset)."_ The canonical shape it
documents is `table > rows > row > cells > cell > value` — **identical** to
`TABLE_SHAPE`.

The extension point is reached without touching the real schema: set
`schemaType.components.portableText.plugins` to a component that enables the
table plugin with our containers. `PortableTextEditorPlugins` reads exactly that
path (`Plugins.tsx:108`). So the container machinery the POC hand-built with
`defineContainer` render props is **native** in the real input — we only supply
the type/field bindings (`SyntheticArrayMemberBridge.tsx` → `tableContainers`,
`StandaloneTablePlugins`).

---

## WHAT WORKS

_(chrome that lights up; code-verified consumption, runtime-unverified render)_

- **Text editing inside cells.** The single packaged block validates as a
  block-object member of the synthetic array; the table plugin registers it as a
  descendable container, and cell `value` arrays become editable PT text. The
  cell text config (decorators strong/underline, styles normal/quote, bullet
  list, inlineNote) reaches the editor because the synthetic array's `of` reuses
  the compiled cell-`value` member types (bridge `findCellValueArrayType`).
- **Real table chrome:** row/column insert & delete handles, cell selection,
  the header-row toggle, and per-table trash — all from `PortableTextTablePlugin`
  / `@portabletext/plugin-table/ui`. The POC explicitly could _not_ render these
  (`@portabletext/plugin-table` wasn't reachable from test-studio); route 1 gets
  them by construction. _(The `headerRows` field is declared on the R1 object
  type so the toggle persists.)_
- **Toolbar + decorator/style gating** — the real Compositor toolbar, gated by
  the real member schema types. Criterion (b) becomes _directly_ observable,
  not just shortcut-observable as in the POC.
- **Presence cursors** — `usePresenceCursorDecorations({path})`
  (`presence-cursors/usePresenceCursorDecorations.tsx`) reads the
  `useFormFieldPresence()` context and filters by `path`. Passing the **real
  field path** (which the bridge does), a collaborator's cursor inside the table
  resolves and decorates. _(Caveat under COSTS.)_
- **Range-decoration rendering** — anything handed to the `rangeDecorations`
  prop is reconciled and rendered (`PortableTextInput.tsx:386`). So comment
  highlight decorations _would_ render **if fed** — see the comments blocker for
  why they aren't fed automatically.
- **Outbound patches** — the editor emits patches rooted at the synthetic block
  (`[{_key:'root'}, 'rows', …]`); `rerootPatches` strips that one segment and
  the field receives granular patches on real paths. This is the _same_ solved
  choke point as the POC, reused verbatim, and it also drops any patch not
  rooted at `root` (so no sibling top-level block can ever be stored).
- **Focus** — `focusPath` (field → synthetic) and `onPathFocus` (synthetic →
  field, incl. the trailing `text` span segment) translate in both directions.
  Round-trip identity is unit-tested.

---

## WHAT IT COSTS

_(every prop/context we had to synthesize, with honest fragility)_

1. **A fabricated compiled `ArraySchemaType`** (`useSyntheticArraySchemaType`).
   `PortableTextInput` needs a _compiled_ array schema type —
   `sanitySchemaToPortableTextSchema(schemaType)`, the member-schema-types
   provider, and the editor schema all read it. There is **no public runtime
   factory** that compiles a schema type from a definition. We reuse compiled
   sub-pieces (the cell `value` array's member types; the table object type as a
   block object) and graft them into a hand-built array literal. Its `jsonType`,
   `of`, and `components` are faithful; its `name`, parent `type` chain, and
   object identity are **fabricated** — a `@ts-expect-error` marks the cast.
   This is real fragility: any code that keys off schema identity, walks the
   parent chain, or expects compiler-added fields (`__internal`, resolved
   `initialValue`, validation) will see a stub.

2. **`members: []` — the crux.** `PortableTextInput` derives its interactive
   block model from `props.members` via `usePortableTextMemberItemsFromProps`
   (`hooks/usePortableTextMembers.tsx`). With `[]`, code-verified consequences:
   - **In-editor block-object editing does not open.** Each object block /
     annotation / inline object becomes a member item carrying a `<FormInput>`
     the editor opens on activation. No members → no `FormInput` → clicking an
     image or inlineNote in a cell opens nothing. This is one of the three
     features route 1 was supposed to deliver.
   - **Block-level validation / presence / comment / change flagging is absent**
     (the walker only flags text blocks that appear in `members`).
   - Text editing, table chrome, and presence _cursors_ still work — they don't
     depend on `members`.
     Building the real member tree is the blocker below.

3. **Array-only callbacks stubbed** (`onItemAppend`, `onItemPrepend`,
   `onItemRemove`, `onItemMove`, `onInsert`, `onIndexFocus`,
   `resolveInitialValue`, `resolveUploader`, `onUpload`). The object field never
   provides these. No-ops are _honest_ here — the disguised single-block editor
   shows no array-functions bar, DnD, or upload chrome that would call them —
   but each is a `@ts-expect-error` gap, and any future editor path that reaches
   for one (e.g. a paste that triggers `onInsert`) would hit a no-op silently.

4. **`path`-prop overload** (see blocker 2 below): one prop must serve both
   presence filtering (wants the real field path) and the inbound patch channel
   (wants something that won't feed mismatched patches). We pass the real field
   path — presence wins, the patch channel loses.

---

## WHAT BLOCKS

_(needs form-store/provider internals unreachable from a custom input)_

1. **Inbound granular patch channel is structurally unusable.**
   `PortableTextInput` hardcodes `<PatchesPlugin path={path} />`
   (`PortableTextInput.tsx:429`). `PatchesPlugin` → `usePatches({path})`
   (`usePatches.ts`) subscribes to the **global document** patch channel
   (`useFormBuilder().__internal.patchChannel`), filters patches by
   `startsWith(patch.path, path)`, slices off `path.length`, and sends the
   remainder to the editor as `{type:'patches'}`. Those patches carry **real
   document paths** (`table.rows[…]`) — they _never_ contain the synthetic
   `{_key:'root'}` segment. So there is **no value of `path`** for which the
   sliced patches come out block-rooted and appliable by the editor:
   - Pass the real field path → the editor receives `['rows', …]` patches it
     cannot apply (not block-rooted). Our _own_ emitted edits also loop back
     through this channel as un-appliable noise.
   - Pass a synthetic path → it matches nothing in the document, so the channel
     goes silent, but then presence-cursor filtering (same `path`) also finds
     nothing.
     Correctness is _saved_ by `UpdateValuePlugin` (`PortableTextInput.tsx:431`),
     which is present and re-sends the full packaged `value` on every change — so
     remote edits / undo still sync. But that means **falling back to full-value
     replacement**, forfeiting the granular-patch benefits the real input exists
     to provide: caret/selection stability under concurrent editing, and
     performance on large values. `PatchesPlugin` and `path` are internal to
     `PortableTextInput` — **this cannot be fixed from outside.**

2. **The member tree cannot be synthesized honestly from a custom input.**
   The array-space member tree (blocker for COST #2) requires one of:
   - `createPrepareFormState()` — the store factory that builds these nodes.
     **Not exported** from `sanity` (`store/index.ts` re-exports `useFormState`
     but not `formState.ts`).
   - `useFormState` (which _is_ exported) — but it needs a **compiled synthetic
     `ObjectSchemaType`** as its root, which we cannot produce at runtime (same
     wall as COST #1).
   - A deep recursive re-root of the object's own node tree: rewrite `.path` on
     every `ObjectFormNode` + member, plus `focusPath`, `id`, `level`, to insert
     `{_key:'root'}`. This depends on internal node invariants (path/id
     derivation, `_allMembers`, presence keying) outside the public contract.

3. **Comments UI chrome does not come for free.** The comment range-decorations
   and the floating "add comment" button live in `CommentsPortableTextInput`
   (`core/comments/plugin/input/components/`), a **wrapper** the comments plugin
   installs via form-components middleware **only on fields it recognizes as
   Portable Text inputs**. Our field is an _object_ field, so that wrapper never
   wraps it — the `rangeDecorations` prop stays empty and no comment button
   mounts. The data model still resolves comments at cell paths (the POC already
   established addressability), but the in-editor comment _UI_ would have to be
   re-wired by hand (build decorations from comment docs, mount the button) —
   i.e. **not delivered by route 1.**

---

## RECOMMENDATION

**Route 1 is viable as a chrome demo, and it confirms route 2 for the ship
version.**

What route 1 proved, and what transfers regardless of route:

- The PT **table chrome is native and reachable** via the documented
  `components.portableText.plugins` + `table.containers` extension point. The
  disguise never has to re-implement table UI. _(This is the biggest positive
  update to POC-NOTES.)_
- The **path arithmetic stays a single choke point** in both directions
  (`pathBridge.ts`, 26 tests) — the same conclusion the POC reached for the
  outbound stream, now shown to hold for focus too.

What route 1 **cannot** deliver from a custom input, and why route 2 (ship the
input inside `packages/sanity`, using Studio internals directly) dissolves each:

| Feature                            | Route 1 wall                                                                         | Route 2                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| In-editor block-object editing     | `members` needs `createPrepareFormState` (unexported) or a compiled synthetic schema | import the store factory directly; build the array-space member tree in core    |
| Comments UI (decorations + button) | comments wrapper only recognizes PT-input fields                                     | wire the comments internals directly, or register the field as comment-eligible |
| Granular inbound patching          | `PatchesPlugin`/`path` internal; doc paths lack the synthetic root                   | own the patch subscription; translate paths on the way in as well as out        |
| Faithful array schema type         | no runtime schema compiler                                                           | build/register the type through the schema pipeline                             |

All four walls are the same shape: **the public input-prop contract is a
one-way, array-shaped funnel, and the disguise needs two-way access to the
form-store and provider internals behind it.** Route 2 has that access by
definition. The two things route 1 _did_ solve cheaply — the container binding
and the path translation — are small and port directly into a route-2
implementation.

Recommendation: **do not ship route 1.** Use this spike's `tableContainers`
binding and `pathBridge` in a **route-2** input that lives in core, where member
synthesis, the comments wiring, and the inbound patch translation are reachable.
If a _stopgap_ demo is needed before core work lands, route 1 as built here
gives working table editing + presence cursors today, with block-object editing
and comments explicitly disabled.

---

## Files

- `pathBridge.ts` / `pathBridge.test.ts` — pure field⇄synthetic path
  translation, both directions + round-trip + span-text suffix (26 tests). No
  `sanity` import, so it loads in the POC vitest config.
- `SyntheticArrayMemberBridge.tsx` — `tableContainers`, `StandaloneTablePlugins`
  (the extension-point component), `useSyntheticArraySchemaType` (fabricated
  compiled type, annotated), `synthesizeArrayInputProps` (the `ObjectInputProps`
  → `PortableTextInputProps` adapter incl. the `members: []` boundary).
- `StandaloneTableInputR1.tsx` — the input: scaffold + synthetic schema +
  `<PortableTextInput {...bridged} />`.
- `../schema.tsx` — adds `standaloneTableObjectR1` (input = R1) and a second
  `tableR1` field on the `standaloneTable` document, beside the POC `table`
  field, so both variants mount side by side.

## Run

```
cd dev/test-studio && NODE_OPTIONS="--conditions=monorepo" \
  ../../node_modules/.bin/vitest run --config vitest.config.poc.mts
```

53 tests green (27 POC helpers + 26 R1 path bridge). Typecheck and Studio
runtime are environment-blocked (see verification note at top); run
`pnpm --filter sanity-test-studio check:types` and mount both fields in
`pnpm dev` on a dev machine before promoting.
