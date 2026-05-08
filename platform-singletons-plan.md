# Platform singletons — implementation plan

This plan is derived from `platform-singletons-spec.md`. It outlines the concrete code changes required to add a first‑class `document.singletons` configuration to Studio, the new `S.document().singleton()` / `S.listItem().singleton()` / `S.list().singletons()` Structure Tool helpers, and the supporting auto‑filtering behaviour. It also calls out a number of flaws and ambiguities in the spec that should be resolved before (or during) implementation.

The plan is organised so the work can be sequenced and split across PRs.

---

## 1. High‑level architecture

A singleton "lives" in three places at runtime:

1. **Configuration**: A normalised list of `SingletonDefinition`s, stored on `Source` and reachable by reducers, structure builder, and the document pane.
2. **Document pane / document actions context**: When a document is being viewed _as_ a singleton, the active singleton definition id is exposed via `context.singleton`. This is the hook that powers automatic filtering of `duplicate` (and 3rd‑party customisations).
3. **Structure tool**: Singletons are excluded from the implicit `getDocumentTypeListItems()` default content list, and surfaced via three new `S.…singleton(s)` helpers that read from the resolved singleton registry on `StructureContext`.

The data flow is:

```
sanity.config.ts (document.singletons)
  → configPropertyReducers.singletonsReducer (composable, normalises strings)
  → prepareConfig.tsx → source.document.singletons: SingletonDefinition[]
  → StructureContext.singletons (via Source spread)
      ↳ S.document().singleton(id) / S.listItem().singleton(id) / S.list().singletons(ids)
      ↳ getDocumentTypeListItems(): filters out singletons
  → DocumentPaneProvider builds documentActionsContext.singleton
      ↳ duplicate action removed by built‑in actions resolver
      ↳ newDocumentOptions filtered by built‑in templates resolver
```

---

## 2. Type changes (`packages/sanity/src/core/config/types.ts`)

### 2.1 New types

Add at top of file (near other config types):

```ts
/** @hidden @beta */
export interface SingletonDefinition {
  id: string;
  documentId: string;
  schemaType: string;
}

/** @hidden @beta */
export type UnresolvedSingletonDefinition = SingletonDefinition | string;

/** @hidden @beta */
export type SingletonsResolver = ComposableOption<
  SingletonDefinition[],
  ConfigContext
>;
```

### 2.2 `DocumentPluginOptions`

Add to `DocumentPluginOptions`:

```ts
/** @hidden @beta */
singletons?: UnresolvedSingletonDefinition[] | SingletonsResolver
```

Note: the spec writes this as `singletons:` (required). In practice it must be optional — making it required would be a breaking change to `definePlugin` callers.

### 2.3 Document‑related contexts

Add an optional `singleton?: string` (the singleton **definition id**) to each of:

- `DocumentActionsContext`
- `DocumentBadgesContext`
- `DocumentInspectorContext`
- `DocumentLanguageFilterContext`
- `DocumentCommentsEnabledContext`
- `DocumentAskToEditEnabledContext`

(The spec uses prose to say "for consistency, the singleton property will also be added to the other document‑related configuration contexts". This is the concrete list.)

### 2.4 `Source.document`

Add to the `document` shape on `Source`:

```ts
/** @hidden @beta */
singletons: SingletonDefinition[]
```

This is the **resolved** form; consumers should never see strings here.

---

## 3. Configuration resolution (`packages/sanity/src/core/config/`)

### 3.1 `configPropertyReducers.ts`

Add:

```ts
export const singletonsResolver: ConfigPropertyReducer<
  SingletonDefinition[],
  ConfigContext
> = (prev, { document }, context) => {
  const singletons = document?.singletons;
  if (!singletons) return prev;

  if (typeof singletons === "function") return singletons(prev, context);

  if (Array.isArray(singletons)) {
    return [...prev, ...singletons.map(normaliseSingletonDefinition)];
  }

  throw new Error(
    `Expected \`document.singletons\` to be an array or a function, but received ${getPrintableType(singletons)}`,
  );
};

