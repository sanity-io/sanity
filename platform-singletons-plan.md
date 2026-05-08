# Platform singletons — implementation plan

This plan is derived from the latest revision of `platform-singletons-spec.md`. The spec has pivoted away from a separate `document.singletons` configuration registry toward a schema‑first model: a document schema type opts into singleton behaviour by setting `singleton.documentId` directly on its `defineType({...})` definition. There is no longer any way for a single schema type to back both singleton and non‑singleton documents — if a developer needs both, they must declare two distinct schema types.

This document outlines the concrete code changes required across `@sanity/types`, `@sanity/schema`, `sanity` core, and the structure tool, plus a list of flaws/risks I found while reviewing the new spec.

---

## 1. High‑level architecture

A singleton now "lives" entirely in the schema:

1. **Schema definition**: `DocumentDefinition.singleton.documentId` declares that a document schema type is a singleton, and which document id it represents. This is type‑checked at compile time (`@sanity/types`) and propagated through schema compilation (`@sanity/schema`) so the field is available on the runtime `SchemaType` object reachable from `schema.get(typeName)`.
2. **Auto‑filtering in core**: At config resolution, Studio walks all schema types, identifies singletons, and:
   - Excludes them from the auto‑generated initial value templates array (the input to `document.newDocumentOptions`), so editors cannot create new instances.
   - Registers a built‑in document actions resolver that removes the `duplicate` action when the document being viewed has a singleton schema type.
3. **Auto‑filtering in structure tool**: `getDocumentTypeListItems` skips schema types whose definition has `singleton.documentId`, so they don't appear implicitly in the default content list.
4. **Three new structure builder helpers** (`S.document().singleton()`, `S.listItem().singleton()`, `S.list().singletons()`) read `singleton.documentId` from the schema type and produce ready‑to‑use document/listItem/list nodes. Each helper throws at serialise time if asked to wrap a non‑singleton schema type.

Data flow:

```
sanity.config.ts → defineType({ name: 'settings', type: 'document', singleton: { documentId: 'settings' } })
  → @sanity/types: DocumentDefinition.singleton (compile‑time)
  → @sanity/schema: ObjectType.extend preserves `singleton` on the compiled SchemaType
  → prepareConfig.tsx
      ↳ initial template array filtered to exclude singletons
      ↳ built‑in actions resolver filters `duplicate` for singleton schema types
  → structure tool
      ↳ getDocumentTypeListItems skips singletons
      ↳ S.document().singleton(name) / S.listItem().singleton(name) / S.list().singletons(names)
  → DocumentPane: nothing special is needed — actions context already carries `schemaType`,
    which the built‑in resolver uses to look up `singleton.documentId` on the compiled type.
```

The previous plan's `document.singletons` config option, `SingletonDefinition` type, `singletonsResolver` reducer, lookup tables on `Source`, `context.singleton`, and pane‑plumbed singleton id are all **gone**. This is a substantial simplification.

---

## 2. Type changes (`@sanity/types`)

### 2.1 `DocumentDefinition`

Edit `packages/@sanity/types/src/schema/definition/type/document.ts`:

```ts
/** @public */
export interface DocumentSingletonDefinition {
  /**
   * The document id this singleton schema type represents.
   */
  documentId: string
}

/** @public */
export interface DocumentDefinition extends Omit<ObjectDefinition, 'type'> {
  type: 'document'
  liveEdit?: boolean

  /**
   * Control whether this schema type is a singleton.
   *
   * - Singleton schema types can only represent one document.
   * - Singleton schema types are excluded from document lists.
   *
   * See <guide URL> to learn how to add singletons to Structure Tool using
   * `S.document().singleton()`, `S.listItem().singleton()`, or
   * `S.list().singletons()`.
   */
  singleton?: DocumentSingletonDefinition

  // existing properties…
}
```

Export `DocumentSingletonDefinition` from the package's barrel file (`packages/@sanity/types/src/schema/definition/index.ts` or wherever `DocumentDefinition` is currently re‑exported), so it appears in the public API.