function normaliseSingletonDefinition(
  def: UnresolvedSingletonDefinition,
): SingletonDefinition {
  if (typeof def === "string")
    return { id: def, documentId: def, schemaType: def };
  return def;
}
```

**Flaw flagged**: the spec types the resolver as `ComposableOption<SingletonDefinition[], …>` (resolved) and the array form as `UnresolvedSingletonDefinition[]`. That is fine, but the reducer must normalise strings **before** calling user resolvers, otherwise composition becomes inconsistent (a downstream resolver would have to handle both shapes). The implementation above normalises eagerly.

### 3.2 `prepareConfig.tsx`

In `resolveSource`:

1. Resolve singletons:

   ```ts
   const singletons = resolveConfigProperty({
     config,
     context,
     initialValue: [],
     propertyName: "document.singletons",
     reducer: singletonsResolver,
   });
   ```

2. Validate (push to `errors` rather than throwing eagerly so multiple issues surface together):
   - Every `schemaType` must exist in `schema` and be of `type === 'document'`.
   - Per the spec, both `id` and `documentId` must be unique across definitions — **hard errors** (see §9.2). For each, aggregate every offending value into a single error message rather than failing on the first.
   - `schemaType` does **not** need to be unique (the spec explicitly allows multiple singletons to share a schema type, and a schema type may also back ordinary documents).

3. Build a fast‑lookup table for downstream consumers:

   ```ts
   const singletonByDocAndType = new Map<string, SingletonDefinition>();
   for (const s of singletons)
     singletonByDocAndType.set(`${s.schemaType}:${s.documentId}`, s);
   ```

   Stash this on the source under `__internal` (it is a derived view, so don't expose it publicly).

4. Inject the singleton id into resolver contexts. For the existing reducers that produce `actions`, `badges`, `inspectors`, `unstable_languageFilter`, `comments.enabled`, `askToEdit.enabled`:
   - Update the `partialContext`/`context` builders to look up the singleton via `(schemaType, documentId)` and merge `singleton: <id>` into the context before invoking the reducer chain. This must use the **published id** (`getPublishedId(documentId)`) so draft/version IDs still match.

5. Expose `source.document.singletons = singletons`.

6. **Built‑in actions filter** — _new_ entry registered at the bottom of the structure tool's `document.actions` resolver, OR (preferable) in core's default actions, so it is impossible for a 3rd‑party plugin to forget it. Implementation: filter actions where `action === 'duplicate'` when `context.singleton` is truthy:

   ```ts
   if (context.singleton) {
     return existingActions.filter((a) => a.action !== "duplicate");
   }
   ```

   The cleanest place is a new built‑in reducer in `prepareConfig.tsx` applied after user reducers but before returning, or as the first plugin layer in `definePlugin('sanity/document-singletons', …)`.

### 3.3 `newDocumentOptions` filtering

Spec text: _"Prevent the document being created by removing it from `document.newDocumentOptions`"_.

Implementation:

- In `resolveNewDocumentOptions` (already in `prepareConfig.tsx`), after the user resolver chain runs, post‑filter `templateResponses` to drop items whose underlying `template.schemaType` matches a singleton's schemaType **and** the template's `initialDocumentId` (or implicit `documentId`) matches the singleton's `documentId`.
- See §10.3 for why filtering by schema type alone is not safe.

The simplest correct rule: drop a template iff there exists a singleton `s` such that:

- `template.schemaType === s.schemaType`
- AND the template would yield a document with id `s.documentId` (or the template is one of the auto‑generated default templates and the schemaType is **only** used by singletons).

If a schema type is used by multiple singletons _and_ has no non‑singleton instances, drop default `from‑schema` templates entirely. Otherwise keep them.

---

## 4. Structure tool changes (`packages/sanity/src/structure/structureBuilder/`)

### 4.1 `StructureContext`

`StructureContext` already extends `Source`. Once `Source.document.singletons` exists, the structure builder gets it for free. Add a thin helper on `StructureContext` for ergonomics:

```ts
// types.ts
export interface StructureContext extends Source {
  // existing…
  /** @internal */
  getSingletonById: (id: string) => SingletonDefinition | undefined;
}
```

Wire it in `createStructureBuilder.ts`:

```ts
const singletonsById = new Map(
  source.document.singletons.map((s) => [s.id, s]),
);
const context: StructureContext = {
  ...source,
  // existing…
  getSingletonById: (id) => singletonsById.get(id),
};
```

### 4.2 `DocumentBuilder.singleton()` (`Document.ts`)

Add:

```ts
singleton(singletonDefinitionId: string): DocumentBuilder {
  const def = this._context.getSingletonById(singletonDefinitionId)
  if (!def) {
    throw new SerializeError(
      `No singleton with id "${singletonDefinitionId}" found. Did you add it to \`document.singletons\`?`,
      [],
      this.spec.id,
    )
  }
  return this.documentId(def.documentId).schemaType(def.schemaType)
}
```

Notes:

- `singleton()` must run **before** any explicit `documentId()`/`schemaType()` overrides are honoured by the developer. Since builders are immutable/clone‑based, the developer can chain `.singleton(id).documentId('override')` and the override wins. Document this explicitly in the JSDoc.
- The serialized `DocumentNode.options` does not currently carry a `singleton` marker. To plumb the singleton id into `DocumentPaneProvider`, store it on `spec.options` as an extra field, e.g. `options.singleton: string`. This requires extending `DocumentNode.options` and `DocumentOptions` in `StructureNodes.ts` / `Document.ts`.

  ```ts
  // StructureNodes.ts
  export interface DocumentNode extends StructureNode {
    // …
    options: {
      id: string;
      type?: string;
      template?: string;
      templateParameters?: { [key: string]: any };
      singleton?: string;
    };
  }
  ```

### 4.3 `ListItemBuilder.singleton()` (`ListItem.ts`)

```ts
singleton(singletonDefinitionId: string): ListItemBuilder {
  const def = this._context.getSingletonById(singletonDefinitionId)
  if (!def) throw new SerializeError(/* … */)
  const schemaType = this._context.schema.get(def.schemaType)
  const title = schemaType?.title ?? startCase(def.schemaType)
  return this
    .id(this.spec.id ?? def.id)
    .title(this.spec.title ?? title)
    .schemaType(def.schemaType)
    .child(this._context.getStructureBuilder().document().singleton(def.id))
}
```

Notes:

- Default title falls back to schema type title; developer can override with `.title(...)`.
- Default icon comes through `schemaType?.icon` like `getDocumentTypeListItem` already does.

### 4.4 `ListBuilder.singletons()` (`List.ts`)

```ts
singletons(singletonDefinitionIds: string[]): ListBuilder {
  const items = singletonDefinitionIds.map((id) =>
    this._context.getStructureBuilder().listItem().singleton(id),
  )
  return this.items([...(this.spec.items ?? []), ...items])
}
```

### 4.5 `StructureBuilder` interface

Update `types.ts` to type the new methods on `DocumentBuilder` / `ListItemBuilder` / `ListBuilder` (the methods are on the builder classes; the `StructureBuilder` interface itself does not need new top‑level entries).

### 4.6 Default structure: filter singletons out

Update `getDocumentTypeListItems` in `documentTypeListItems.ts`:

```ts
export function getDocumentTypeListItems(
  context: StructureContext,
): ListItemBuilder[] {
  const singletonSchemaTypes = new Set(
    context.document.singletons
      // only filter when EVERY occurrence of the schema type is a singleton —
      // see §10.3
      .map((s) => s.schemaType),
  );
  const types = getDocumentTypes(context).filter(
    (t) => !singletonSchemaTypes.has(t),
  );
  return types.map((typeName) => getDocumentTypeListItem(context, typeName));
}
```

**Flaw flagged**: per §10.3, filtering by `schemaType` may be too aggressive. Settle on the rule: a schema type is hidden from the default content list iff **every singleton with that schemaType** plus **every other concrete instance of that type that we know of** is a singleton. Practically, the simplest user‑predictable rule is: _hide a schema type from the default content list iff at least one singleton uses it._ Document the trade‑off and let users opt back in via `S.documentTypeList(typeName)`.

`getDocumentTypeList(context, typeName)` and `S.documentTypeList(typeName)` should NOT be filtered — explicit usage wins. Only the implicit default list is filtered.

---

## 5. Document pane: plumbing `singleton` into action contexts

`packages/sanity/src/structure/panes/document/DocumentPaneProvider.tsx`

`DocumentNode.options.singleton` is consumed here:

```ts
const singletonId =
  // pane‑provided (when via S.document().singleton())
  pane.options?.singleton ??
  // fallback: lookup by (documentId, schemaType)
  source.document.singletons.find(
    (s) =>
      s.documentId === getPublishedId(documentId) &&
      s.schemaType === documentType,
  )?.id;