### 2.2 Compiled runtime schema type

`schema.get(typeName)` returns a compiled type whose interface is rooted in `BaseSchemaType` (in `packages/@sanity/types/src/schema/types.ts`). Today, fields like `liveEdit` are exposed there because every consumer reads from the compiled type rather than the definition.

The spec explicitly calls for the singleton definition to be reflected on `BaseSchemaType` with the same shape as `DocumentDefinition`. Concretely:

```ts
// packages/@sanity/types/src/schema/types.ts
export interface BaseSchemaType extends Partial<DeprecationConfiguration> {
  // existing properties…
  liveEdit?: boolean
  singleton?: DocumentSingletonDefinition
}
```

This is technically wider than necessary — only document types can sensibly have a singleton — but it mirrors how `liveEdit` is modelled, and keeps consumers (e.g. `schema.get('settings')?.singleton?.documentId`) trivially typed without narrowing first.

A tighter contract (a dedicated `DocumentSchemaType` interface that only document types extend) would be a larger refactor; `isDocumentSchemaType` currently returns `ObjectSchemaType`, and there is no canonical `DocumentSchemaType` in `@sanity/types` today. The spec's choice to mirror `liveEdit` on `BaseSchemaType` is the pragmatic call. Note this trade‑off in the docs (see §9.1).

### 2.3 dts‑exports

- `packages/@repo/test-dts-exports/test/fixtures/@sanity.types.test-d.ts`: add a test for the new `DocumentSingletonDefinition` export.
- `packages/@repo/test-dts-exports/test/fixtures/sanity.test-d.ts`: re‑export and test if `DocumentSingletonDefinition` is part of the `sanity` package's public surface.

---

## 3. Schema compilation (`@sanity/schema`)

The legacy schema compiler in `packages/@sanity/schema/src/legacy/types/object.ts` builds compiled types via `ObjectType.extend(rawSubTypeDef, …)`. The compiled object is built by spreading `ownProps` (a copy of the original definition) onto the result, so arbitrary top‑level fields _are_ preserved by default.

What this means in practice:

- **Required**: nothing extra is needed for `singleton` to appear on the compiled type — it survives `extend()`.
- **Optional but recommended**: add `'singleton'` to the `OVERRIDABLE_FIELDS` list (if relevant) so a child schema can override it. In practice singletons are never extended via `type: 'someParent'`, but listing it makes the intent explicit.
- **Verify**: write a small unit test in `packages/@sanity/schema/test/` that compiles a singleton document type and asserts `compiled.singleton?.documentId === 'foo'`. This locks the behaviour in.

For the descriptor pipeline in `packages/@sanity/schema/src/descriptors/` (used to serialise schemas for upload), `convertCommonTypeDef` only extracts a known subset of fields. We need to decide whether singleton metadata should appear in the schema descriptor:

- **Yes**, if any backend tooling needs to know that a type is a singleton (search/indexing, GROQ, etc.).
- **No**, if singletons are a pure Studio UX concern.

The spec is silent. Recommend **No** for v1 — Studio doesn't currently rely on the descriptor for any singleton‑like behaviour, and not exposing it keeps the change scoped. Add a `// TODO(singletons): expose in descriptor if backend tooling needs it` comment in `convert.ts` and a flaw note (§9.5).

---

## 4. Configuration resolution (`packages/sanity/src/core/config/`)

### 4.1 Validate singleton definitions

Before the templates array is built, walk every document schema type, collect the singleton definitions, and accumulate validation errors via the existing `errors` array. Three rules:

1. **`documentId` must look like a published Sanity document id**.
   - Non‑empty string.
   - Must satisfy `isPublishedId(documentId)` from `@/core/util/draftUtils` (no `drafts.` prefix, no `versions.` prefix).
   - The character set must match Sanity's id rules. We can lean on the existing `isPublishedId` plus a basic shape check (`/^[a-zA-Z0-9._-]+$/`, no leading dot). If a stricter helper exists in `@sanity/util` we should reuse it; otherwise inline the regex with a `// TODO: extract to @sanity/util` comment.
2. **`documentId` must be unique across schema types**. Two schema types claiming the same `singleton.documentId` is a misconfiguration — see §9.8.
3. **`schemaType` must of course be a document type** — implicit because `singleton` only lives on `DocumentDefinition`, but defensively check `schemaType.type?.name === 'document'` for descriptors that may have lost type information.

Sketch:

```ts
// in resolveSource, before building the templates initialValue:
const singletonDocumentIds = new Map<string, string[]>() // documentId → schemaTypeNames
for (const typeName of schema.getTypeNames()) {
  const type = schema.get(typeName)
  if (!type || type.type?.name !== 'document' || !type.singleton) continue

  const {documentId} = type.singleton

  if (typeof documentId !== 'string' || documentId.length === 0) {
    errors.push(
      new Error(
        `Schema type "${typeName}" has \`singleton.documentId\` that is not a non-empty string.`,
      ),
    )
    continue
  }
  if (!isPublishedId(documentId) || !/^[a-zA-Z0-9._-]+$/.test(documentId)) {
    errors.push(
      new Error(
        `Schema type "${typeName}" has invalid \`singleton.documentId\` "${documentId}". ` +
          `It must be a published document id (no "drafts." or "versions." prefix) using only [a-zA-Z0-9._-].`,
      ),
    )
    continue
  }

  const claimants = singletonDocumentIds.get(documentId) ?? []
  claimants.push(typeName)
  singletonDocumentIds.set(documentId, claimants)
}