const documentActionsContext: PartialContext<DocumentActionsContext> = useMemo(
  () => ({
    schemaType: documentType,
    documentId,
    versionType: actionsVersionType,
    releaseId: selectedReleaseId,
    singleton: singletonId,
  }),
  [
    documentType,
    documentId,
    actionsVersionType,
    selectedReleaseId,
    singletonId,
  ],
);
```

The same `singletonId` value is passed into the `documentBadges`, `inspectors`, `comments.enabled`, `askToEdit.enabled`, and `unstable_languageFilter` invocations.

**Rationale for fallback lookup**: A document might be reached through a structure path that did NOT use `S.document().singleton()` (for instance, if a developer manually wires `S.documentTypeList('settings')`, or via deep linking / intent). The fallback ensures `context.singleton` is consistent regardless of how the pane was opened.

---

## 6. Built‑in `duplicate` filtering

Two viable locations:

1. **In `structureTool.ts`**, inside the existing `actions` resolver. Pros: no new plugin layer. Cons: only applies when structure tool is loaded.
2. **In a tiny core plugin** registered by `prepareConfig` (similar to `releases`/`scheduledDrafts`). Pros: applies regardless of structure tool. Cons: more moving parts.

Recommendation: do (1) for v1 (singletons are inherently a Structure Tool concern), and revisit if non‑structure surfaces start needing the same filter.

Implementation in `structureTool.ts`:

```ts
actions: (prevActions, context) => {
  const combinedActions = Array.from(
    new Set([...prevActions, ...documentActions]),
  );
  const filtered = context.singleton
    ? combinedActions.filter((a) => a.action !== "duplicate")
    : combinedActions;
  // existing destructive‑action ordering logic, using `filtered`…
};
```

---

## 7. Tests

New tests should be added alongside existing config / structure builder tests.

### 7.1 Unit tests (Vitest)

- `packages/sanity/src/core/config/__tests__/singletonsResolver.test.ts`
  - String shorthand expands correctly.
  - Function resolver receives normalised `SingletonDefinition[]`.
  - Composability: array + function + array all merge.
  - Invalid input throws.
- `packages/sanity/src/core/config/__tests__/prepareConfigSingletons.test.ts`
  - Schema type missing → config error.
  - Duplicate `id` → config error (the error message lists every offending id, not just the first).
  - Duplicate `documentId` → config error (the error message lists every offending documentId, not just the first).
  - Two singletons sharing a `schemaType` (with distinct `id` and `documentId`) is **valid** and resolves successfully.
  - A `SingletonDefinition` whose `id`, `documentId`, and `schemaType` are all identical is **valid** (this is the case the string shorthand expands to).
  - Resolved singletons are exposed on `source.document.singletons`.
  - `(documentId, schemaType)` lookup returns the singleton id in action contexts.
  - `duplicate` action is removed when `context.singleton` is set.
  - `duplicate` action is preserved when `context.singleton` is not set.
- `packages/sanity/src/structure/structureBuilder/__tests__/Document.singleton.test.ts`
  - Sets `documentId` + `schemaType` from registry.
  - Throws on unknown id.
  - Subsequent `.documentId()` overrides take effect.
  - Serialized `options.singleton` carries the id through to `DocumentNode`.
- `packages/sanity/src/structure/structureBuilder/__tests__/ListItem.singleton.test.ts`
  - Default title from schema type.
  - Default child is a `DocumentNode` for the singleton.
  - Override of title/icon works.
- `packages/sanity/src/structure/structureBuilder/__tests__/List.singletons.test.ts`
  - Composes a list from a list of ids.
  - Combines with previously declared `.items()`.
- `packages/sanity/src/structure/structureBuilder/__tests__/documentTypeListItems.test.ts`
  - Singleton schema types are filtered from `defaults()`.
  - Explicit `S.documentTypeList(typeName)` for a singleton type still works.

### 7.2 dts‑exports

`packages/@repo/test-dts-exports/test/fixtures/sanity.test-d.ts` and `sanity.structure.test-d.ts`: add tests for newly exported `SingletonDefinition`, `UnresolvedSingletonDefinition`, `SingletonsResolver`.

`packages/sanity/test/__snapshots__/exports.test.ts.snap`: regenerate via `pnpm test -- -u`.

### 7.3 Dev studio

Add a `dev/test-studio` example demonstrating the new API:

```ts
document: {
  singletons: ['siteSettings'],
},
structure: (S) => S.list().items([…, S.listItem().singleton('siteSettings')]),
```

This exercises the helpers end‑to‑end and acts as living documentation.

---

## 8. Documentation & LLM skills

- Update `packages/sanity/docs/` (or whichever docs source feeds sanity.io) with a new "Singletons" page.
- Update inline JSDoc on `DocumentPluginOptions.singletons`, `SingletonDefinition`, and the three new builder methods.
- Add a skill under `skills/` that explains the new API and links to the spec, so LLM‑assisted migrations are accurate.

---

## 9. Flaws and open questions in the spec

This section enumerates what I see as gaps, ambiguities, or risks. Each should be confirmed with the spec author before implementation lands.

### 9.1 Type inconsistency between array and resolver forms

The spec types the option as `UnresolvedSingletonDefinition[] | SingletonsResolver`, but `SingletonsResolver` operates on `SingletonDefinition[]` (resolved). This is workable, but only if:

- Strings are normalised to `SingletonDefinition` **before** they enter any user resolver chain, AND
- The published types make clear that user resolvers only ever see resolved definitions.

The plan's `singletonsResolver` (§3.1) handles this. Spec wording should be tightened to say so explicitly.

### 9.2 Uniqueness guarantees (resolved)

The updated spec is now explicit about uniqueness:

- `id` **must be unique** across singleton definitions.
- `documentId` **must be unique** across singleton definitions.
- `schemaType` is _not_ required to be unique — multiple singletons may share a schema type, and a schema type may also back ordinary (non‑singleton) documents.

Within a single `SingletonDefinition`, `id`, `documentId`, and `schemaType` may all be identical — this is exactly the shape the string shorthand (`'settings'`) expands into.

**Implementation**: both uniqueness rules are enforced in `prepareConfig.tsx` (§3.2) as hard errors, accumulated via the existing `errors` array and surfaced together through `ConfigResolutionError`. For each rule, all offending values are aggregated into a single error message rather than failing on the first duplicate, so users can fix everything in one pass.

### 9.3 `newDocumentOptions` filtering by schema type alone is too aggressive

If schema type `S` is used by both a singleton and ordinary documents, blanket‑filtering all `S` templates from `newDocumentOptions` would prevent creating any non‑singleton `S` documents. The spec doesn't address this conflict.

Two possible policies:

- **Strict**: A schema type may be either "singleton" or "non‑singleton", not both. Validate at config time. Simpler, but contradicts the spec's stated flexibility.
- **Lenient**: Keep templates whose schema type is shared with non‑singleton documents, only filtering when the template itself targets the singleton's `documentId` (or when the schema type is _only_ used by singletons).

The lenient option preserves spec intent, at the cost of more complex filter logic. The plan implements the lenient option (§3.3).

The same problem applies to **the implicit default content list filtering** (§4.6). Picking the same lenient rule there is recommended.

### 9.4 `context.singleton` on shared schema types

If two singletons share a schema type, and a document is opened with the published id of one of them, the `(documentId, schemaType)` lookup uniquely identifies the singleton. Good.

But what if a developer uses `S.document().singleton('a')` to open a document that, by `(documentId, schemaType)`, matches **a different** singleton `'b'`? Possible if developer misconfigures. The pane‑provided `singleton` (from `pane.options.singleton`) should win over the lookup result (this is what the plan does in §5), but we should warn in dev mode when they disagree.

### 9.5 Releases / drafts / versions

`getPublishedId(documentId)` must be used everywhere the lookup is performed — otherwise opening a draft or a release version of a singleton would not register as a singleton. The plan accounts for this in §3.2 and §5; the spec is silent on it.

### 9.6 Multiple structure tools

A studio can have multiple structure tools (e.g. `structureTool({name: 'cars'})` and a second instance for another schema slice). The spec does not say whether `document.singletons` is global to the source (yes, it is — config is per source) or per tool. The plan treats them as global; this matches `document.actions`/`document.badges` semantics.

If a developer wants tool‑specific singleton visibility, they can compose structure manually. Worth noting in the docs.

### 9.7 Intent handling

`S.document().singleton(id)` will produce a normal `DocumentNode`. The structure tool's existing `canHandleIntent('edit', {id, type})` should "just work" because the document still has a stable `(documentId, schemaType)` pair. Worth a regression test (§7.1) — opening a singleton via deep link / intent should land on the same pane and apply the singleton context. This is essentially why §5 includes the `(documentId, schemaType)` fallback lookup.

### 9.8 Plugin ordering risk

Built‑in `duplicate` filtering must happen **after** any user/plugin actions resolver, so that user resolvers cannot reintroduce the duplicate action for a singleton. If we put the filter into `structureTool.ts`, we must ensure it runs last; today, `structureTool.actions` runs before user resolvers (it's called as part of `definePlugin` composition). This is a real footgun — recommend implementing the filter as a **terminal** post‑user reducer in `prepareConfig.tsx` (option 2 in §6) rather than inside `structureTool`.

This is the single biggest correctness issue in the proposal as currently written. Action item: confirm the desired layering with the spec author and pick option 2 if "duplicate must not be reintroducible" is the contract.

### 9.9 `S.list().singletons(ids)` is sugar for `.items([...])`

Not a flaw — just worth being explicit in the JSDoc: like the other `S.list()` builders, callers must still set `.id(...)` and `.title(...)` themselves. `singletons()` does not produce a complete list; it is sugar for appending singleton list items to the list's `items` array, equivalent to `S.list().items(ids.map((id) => S.listItem().singleton(id)))`.

### 9.10 Backwards compatibility of `DocumentNode.options`

Adding `singleton?: string` to `DocumentNode.options` is type‑additive and safe. But any third‑party code that does `Object.keys(node.options)` (rare, but possible) will see a new field. Note this in the changelog.

### 9.11 `definePlugin` typing

`DocumentPluginOptions.singletons` becomes part of the plugin contract. We should sanity‑check that plugins which already supply a `document` block continue to type‑check (the field is optional, so they should). Add a type test.

---

## 10. Suggested PR breakdown

1. **Types + reducer + plumbing** (no behaviour change yet). New types, `singletonsResolver`, `source.document.singletons` exposure, validation, dts‑exports updates. Tests for §3.
2. **Structure builder helpers**. `S.document().singleton`, `S.listItem().singleton`, `S.list().singletons`. Tests for §4.
3. **Default structure filtering**. `getDocumentTypeListItems` skips singleton schema types. Tests.
4. **Document pane plumbing + duplicate filter + newDocumentOptions filter**. Tests for §5–§6.
5. **Docs + dev‑studio example + skills**. Non‑code; can run in parallel with 4.

Each PR can pass `pnpm build && pnpm test && pnpm lint` in isolation; the user‑visible "singletons feature" lights up after PR 4.

---

## 11. Risk summary

| Risk                                                                       | Severity | Mitigation                                                            |
| -------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| `duplicate` filter reintroduced by user resolver (§9.8)                    | High     | Apply filter as terminal post‑user reducer in `prepareConfig`.        |
| `newDocumentOptions` over‑filters when schema is shared (§9.3)             | High     | Use lenient policy; doc trade‑off; add explicit test cases.           |
| Pane reached without going through `S.document().singleton()` (§9.4, §9.7) | Medium   | `(documentId, schemaType)` fallback lookup in `DocumentPaneProvider`. |
| Type ergonomics of array vs resolver forms (§9.1)                          | Low      | Normalise eagerly; document expectation.                              |