for (const [documentId, claimants] of singletonDocumentIds) {
  if (claimants.length > 1) {
    errors.push(
      new Error(
        `Multiple schema types claim singleton document id "${documentId}": ${claimants.join(', ')}. ` +
          `Each \`singleton.documentId\` must be unique.`,
      ),
    )
  }
}
```

The collected errors flow into the existing `ConfigResolutionError` aggregation in `resolveSource`, so users see all problems together rather than one at a time. This sequencing also means later steps (templates filter, actions filter) operate on a known‑valid set of singletons.

### 4.2 Initial templates filter

In `prepareConfig.tsx`, `resolveSource` builds the default `templates` array from every document schema type:

```ts
templates = resolveConfigProperty({
  // …
  initialValue: schema
    .getTypeNames()
    .filter((typeName) => !typeName.startsWith('sanity.'))
    .map((typeName) => schema.get(typeName))
    .filter(isNonNullable)
    .filter((schemaType) => schemaType.type?.name === 'document')
    .map((schemaType) => {
      /* build Template */
    }),
})
```

Add a filter step: `.filter((schemaType) => !schemaType.singleton)`. This removes the auto‑generated template for any singleton schema type from the initial value, which means:

- The "global" `newDocumentOptions` resolution (used to populate `staticInitialValueTemplateItems`) won't include singletons.
- Per‑structure and per‑document `newDocumentOptions` resolutions inherit the same baseline.

The user can still add an explicit `Template` for the singleton schema type via `schema.templates`. That continues to work — only the **auto‑generated** entry is suppressed. Document this trade‑off in the JSDoc and the spec footnote already addresses it.

There is one subtle ordering concern: the user's `schema.templates` resolver receives the post‑filter `initialValue`, so they can re‑add a template for a singleton type if they explicitly want one. That seems desirable (escape hatch).

### 4.3 Built‑in `duplicate` filter

The cleanest place to install this is as a built‑in document actions resolver applied **after** all user resolvers. Concretely, in `prepareConfig.tsx`'s `source.document.actions`:

```ts
actions: (partialContext) => {
  const userResolved = resolveConfigProperty({
    config,
    context: {...context, ...partialContext},
    initialValue: initialDocumentActions,
    propertyName: 'document.actions',
    reducer: documentActionsReducer,
  })

  // Built-in singleton filter — runs after user resolvers so it can't be
  // bypassed by reintroducing the duplicate action via document.actions.
  const schemaType = schema.get(partialContext.schemaType)
  if (schemaType?.singleton) {
    return userResolved.filter((action) => action.action !== 'duplicate')
  }
  return userResolved
}
```

Why here, not in `structureTool.ts`? Two reasons:

1. **Correctness**: putting it in `structureTool.ts` means user `document.actions` resolvers run later in the chain and can reintroduce the action. The previous version of this plan flagged this as the highest‑severity risk; pushing it to `prepareConfig` eliminates the risk entirely.
2. **Scope**: any tool that renders document actions for a singleton schema type (presentation tool, custom tools, etc.) gets the same treatment for free.

The `DocumentActionsContext` already carries `schemaType: string`, so no new context plumbing is needed. The pivot to schema‑typed singletons retires the `context.singleton` field from the previous plan entirely.

### 4.4 No `DocumentActionsContext` / `DocumentBadgesContext` / etc. changes

Because singletonness is determined by looking at the schema type rather than the document/structure context, none of the document‑related contexts (`DocumentActionsContext`, `DocumentBadgesContext`, `DocumentInspectorContext`, `DocumentLanguageFilterContext`, `DocumentCommentsEnabledContext`, `DocumentAskToEditEnabledContext`) need new fields. The previous plan's §2.3 is dropped entirely.

If a third‑party plugin wants to know whether the current document is a singleton inside its own actions/badges resolver, it can do `context.schema.get(context.schemaType)?.singleton`. Mention this in the docs.

### 4.5 No new `Source.document.singletons`

Since singletons are reachable via `schema.get(...)`, there is no need to expose a separate registry on `Source`. Drop everything related to it from the previous plan.

---

## 5. Structure tool changes (`packages/sanity/src/structure/structureBuilder/`)

### 5.1 Helper for resolving the singleton definition

Add a small private utility (e.g. `util/getSingletonDefinition.ts`) that, given a `StructureContext` and a schema type name, returns either the resolved `DocumentSingletonDefinition` or throws a `SerializeError`:

```ts
export function getSingletonDefinition(
  context: StructureContext,
  schemaTypeName: string,
  pathHint: SerializePath = [],
): DocumentSingletonDefinition {
  const type = context.schema.get(schemaTypeName)
  if (!type) {
    throw new SerializeError(
      `Could not find type "${schemaTypeName}" in schema`,
      pathHint,
      undefined,
    ).withHelpUrl(HELP_URL.SCHEMA_TYPE_NOT_FOUND)
  }
  const singleton = type.singleton
  if (!singleton?.documentId) {
    throw new SerializeError(
      `Schema type "${schemaTypeName}" is not a singleton. ` +
        `Add \`singleton: { documentId: '<id>' }\` to its schema definition.`,
      pathHint,
      undefined,
    )
  }
  return singleton
}
```

Returning the full `DocumentSingletonDefinition` (rather than just `documentId`) keeps the helper future‑proof: when the spec adds further fields to `DocumentSingletonDefinition` (e.g. an icon override, a default title key, etc.), every caller already has the resolved object in hand without needing to re‑query the schema.

`type.singleton` is typed natively because the spec adds `singleton` to `BaseSchemaType` (§2.2), so no cast is needed. Reusing `getSingletonDefinition` from all three new structure builder helpers keeps the error messages consistent.

### 5.2 `DocumentBuilder.singleton()` (`Document.ts`)

```ts
singleton(schemaTypeName: string): DocumentBuilder {
  const {documentId} = getSingletonDefinition(this._context, schemaTypeName)
  return this.schemaType(schemaTypeName).documentId(documentId)
}
```

Subsequent `.documentId(...)` or `.schemaType(...)` calls override these defaults — preserving the immutable‑builder ergonomics of the existing API. Document this in the JSDoc.

**When should `getSingletonDefinition` throw — at chain time or at serialise time?** The spec just says "a runtime error will be thrown". I recommend **chain time** (i.e. inside `.singleton()`, not in `.serialize()`):

- Pro: the error stack points at the offending `S.document().singleton('typo')` call, which is the most useful place.
- Con: it means `S.document().singleton(...)` cannot be called before the schema is loaded into context. In practice, structure builders are always invoked with a fully resolved `StructureContext`, so this is moot.

Make the same decision for `S.listItem().singleton()` and `S.list().singletons()`.

### 5.3 `ListItemBuilder.singleton()` (`ListItem.ts`)

```ts
singleton(schemaTypeName: string): ListItemBuilder {
  // Resolve eagerly so we surface a useful error if the schema type isn't a
  // singleton, even though we don't currently consume the result here.
  getSingletonDefinition(this._context, schemaTypeName)
  const schemaType = this._context.schema.get(schemaTypeName)
  const fallbackTitle = schemaType?.title ?? startCase(schemaTypeName)
  return this
    .id(this.spec.id ?? schemaTypeName)
    .title(this.spec.title ?? fallbackTitle)
    .schemaType(schemaTypeName)
    .child(this._context.getStructureBuilder().document().singleton(schemaTypeName))
}
```

Defaults can all be overridden by the caller via the standard list‑item chain (`.title(...)`, `.icon(...)`, `.id(...)`, `.child(...)`).

### 5.4 `ListBuilder.singletons()` (`List.ts`)

```ts
singletons(schemaTypeNames: string[]): ListBuilder {
  const items = schemaTypeNames.map((name) =>
    this._context.getStructureBuilder().listItem().singleton(name),
  )
  return this.items([...(this.spec.items ?? []), ...items])
}
```

Pure sugar: the developer still needs `.id(...)` and `.title(...)` for the list itself (just like every other `S.list()` invocation).

### 5.5 Default structure: skip singletons

Update `getDocumentTypes` (or the filter inside `getDocumentTypeListItems`) in `documentTypeListItems.ts`:

```ts
function getDocumentTypes({schema}: StructureContext): string[] {
  return schema
    .getTypeNames()
    .filter((n) => {
      const t = schema.get(n)
      return t && isDocumentType(t) && !t.singleton
    })
    .filter((n) => !isBundledDocType(n))
}
```

This prevents singletons from appearing in `S.defaults()`, which is the implicit content list.

**Explicit `S.documentTypeList(typeName)` for a singleton schema type still works** but is almost never what the developer wants (the list will only ever contain a single document, which the user must then click into). In `getDocumentTypeList`, log a `console.warn` in dev mode (gated by `isDev` from `packages/sanity/src/core/environment`) suggesting `S.listItem().singleton(typeName)` instead. Production builds stay silent. See §9.6.

### 5.6 Type updates

Update `packages/sanity/src/structure/structureBuilder/types.ts` (the `StructureBuilder` interface) so the new builder methods are typed correctly. The methods themselves live on the builder classes (`DocumentBuilder`, `ListItemBuilder`, `ListBuilder`); the public class interfaces are exported via `index.ts`. Verify the dts test fixtures for `sanity.structure.test-d.ts` cover the new methods.

---

## 6. Document pane

**Nothing to do here.** This is a key simplification compared to the previous plan:

- The old plan threaded a `singleton` id through `pane.options` and `DocumentPaneProvider`. With the schema‑typed approach, the `duplicate` filter (§4.2) reads `schema.get(schemaType).singleton` directly, so no pane plumbing is needed.
- The `(documentId, schemaType)` fallback lookup is also unnecessary — the schema type alone fully determines singletonness.

This removes an entire axis of bugs (drafts/versions/intent/multiple structure tools all behave correctly without special handling).

---

## 7. Tests

### 7.1 `@sanity/types` tests

`packages/@sanity/types/test/document.test.ts`:

- Singleton field is accepted on `defineType({ type: 'document', singleton: { documentId: '…' } })`.
- `singleton` field is _not_ accepted on non‑document types (this should be a compile error; assert via `// @ts-expect-error`).
- `defineType` with `singleton: { documentId: '' }` is allowed by the type but flagged at runtime (see §7.4).

### 7.2 `@sanity/schema` tests

New file (e.g. `packages/@sanity/schema/test/singleton.test.ts`):

- A document type defined with `singleton: { documentId: 'foo' }` resolves via `schema.get('typeName')` with `compiled.singleton.documentId === 'foo'`.
- A document type without `singleton` returns `compiled.singleton === undefined`.
- (Optional) The schema descriptor does/does not include singleton metadata, depending on the §3 decision.

### 7.3 Structure builder tests

- `Document.test.ts` (new or extended):
  - `S.document().singleton('settings')` sets schemaType + documentId from the schema definition.
  - `.singleton('typo')` throws `SerializeError` immediately (chain‑time error).
  - `.singleton('nonSingletonType')` throws `SerializeError` immediately with a clear message.
  - Subsequent `.documentId('override')` overrides the singleton's default.
- `ListItem.test.ts`:
  - Default title resolves to schema type's title, falls back to `startCase(typeName)`.
  - Default child is a `DocumentNode` for the singleton.
  - Override of title/icon/id works.
- `List.test.ts`:
  - `S.list().id('singletons').title('Singletons').singletons(['a', 'b'])` produces two list items.
  - Combines correctly with previously‑declared `.items()`.
  - Throws if any name in the array isn't a singleton schema type.
- `documentTypeListItems.test.ts`:
  - Singleton document types are skipped in `S.defaults()`.
  - Explicit `S.documentTypeList('settings')` for a singleton type still produces a (mostly empty) list.

### 7.4 Core config tests

`packages/sanity/src/core/config/__tests__/prepareConfig.singletons.test.ts`:

- **Validation (§4.1)**:
  - Empty `singleton.documentId` → `ConfigResolutionError` whose causes include a clear message naming the offending schema type.
  - `singleton.documentId === 'drafts.foo'` → `ConfigResolutionError` (rejected by `isPublishedId`).
  - `singleton.documentId` containing illegal characters (e.g. `"foo bar"`) → `ConfigResolutionError`.
  - Two schema types declaring the same `singleton.documentId` → `ConfigResolutionError` whose message lists all claimants.
  - Multiple validation failures across distinct schema types are accumulated into a single `ConfigResolutionError` (no early exit).
  - A valid singleton definition causes no errors.
- **Auto‑filtering**:
  - Initial `templates` array does not include auto‑generated entries for singleton schema types.
  - The user can add a custom `Template` for a singleton type via `schema.templates` and it survives.
  - `source.document.actions({schemaType: 'settings', …})` does not include the `duplicate` action when `'settings'` is a singleton schema type.
  - `source.document.actions({schemaType: 'article', …})` _does_ include `duplicate` (regression protection).
  - A user `document.actions` resolver that explicitly adds back the duplicate action **does not bypass** the built‑in filter for singletons (terminal filter behaviour).
  - `source.document.resolveNewDocumentOptions({type: 'global'})` does not include the singleton type.
  - `source.document.resolveNewDocumentOptions({type: 'structure', schemaType: 'settings'})` returns `[]` (no creatable templates).
  - `source.document.resolveNewDocumentOptions({type: 'document', documentId: 'settings', schemaType: 'settings'})` returns `[]` (cannot create from inside a singleton document either).

### 7.5 dts‑exports

- Re‑run `pnpm test:exports` to update snapshots in `packages/sanity/test/__snapshots__/exports.test.ts.snap` for the new `DocumentSingletonDefinition` symbol.
- Add fixture entries in `packages/@repo/test-dts-exports/test/fixtures/`.

### 7.6 Dev studio

In `dev/test-studio/`:

- Add a new singleton schema type (e.g. `singletonSettings.ts`) using the new API.
- Add it to `dev/test-studio/structure/resolveStructure.ts` via `S.listItem().singleton('singletonSettings')`.
- Smoke‑test in the dev studio that:
  - The schema type doesn't appear in the implicit content list.
  - The "duplicate" action is hidden in the document pane.
  - The "create new" affordances don't offer the singleton type.
  - Editing the document still works.

This doubles as living documentation.

---

## 8. Documentation & LLM skills

- Add a "Singletons" page to the docs (link target referenced in the `DocumentDefinition.singleton` JSDoc).
- Update inline JSDoc on `DocumentDefinition.singleton`, `DocumentSingletonDefinition`, and the three new builder methods.
- Add an LLM skill under `skills/` covering the new API and the migration story (the spec confirms userland implementations remain compatible, but adopting the new API is straightforward).

---

## 9. Flaws and open questions in the spec

### 9.1 Compiled schema type — resolved

The updated spec is now explicit that `BaseSchemaType` will gain a `singleton` field with the same shape as `DocumentDefinition.singleton`. This closes the gap raised in the previous revision (where the compiled `SchemaType` returned by `schema.get(typeName)` would not have carried `singleton`, forcing every consumer to cast).

Residual considerations to acknowledge in the docs:

- The field will be reachable on _every_ compiled schema type (object/string/array/…) because it lives on `BaseSchemaType`, not just on document types. This is harmless — it is always `undefined` on non‑document types — and matches how `liveEdit` is exposed today.
- A tighter contract (a dedicated `DocumentSchemaType` interface) would be a larger refactor and is out of scope for v1. Track as a follow‑up if/when `DocumentSchemaType` is introduced for other reasons.

### 9.2 `singleton` is preserved by schema compilation today, but not contractually

`@sanity/schema/src/legacy/types/object.ts` happens to spread `ownProps` onto compiled types, which is why arbitrary fields survive. There is no test that locks this behaviour in for the `singleton` field specifically. Add the unit test described in §7.2; otherwise a future refactor of `ObjectType.extend` could silently drop `singleton`.

### 9.3 Schema descriptor / backend visibility

The schema descriptor pipeline (`packages/@sanity/schema/src/descriptors/convert.ts`) does not currently emit a `singleton` field. If the backend (search, GROQ, content lake) ever needs to know which documents are singletons (for example, to enforce a uniqueness constraint server‑side), we would need to opt the field into the descriptor.

The spec is silent. The most defensible default is **not** to expose it for v1; document this explicitly in the spec footnote and revisit when there's a concrete backend use case. The current pattern matches: `liveEdit` _is_ in the descriptor (see `convertCommonTypeDef`), but only because the form layer needs it. There is no analogous core consumer for `singleton` outside Studio.

### 9.4 `getSingletonDefinition` failure mode

If a developer mistypes a schema type name in `S.document().singleton('settngs')`, the error (per §5.2) fires at chain time, which is good. But if a schema type _is_ a singleton today and is later changed to a non‑singleton (or removed), every `S.…singleton('foo')` call elsewhere in the structure starts throwing during structure resolution — because `getSingletonDefinition` no longer resolves a definition for that name.

This is acceptable, but worth surfacing the error early. The plan throws `SerializeError`, which the structure tool already renders user‑friendly errors for, so this should be fine in practice.

### 9.5 The "no shared schema types" footnote

The footnote in the spec explains why a schema type can no longer back both singletons and non‑singletons. This is a deliberate constraint and matches how most developers conceptualise singletons: "this schema type _is_ a settings document." Tying the singleton to the schema type directly is intuitive for the common case.

From an implementation standpoint the constraint _greatly_ simplifies the work — no per‑instance flag, no `(documentId, schemaType)` lookup tables, no pane plumbing.

The rare case of "I want both a singleton and ordinary documents of the same shape" is well covered by `defineType`'s plain‑object return value: shallow‑copy the singleton definition with a new `name` and `singleton` omitted. A one‑liner example in the docs is sufficient.

### 9.6 Minor: implicit `documentTypeList` for a singleton — resolved

`S.documentTypeList('settings')` for a singleton type still works at the structure builder level (the list filter `_type == $type` will return the single document). Not strictly broken, but the resulting UI is awkward — a list with a single item that the user is then expected to click into.

**Confirmed**: log a `console.warn` in dev mode when `getDocumentTypeList` is called for a singleton schema type, suggesting `S.listItem().singleton(type)` instead. Implementation lives in `packages/sanity/src/structure/structureBuilder/documentTypeListItems.ts`, gated by `isDev` from `sanity/src/core/environment` so production builds are silent. Cover with a unit test that asserts the warning fires exactly once per singleton type per `getDocumentTypeList` call (use `vi.spyOn(console, 'warn')`).

### 9.7 `singleton.documentId` shape validation — resolved

The spec types `documentId` as just `string`, which lets through values that aren't valid published Sanity document ids (empty string, `drafts.` prefix, illegal characters). The plan validates each `singleton.documentId` at config‑resolution time (§4.1): non‑empty, `isPublishedId`, and matches Sanity's id character set. Failures are accumulated into `errors` and reported together via `ConfigResolutionError`.

### 9.8 Multiple schema types claiming the same `documentId` — resolved

The new model lets two schema types both set `singleton: { documentId: 'settings' }`. Without intervention, whichever document is created first wins and both schema types think the document belongs to them.

The plan validates uniqueness at config‑resolution time (§4.1). When two or more schema types claim the same `documentId`, a single `Error` listing all claimant schema type names is pushed onto the `errors` array, surfaced via `ConfigResolutionError`. This fails fast and forces a rename before Studio finishes loading.

---

## 10. Suggested PR breakdown

Each PR can pass `pnpm build && pnpm test && pnpm lint` in isolation.

1. **Type & schema compilation plumbing**.
   - `@sanity/types`: add `DocumentSingletonDefinition` and `DocumentDefinition.singleton` (§2.1); add `singleton` to `BaseSchemaType` (§2.2).
   - `@sanity/schema`: lock `singleton` survives compilation with a new test (§3, §7.2).
   - dts‑export fixtures (§2.3, §7.5).
   - No behaviour change yet.
2. **Core auto‑filtering**.
   - Validate singleton definitions: shape, uniqueness (§4.1, §9.7, §9.8).
   - Filter singletons out of the auto‑generated initial templates array (§4.2).
   - Add the built‑in `duplicate` filter as a terminal layer in `prepareConfig.tsx` (§4.3).
   - Tests in §7.4.
3. **Structure builder helpers**.
   - `getSingletonDefinition` utility (§5.1).
   - `S.document().singleton()`, `S.listItem().singleton()`, `S.list().singletons()` (§5.2–§5.4).
   - Tests in §7.3.
4. **Default structure filtering**.
   - `getDocumentTypeListItems` skips singleton schema types (§5.5).
   - Optional dev‑mode warn in `getDocumentTypeList` for singletons (§9.6).
5. **Docs + dev‑studio example + skills** (§7.6, §8). Can run in parallel with 3–4.

Step 2 is the only one that ships user‑visible behaviour beyond a type addition. After step 4, the feature is fully cooked.

---

## 11. Risk summary

| Risk                                                                         | Severity | Mitigation                                                                            |
| ---------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `duplicate` filter reintroduced by user `document.actions` resolver          | High     | Apply filter as terminal post‑user step in `prepareConfig.tsx` (§4.2), not in plugin. |
| Two schema types claim the same `singleton.documentId` (§9.8)                | Medium   | Validate at config‑resolution; error early.                                           |
| Schema compilation silently drops `singleton` after a future refactor (§9.2) | Medium   | Lock with a unit test in `@sanity/schema/test/`.                                      |
| `S.documentTypeList(singletonType)` is allowed but useless (§9.6)            | Low      | Dev‑mode `console.warn`; document the intended pattern.                               |
| Schema descriptor doesn't propagate singleton metadata (§9.3)                | Low      | Defer until a backend consumer needs it; add a `// TODO` in `convert.ts`.             |
