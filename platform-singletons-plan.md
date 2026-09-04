# Platform singletons — implementation plan

This plan implements `platform-singletons-spec.md`: a first-class `document.singletons`
configuration registry where a singleton is a `SingletonDefinition` of `{id, documentId,
schemaType}`. A schema type may back **multiple singletons** and non-singleton documents
simultaneously — schema types and singletons are fully decoupled.

## Context: why we're revisiting this design

A previous iteration of this work (jj revset `tu..wr`) pivoted to a schema-first model
(`defineType({singleton: {documentId}})`, one singleton per schema type) after hitting
difficulties with initial value templates. That pivot produced working code, but sacrificed the
registry model's key strength: one schema type serving many singletons (and ordinary documents).
The registry model remains the gold-standard API, and this plan returns to it — resolving the
template difficulty head-on rather than designing around it.

### The initial value templates problem (and its resolution)

The spec originally said: _"Prevent the document being created by removing it from the templates
array in `resolveSource`."_ Taken literally (as the pivoted implementation did — it filtered
singleton types out of the `schema.templates` initial value in `prepareConfig.tsx`), this breaks
in three ways, and is the root of the earlier difficulty:

1. **`source.templates` does double duty.** It feeds "Create new" surfaces, but it is _also_ the
   input to initial value resolution when a document pane opens a document that doesn't exist yet:
   `useDocumentPaneInitialValue` → `getInitialValueTemplateOpts` (picks the type's sole template
   when none is specified) → `getInitialValueStream` (resolves `template.value`). The
   auto-generated template carries `schemaType.initialValue`. Remove it, and a singleton document
   opened for the first time silently ignores the schema's `initialValue` — the exact document
   for which initial values matter most.
2. **Shared schema types.** If type `T` backs both a singleton and ordinary documents, removing
   `T`'s template blocks legitimate creation of non-singleton `T` documents. Under the registry
   model this case is explicitly supported, so type-level template removal is simply wrong.
3. **Type derivation.** `usePaneOptions` derives a pane's document type from the template registry
   when structure doesn't specify one; deleting templates degrades that path too.

**Resolution:** make template provenance explicit instead of inferring it. `Template` gains an
optional `singleton` property (the singleton definition id), and template generation changes for
singleton-claimed schema types:

- The plain per-type auto-generated template is **not generated** for schema types claimed by at
  least one singleton definition. Instead, each singleton definition gets its own template —
  `{id: definition.id, schemaType, title, icon, value, singleton: definition.id}` — whose value is
  `definition.initialValue ?? schemaType.initialValue`. The templates array therefore always
  retains an initial-value source for the singleton (the very thing that broke when templates were
  removed outright), and each singleton can carry its own initial value.
- `initialTemplatesResponses` (the `TemplateItem[]` initial value fed to
  `document.resolveNewDocumentOptions`) simply drops every template with `singleton` set: the
  singleton document has a fixed id, so its template is never a "create new" option. No id
  heuristic.
- All create surfaces derive from `resolveNewDocumentOptions` (the global "+ Create" menu via
  `staticInitialValueTemplateItems = resolveNewDocumentOptions({type: 'global'})`, structure pane
  "create new" buttons, reference-input creation), so filtering here covers everything with one
  rule.
- **Untagged** templates are never filtered. This is the escape hatch for shared schema types:
  declaring a singleton over `T` removes `T`'s plain template, and a developer who also wants
  ordinary `T` documents defines an explicit untagged template for `T` (any id — even `T` itself,
  since the plain template no longer exists) and it appears in create menus as usual.
  `document.newDocumentOptions` resolvers compose on top as today and can also re-add items.

Two observations that make this safe:

- Template-driven creation always generates a **random** document id, so it can never collide with
  a singleton's fixed `documentId`. The filtering is a UX measure (don't advertise creating
  documents of a singleton-ish type), not an integrity mechanism. Integrity comes from the id
  itself plus the duplicate-action filter.
- For an exclusively-singleton schema type, the tagged template is the type's sole template, so
  the singleton pane's first-open initial value resolves exactly as any other document's:
  `getInitialValueTemplateOpts` auto-picks it and the initial value applies — even on deep links.

One residual sharp edge: if a schema type has several templates (multiple singletons sharing it,
or escape-hatch templates), `getInitialValueTemplateOpts` no longer auto-picks a template
(existing behaviour for all types), and the singleton would open empty. To make singleton initial
values deterministic, `S.document().singleton(id)` pins `options.template` to the template tagged
with the definition id — overridable via `.initialValueTemplate(...)` as usual. See §4.2.

A welcome side effect: `Template.singleton` makes the singleton subset of templates mechanically
extractable (`templates.filter((template) => template.singleton)`), anticipating future
serialisation of templates to enrich other editing surfaces (e.g. Content Agent) with an
understanding of singletons and their initial values.

---

## 1. High-level architecture

A singleton lives in three places at runtime:

1. **Configuration**: a normalised `SingletonDefinition[]` resolved from `document.singletons`,
   validated, and exposed on `Source.document.singletons`.
2. **Document contexts**: whenever document-scoped config functions run (`actions`, `badges`,
   `inspectors`, `unstable_languageFilter`, `comments.enabled`, `askToEdit.enabled`), core looks
   the singleton up by `(publishedId(documentId), schemaType)` and injects `singleton: <definition
id>` into the context. A terminal, non-bypassable filter removes the `duplicate` action when
   `singleton` resolves.
3. **Structure tool**: singleton schema types are excluded from the implicit default content list;
   three new builder helpers (`S.document().singleton()`, `S.listItem().singleton()`,
   `S.list().singletons()`) surface singletons explicitly by reading the registry from
   `StructureContext` (which already extends `Source`).

Data flow:

```
sanity.config.ts (document.singletons)
  → configPropertyReducers.singletonsReducer (composable; normalises string shorthand eagerly)
  → prepareConfig.tsx: validate → source.document.singletons: SingletonDefinition[]
      ↳ per-definition singleton templates generated; tagged templates dropped from new-document options
      ↳ document.actions / badges / inspectors / … wrappers inject context.singleton
      ↳ terminal built-in filter drops `duplicate` when context.singleton is set
  → StructureContext (Source spread)
      ↳ getDocumentTypeListItems(): skips singleton schema types
      ↳ S.document().singleton(id) / S.listItem().singleton(id) / S.list().singletons(ids)
```

Notably absent (deliberate simplifications relative to the very first draft of this plan):

- **No `DocumentNode.options.singleton` plumbing and no `DocumentPaneProvider` changes.** Because
  `documentId` is unique across singleton definitions, singleton-ness is a property of the
  document id, not of the route taken to reach the pane. Central lookup in `prepareConfig`'s
  wrappers (which already receive `documentId`/`schemaType` in their partial contexts, as
  `DocumentPaneProvider` passes them today) handles panes opened via structure helpers, manual
  structure, intents, and deep links identically.
- **No schema/`@sanity/types`/`@sanity/schema` changes.** The registry is pure Studio config;
  nothing leaks into schema compilation or the schema descriptor pipeline. (The pivoted
  implementation's `DocumentDefinition.singleton` changes are dropped entirely.)

---

## 2. Type changes (`packages/sanity/src/core/config/types.ts`)

### 2.1 New types

```ts
/**
 * The resolved form: `id` is always present.
 *
 * @hidden @beta
 */
export interface SingletonDefinition extends Pick<
  BaseSchemaType,
  'title' | 'icon' | 'initialValue'
> {
  /**
   * The singleton definition id: the stable identity by which structure code
   * references the singleton. Inherits `documentId` when omitted at
   * configuration time.
   *
   * Must be unique across singleton definitions. A discrete definition id
   * decouples the singleton's identity from its schema type and document id:
   *
   * - Multiple singletons can share a schema type.
   * - Structure code (often shared across workspaces) can reference a
   *   singleton by a value that stays constant while each workspace maps it
   *   to a different document id (e.g. per-dataset/environment ids).
   * - Developers can change `documentId` or `schemaType` over time while
   *   preserving the semantic identity of the singleton.
   */
  id: string
  /** The singleton document id. Must be unique across singleton definitions. */
  documentId: string
  /** The name of the document schema type used by the singleton. */
  schemaType: string
}

/**
 * The developer-provided form: a definition whose `id` is optional (it
 * inherits `documentId`), or — when `id`, `documentId`, and `schemaType` are
 * all identical — that value as a single string.
 *
 * @hidden @beta
 */
export type UnresolvedSingletonDefinition =
  | (Omit<SingletonDefinition, 'id'> & {
      /**
       * Optional: inherits the definition's `documentId` when omitted. Set it
       * explicitly to be verbose, to guard against future collisions, or to
       * address a singleton universally when different workspaces or
       * environments map it to different document ids.
       */
      id?: string
    })
  | string

/**
 * Receives resolved definitions; may return unresolved definitions, which
 * Studio resolves before the next layer sees them.
 *
 * @hidden @beta
 */
export type SingletonsResolver = (
  prev: SingletonDefinition[],
  context: ConfigContext,
) => UnresolvedSingletonDefinition[]
```

`title` and `icon` exist so the registry can be the single source of display metadata — without
them, `S.listItem().singleton('legalPage')` has no better default than start-casing the
definition id. `initialValue` gives each singleton its own initial value (flowing into the
singleton's generated template, see §3.3), which matters when several singletons share a schema
type. All three fall back to the schema type's own metadata, remain overridable in structure, and
the string shorthand produces a definition without them.

**Why `Pick<BaseSchemaType, 'title' | 'icon' | 'initialValue'>` rather than redeclaring the
fields or picking from Structure Tool types:**

- Reusing Structure Tool types (e.g. `ListItem`) is blocked by the package's layering: the
  `boundaries/dependencies` rules in `.oxlintrc.json` allow core (`sanity__contents`) to import
  only from core, `sanity/router`, and `sanity/_singletons` — and the dependency arrow genuinely
  points the other way (`StructureContext extends Source`), so a core → structure import, even
  type-only, would invert the layering.
- `BaseSchemaType` (`@sanity/types`, the lowest layer) is the right allow-list source because it
  is the _same metadata_, not merely the same shape: structure's list item defaults already flow
  from `schemaType.title`/`schemaType.icon`, and core's `Template.icon` is literally typed
  `SchemaType['icon']`. The definition-level fields override exactly what they'd otherwise
  inherit.
- The picked `icon?: ComponentType` is narrower than `ListItemBuilder.icon()`'s
  `ComponentType | ReactNode` — assignment-compatible in the direction we need, and consistent
  with every other _definition-time_ icon (`defineType({icon})`, `Template.icon`). If
  `BaseSchemaType.icon` ever widens, singleton definitions inherit the change automatically.

JSDoc on the interface should still describe how `title`/`icon`/`initialValue` are used (default
list item title/icon for `S.listItem().singleton()` and `S.list().singletons()`; initial value
for the singleton's generated template — each falling back to the schema type's own metadata) —
`Pick` inherits `BaseSchemaType`'s generic doc comments, so add an `@remarks` block or redoc via
the interface-level comment.

Exported from the `sanity` package public surface (core config barrel), with the exports snapshot
(`packages/sanity/test/__snapshots__/exports.test.ts.snap`) regenerated.

### 2.2 `defineSingleton()`

An identity helper following the `defineType` / `defineConfig` / `definePlugin` convention, so
developers get typing and autocomplete when declaring singletons outside a config literal:

```ts
/**
 * Define a singleton {@link SingletonDefinition | definition} for use in the
 * `document.singletons` configuration.
 *
 * Note: this defines a singleton definition — the registry entry binding a
 * definition id to a document id and schema type — **not** a singleton
 * document schema. The schema type it references is defined separately with
 * `defineType`.
 *
 * @hidden @beta
 */
export function defineSingleton(definition: SingletonDefinition): SingletonDefinition {
  return definition
}
```

Lives alongside the other `define*` helpers in core config; exported publicly and covered by the
dts-exports fixtures.

### 2.3 `DocumentPluginOptions`

```ts
/** @hidden @beta */
singletons?: UnresolvedSingletonDefinition[] | SingletonsResolver
```

Optional — a required property would break every existing `definePlugin` caller. String shorthand
`'settings'` expands to `{id: 'settings', documentId: 'settings', schemaType: 'settings'}`.

### 2.4 Document-related contexts

Add `singleton?: string` (the singleton **definition id**) to:

- `DocumentActionsContext`
- `DocumentBadgesContext`
- `DocumentInspectorContext`
- `DocumentLanguageFilterContext`
- `DocumentCommentsEnabledContext`
- `DocumentAskToEditEnabledContext`
- `DocumentFieldActionsResolverContext` (`@internal` today, but it receives the same
  `documentId`/`schemaType` pair and flows through the same wrapper pattern — excluding it would
  leave the context surface inconsistent)

JSDoc mirrors the spec: the context already carries `documentId` and `schemaType`, so only the
definition id is provided.

### 2.5 `Source.document`

```ts
/** @hidden @beta */
singletons: SingletonDefinition[]
```

Resolved form only — consumers never see strings or resolver functions here.

---

## 3. Configuration resolution (`packages/sanity/src/core/config/`)

### 3.1 `configPropertyReducers.ts` — `singletonsReducer`

Follows the established reducer pattern (`documentActionsReducer` et al.):

```ts
export const singletonsReducer: ConfigPropertyReducer<SingletonDefinition[], ConfigContext> = (
  prev,
  {document},
  context,
) => {
  const singletons = document?.singletons
  if (!singletons) {
    return prev
  }
  if (typeof singletons === 'function') {
    return singletons(prev, context).map(normalizeSingletonDefinition)
  }
  if (Array.isArray(singletons)) {
    return [...prev, ...singletons.map(normalizeSingletonDefinition)]
  }
  throw new Error(
    `Expected \`document.singletons\` to be an array or a function, but received ${getPrintableType(singletons)}`,
  )
}
```

`normalizeSingletonDefinition` expands the string shorthand and fills an omitted `id` with the
definition's `documentId`. Both the array form and **resolver-function output** are normalised at
every layer, so `SingletonsResolver` functions only ever _receive_ resolved
`SingletonDefinition[]` while remaining free to _return_ unresolved definitions (matching the
spec's asymmetric resolver typing). Validation, context injection, template generation, and the
structure helpers all operate on resolved definitions and need no changes for the optional `id` —
including `ListItemBuilder.singleton()`'s title heuristic (`id === schemaType` ⇒ schema title),
which treats an inherited id exactly like the string shorthand, and the duplicate-id validation,
which already catches an explicit id colliding with another definition's inherited one.

### 3.2 `prepareConfig.tsx` — resolution and validation

In `resolveSource`, after `schema` is available and before templates are resolved:

1. Resolve: `resolveConfigProperty({config, context, initialValue: [], propertyName:
'document.singletons', reducer: singletonsReducer})`.
2. Validate, pushing onto the existing `errors` array so all problems surface together through the
   single `ConfigResolutionError` at the end of `resolveSource`:
   - `id` non-empty and **unique** across definitions — aggregate every duplicate into one error.
   - `documentId` non-empty, **unique** across definitions (aggregate), and shaped like a
     published id: `isPublishedId(documentId)` (from `core/util/draftUtils`) plus
     `/^[a-zA-Z0-9._-]+$/` (mirrors the validation the pivoted implementation landed; keep the
     `// TODO: extract to @sanity/util` note).
   - `schemaType` must exist in the schema and satisfy `type?.name === 'document'`.
   - `schemaType` uniqueness is explicitly **not** required.
   - A definition whose `id`, `documentId`, and `schemaType` are all identical is valid (the
     string-shorthand expansion).
3. Build derived lookups used by later steps:
   - `singletonSchemaTypeNames: Set<string>` — for template filtering (§3.3).
   - `singletonByDocumentId: Map<string, SingletonDefinition>` — for context injection (§3.4).
     Keyed by `documentId` alone; uniqueness makes this unambiguous.
4. Expose `source.document.singletons = singletons`.

### 3.3 Singleton templates and new-document-options filtering (the templates fix)

Per the resolution described at the top of this document, provenance is explicit. `Template`
(`core/templates/types.ts`) gains:

```ts
/**
 * The singleton definition id this template provides the initial value for.
 *
 * Set on the auto-generated singleton templates. Templates carrying this
 * property are never offered as "create new" options — the singleton document
 * has a fixed id — and identify the singleton subset of templates for
 * singleton-aware surfaces.
 */
singleton?: string
```

Template generation in `resolveSource` changes for singleton-claimed schema types:

```ts
// Plain per-type templates: skipped for singleton-claimed types.
.filter((schemaType) => !singletonSchemaTypeNames.has(schemaType.name))
// …then one template per singleton definition is appended:
{
  id: definition.id,
  schemaType: definition.schemaType,
  title: definition.title || schemaType.title || schemaType.name,
  icon: definition.icon || schemaType.icon,
  value: definition.initialValue ?? schemaType.initialValue ?? {_type: definition.schemaType},
  singleton: definition.id,
}
```

And `initialTemplatesResponses` filters by the tag alone:

```ts
.filter((template) => template.singleton === undefined)
```

Two additional validation rules (aggregated with the rest, checked after `schema.templates`
resolution): an **untagged** template must not reuse a singleton definition id (the generated
singleton template claims it), and at most one template may carry a given `singleton` tag.

Consequences, all covered by tests (§6.1):

- Global "+ Create" (`staticInitialValueTemplateItems`), structure "create new" buttons, and
  reference-input creation never offer tagged templates, so singleton-claimed types disappear
  from create menus unless the developer adds an untagged template.
- `document.newDocumentOptions` user resolvers receive the post-filter initial value and can
  re-add items (escape hatch preserved).
- Opening the singleton document before it exists resolves `definition.initialValue ??
schemaType.initialValue` via the tagged template.
- Shared schema types: defining an explicit untagged template for the type restores creation of
  ordinary documents — any id works, including the type name itself, since the plain per-type
  template no longer exists for singleton-claimed types.
- A developer customising a singleton's initial value via `schema.templates` maps over the tagged
  template (spreading it preserves the tag, so it stays out of create menus); constructing a
  fresh untagged template instead expresses "make this type creatable". The developer's
  construction carries the semantics — no id heuristic, no non-obvious edge.

### 3.4 Context injection

`resolveSource` returns `source.document.actions` / `badges` / `inspectors` /
`unstable_fieldActions` / `unstable_languageFilter` / `comments.enabled` / `askToEdit.enabled` as
wrappers that spread a `partialContext` into the config context before running the reducer chain.
Extend each wrapper to inject the singleton id first:

```ts
const getSingletonId = (partialContext: {documentId?: string; schemaType?: string}) => {
  const {documentId, schemaType} = partialContext
  if (!documentId) {
    return undefined
  }
  const definition = singletonByDocumentId.get(getPublishedId(documentId))
  if (!definition) {
    return undefined
  }
  if (schemaType && definition.schemaType !== schemaType) {
    // Document id claimed by a singleton of a different type — a
    // misconfiguration worth surfacing, but not worth crashing over.
    if (isDev) {
      console.warn(/* … definition id, expected vs actual type … */)
    }
    return undefined
  }
  return definition.id
}

// in each wrapper:
context: {...context, ...partialContext, singleton: getSingletonId(partialContext)}
```

Using `getPublishedId` means drafts and release versions of the singleton document register
correctly. Because the lookup happens centrally, every surface that resolves document config —
structure panes, presentation, custom tools — gets `context.singleton` for free, regardless of how
the document was opened. No pane-level plumbing.

### 3.5 Terminal `duplicate` filter

In the `document.actions` wrapper, after the user reducer chain (same shape the pivoted
implementation landed in `xon`, retargeted at the registry):

```ts
actions: (partialContext) => {
  const singleton = getSingletonId(partialContext)
  const userResolved = resolveConfigProperty({
    config,
    context: {...context, ...partialContext, singleton},
    initialValue: initialDocumentActions,
    propertyName: 'document.actions',
    reducer: documentActionsReducer,
  })
  // Built-in singleton filter — runs after every user resolver so it cannot
  // be bypassed by reintroducing the duplicate action via `document.actions`.
  return singleton ? userResolved.filter((action) => action.action !== 'duplicate') : userResolved
}
```

Placing this in `prepareConfig` (not `structureTool.ts`) is deliberate: user resolvers compose
_inside_ the chain and therefore cannot reintroduce `duplicate` for a singleton, and non-structure
surfaces get the same guarantee.

**Only `duplicate` is filtered — delete, unpublish, and discard remain available.** This is a
deliberate decision, not an omission: deleting a singleton document is a legitimate "reset" (the
structure still points at the fixed id, and editing recreates the document), whereas duplication
mints a new document of a type the developer has declared singleton-ish. Third-party singleton
plugins commonly hide delete too, so migrating developers will ask about this — state the
rationale in the spec, docs, and skill. Developers who want delete hidden can filter it themselves
via `document.actions` using `context.singleton`.

---

## 4. Structure tool changes (`packages/sanity/src/structure/structureBuilder/`)

`StructureContext extends Source`, so `context.document.singletons` is available with zero
plumbing.

### 4.1 `util/getSingletonDefinition.ts`

Adapted from the pivoted implementation's helper of the same name, now reading the registry:

```ts
export function getSingletonDefinition(
  context: StructureContext,
  singletonId: string,
): SingletonDefinition {
  const definition = context.document.singletons.find((singleton) => singleton.id === singletonId)
  if (!definition) {
    throw new SerializeError(
      `No singleton with id "${singletonId}" found. Did you add it to \`document.singletons\`?`,
      [],
      singletonId,
    )
  }
  return definition
}
```

All three builder helpers share it, keeping error messages consistent.

### 4.2 `DocumentBuilder.singleton()` (`Document.ts`)

```ts
singleton(singletonId: string): DocumentBuilder {
  const definition = getSingletonDefinition(this._context, singletonId)
  const builder = this.schemaType(definition.schemaType).documentId(definition.documentId)
  // Pin the singleton's own template (identified by its `singleton` tag, so a
  // user replacement that preserves the tag is still found) so the singleton's
  // initial value applies deterministically even when the type has multiple
  // templates. Guarded so a developer who removed the template outright isn't
  // left with a "template not defined" warning on every open.
  const template = this._context.templates.find(
    (candidate) => candidate.singleton === definition.id,
  )
  if (template) {
    return builder.initialValueTemplate(template.id)
  }
  return builder
}
```

Builders are clone-based, so `.singleton(id).documentId('override')` works and the override wins —
document this in the JSDoc. The pinned `initialValueTemplate` is likewise overridable (see the
"residual sharp edge" note in the preamble for why it's set at all).

### 4.3 `ListItemBuilder.singleton()` (`ListItem.ts`)

```ts
singleton(singletonId: string): ListItemBuilder {
  const definition = getSingletonDefinition(this._context, singletonId)
  const schemaType = this._context.schema.get(definition.schemaType)
  const fallbackTitle =
    definition.id === definition.schemaType
      ? schemaType?.title || startCase(definition.id)
      : startCase(definition.id)
  return this.id(definition.id)
    .title(definition.title ?? fallbackTitle)
    .icon(definition.icon ?? schemaType?.icon)
    .schemaType(definition.schemaType)
    .child(this._context.getStructureBuilder().document().singleton(definition.id))
}
```

Title policy: `definition.title` wins when provided. Otherwise, for the shorthand case
(`id === schemaType`) the schema type's title is the natural label; when multiple singletons share
a type, the schema type title would collide (two "Settings" items), so the definition id is
start-cased instead. Icon: `definition.icon`, falling back to `schemaType?.icon` the same way
`getDocumentTypeListItem` does. All defaults overridable by chaining.

### 4.4 `ListBuilder.singletons()` (`List.ts`)

```ts
singletons(singletonIds: string[]): SingletonListBuilder {
  const items = singletonIds.map((singletonId) =>
    this._context.getStructureBuilder().listItem().singleton(singletonId),
  )
  return this.items([...(this.spec.items ?? []), ...items])
}
```

Sugar for appending; callers still set `.id()`/`.title()` on the list. State this in JSDoc.

**Return type: `SingletonListBuilder`, a `ListBuilder` without `items`.** `ListBuilder.items()`
replaces the whole items array, so `.singletons([...]).items([...])` would silently discard the
singleton items. Rather than documenting that footgun, remove it at the type level: the runtime
object is still a plain `ListBuilder` (no new class), but `singletons()` is declared to return a
mapped type that omits `items` and keeps the omission sticky across further chaining (a plain
`Omit<ListBuilder, 'items'>` would leak, because every chainable method is typed to return
`ListBuilder`, resurrecting `items`):

```ts
/**
 * A `ListBuilder` with the `items` method removed at the type level.
 *
 * Returned by `ListBuilder.singletons()`: calling `.items()` afterwards would
 * replace the whole items array and silently discard the singleton items, so
 * the type prevents it. Call `.items()` before `.singletons()`, or use
 * `S.listItem().singleton()` inside a regular `.items()` array, when mixing
 * singletons with other items.
 *
 * @public
 */
export type SingletonListBuilder = {
  [Key in keyof Omit<ListBuilder, 'items'>]: ListBuilder[Key] extends (
    ...args: infer Args
  ) => ListBuilder
    ? (...args: Args) => SingletonListBuilder
    : ListBuilder[Key]
}
```

Two integration points to verify (both confirmed against current code):

- **Assignability.** `SingletonListBuilder` lacks `items`, so it is not structurally assignable to
  `ListBuilder`. Add it to the `CollectionBuilder` union in `StructureNodes.ts` (which feeds
  `Child`), so `S.listItem().child(S.list().singletons([...]))` type-checks. Top-level usage is
  unaffected — `StructureResolver` returns `unknown`.
- **Serialization.** `maybeSerializeListItem` / pane resolution operate on the runtime object,
  which remains a `ListBuilder`; only the declared type narrows. `serialize` and `getItems` are
  preserved by the mapped type (they don't return `ListBuilder`).

Calling `.singletons()` repeatedly still appends (the method survives the mapped type and keeps
returning `SingletonListBuilder`).

### 4.5 Default content list filtering (`documentTypeListItems.ts`)

In `getDocumentTypes(context)`, additionally filter out any type name present in the singleton
registry:

```ts
const singletonSchemaTypeNames = new Set(
  context.document.singletons.map((singleton) => singleton.schemaType),
)
  // …existing filters…
  .filter((n) => !singletonSchemaTypeNames.has(n))
```

Rule: a schema type is hidden from the **implicit** default content list if at least one
singleton uses it. This is deliberately blunt but predictable; a developer sharing a type between
singletons and ordinary documents opts the ordinary documents back in explicitly with
`S.documentTypeList(typeName)`, which is never filtered (explicit usage always wins). Document the
trade-off.

Unlike the pivoted implementation, no dev-mode warning is emitted for
`S.documentTypeList(<singleton type>)`: under the registry model a document type list over a
shared schema type is a legitimate structure (it lists the non-singleton documents), so the
warning would misfire. Structure builder tests from `mmy` are adapted accordingly.

---

## 5. Reuse from the pivoted implementation (`tu..wr`)

| Revision                                                                            | Fate under this plan                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mkl` (schema `singleton` field in `@sanity/types` / `@sanity/schema`)              | Dropped entirely — the registry model makes no schema changes.                                                                                                                                                                                                                                                                                                                                                                                                         |
| `xon` (validation + template filter + terminal duplicate filter in `prepareConfig`) | Structure carries over; validation retargets the registry (adds `id` uniqueness, keeps `documentId` shape/uniqueness checks verbatim); the template filter **moves** from `schema.templates` initial value to `initialTemplatesResponses` (§3.3); the terminal duplicate filter swaps `schema.get(type)?.singleton` for the registry lookup and gains context injection. Its test suite (`prepareConfig.singletons.test.ts`, 248 lines) is a strong starting skeleton. |
| `mzm` (builder helpers + `getSingletonDefinition` + tests)                          | Largely reusable; helpers change signature from schema-type-name to definition id, and `DocumentBuilder.singleton` gains the pinned `initialValueTemplate`.                                                                                                                                                                                                                                                                                                            |
| `mmy` (default list filtering + warning)                                            | Filtering logic reusable with the registry-derived set; drop the `documentTypeList` warning (§4.5).                                                                                                                                                                                                                                                                                                                                                                    |
| `wr` (docs, dev-studio example, `sanity-singletons` skill)                          | Rewrite for the registry API; the skeleton (SKILL.md structure, `dev/test-studio` wiring via `schema/singletonSettings.ts` + `structure/resolveStructure.ts`, `docs/CORE_CONCEPTS.md` section) carries over.                                                                                                                                                                                                                                                           |

---

## 6. Tests

### 6.1 Config (`packages/sanity/src/core/config/__tests__/`)

`singletonsReducer.test.ts`:

- String shorthand expands to a full definition.
- Object definitions without `id` inherit `documentId` — in the array form and in
  resolver-function output alike.
- Array + resolver-function + array composition; resolvers receive normalised definitions only.
- Non-array/non-function input throws with `getPrintableType` message.

`prepareConfig.singletons.test.ts` (adapting `xon`'s suite):

- Unknown `schemaType` → config error; non-document `schemaType` → config error.
- Duplicate `id` → single aggregated error naming every offender (including an explicit `id`
  colliding with another definition's inherited one); same for `documentId`.
- Invalid `documentId` (`drafts.` prefix, `versions.` prefix, empty, illegal characters) → error.
- Two singletons sharing a `schemaType` (distinct `id`/`documentId`) resolve successfully.
- Resolved definitions exposed on `source.document.singletons`.
- **Templates**: `source.templates` contains one tagged template per definition (`id` and
  `singleton` both the definition id; value from `definition.initialValue ??
schemaType.initialValue`) and no plain per-type template for singleton-claimed types;
  `staticInitialValueTemplateItems` excludes tagged templates; an untagged user-defined template
  for the same schema type (any id, including the type name) is offered;
  `resolveNewDocumentOptions({type: 'global'})` reflects all of this.
- **Tag semantics pinned**: a `schema.templates` resolver that maps over the tagged template
  (spreading it to customise `value`) keeps it filtered; template validation rejects an untagged
  template reusing a definition id, duplicate `singleton` tags, and tags referencing unknown
  definitions.
- **Context injection**: `document.actions` user resolver receives `context.singleton` for the
  singleton's published id, its draft id, and a version id; `undefined` for unrelated documents;
  `undefined` (plus dev warning) when documentId matches but schemaType doesn't.
- **Duplicate filter**: removed when singleton resolves; kept otherwise; a user resolver that
  re-adds `duplicate` for a singleton is still filtered (terminal guarantee).
- Badges/inspectors/fieldActions/comments/askToEdit contexts receive the same `singleton` value.
- `defineSingleton` returns its input unchanged (identity) and type-checks a full definition.

### 6.2 Structure builder (`packages/sanity/src/structure/structureBuilder/__tests__/`)

Adapting `mzm`/`mmy` suites:

- `Document.singleton.test.ts`: sets schemaType/documentId from the registry and pins the
  singleton's tagged template (found by tag, not id); no pin when the tagged template was removed;
  throws `SerializeError` on unknown id; later `.documentId()`/`.initialValueTemplate()` override.
- `ListItem.singleton.test.ts`: default id/title/child; `definition.title`/`definition.icon` win
  when provided; shorthand title uses schema type title; shared-type singletons get start-cased
  definition-id titles; overrides work.
- `List.singletons.test.ts`: composes items; appends to previously declared `.items()`; repeated
  `.singletons()` calls append.
- **Intent/deep-link**: a serialized list built with `S.list().singletons([...])` answers
  `canHandleIntent('edit', {id: <documentId>, type: <schemaType>})`, so search results and deep
  links land on the singleton pane rather than the fallback editor. (The config-level tests in
  §6.1 separately prove `context.singleton` and the duplicate filter apply regardless of the
  route taken, since the lookup is central.)
- `documentTypeListItems.singleton.test.ts`: singleton schema types filtered from defaults;
  explicit `S.documentTypeList()` unfiltered; shared type disappears from defaults when any
  singleton claims it.

### 6.3 Type surface

- `packages/@repo/test-dts-exports/test/fixtures/sanity.test-d.ts`: `SingletonDefinition`,
  `UnresolvedSingletonDefinition`, `SingletonsResolver`, `defineSingleton`; and
  `SingletonListBuilder` in the structure fixture. `DocumentPluginOptions.singletons` remains
  optional (existing plugin literals still type-check).
- A `*.test-d.ts` assertion that `S.list().singletons([...])` has no `items` member — including
  after further chaining (e.g. `.singletons([...]).title('x')`) — while `.items()` **before**
  `.singletons()` still type-checks, and the result is accepted by `S.listItem().child()`.
- Regenerate `packages/sanity/test/__snapshots__/exports.test.ts.snap` via `pnpm test -- -u`.

### 6.4 Verification commands

`pnpm build && pnpm test` per the repo guide; targeted runs via
`pnpm vitest run --project=sanity <path>` while iterating.

---

## 7. Docs, dev studio, LLM skill

- `dev/test-studio`: registry-based example — one shorthand singleton plus two singletons sharing
  a schema type (the case the pivot couldn't express), surfaced via `S.list().singletons([...])`
  in `structure/resolveStructure.ts`.
- `docs/CORE_CONCEPTS.md`: rewrite the section from `wr` for the registry API. Must cover:
  - Why the definition id exists (stable semantic identity; workspace-portable structure code).
  - The shared-schema-type escape hatch (an explicit untagged template restores creation — any
    id works; spreading the tagged singleton template customises its initial value and stays
    filtered).
  - Why delete/unpublish are _not_ filtered (reset semantics) and how to filter them in userland
    via `context.singleton` if desired.
  - That explicit document type lists over a shared type intentionally include the singleton
    documents.
  - The `context.singleton` extension point for plugin authors.
- `.agents/skills/sanity-singletons/SKILL.md`: rewrite from `wr`, seeding correct usage and
  migration guidance from userland patterns and from the schema-first pivot API.
- JSDoc on `DocumentPluginOptions.singletons`, `SingletonDefinition`, `defineSingleton`,
  `SingletonListBuilder`, the three builder methods, and the new context property.

---

## 8. Risks and open questions

| #   | Risk / question                                                              | Position                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `duplicate` reintroduced by a user resolver                                  | Eliminated: terminal filter in `prepareConfig` (§3.5), proven shape from `xon`.                                                                                                                                                                   |
| 2   | Template filtering vs shared schema types                                    | Resolved by filtering only auto-generated entries at the new-document-options layer (§3.3); escape hatch is an explicit template. Needs prominent docs.                                                                                           |
| 3   | Singleton opens empty when its type has multiple templates                   | Mitigated by `S.document().singleton()` pinning `initialValueTemplate` (§4.2). Panes reached by intent/deep-link without a template param fall back to existing behaviour — acceptable, matches non-singleton documents.                          |
| 4   | Default content list filter hides shared types too aggressively              | Accepted for predictability; explicit `S.documentTypeList()` opt-in documented (§4.5).                                                                                                                                                            |
| 5   | `documentId` collides with an existing non-singleton document in the dataset | Undetectable at config time (requires a data read). Document that adopting a `documentId` claims that id; the injected context/action filtering applies to whatever document holds it.                                                            |
| 6   | Multiple workspaces/sources                                                  | Registry is per-source, matching `document.actions` semantics; no cross-source coordination.                                                                                                                                                      |
| 7   | Spec originally said "remove from the templates array"                       | Deliberately changed to filtering new-document options instead, because the literal reading breaks initial values — the exact difficulty that forced the previous pivot. The spec has been updated to describe the new-document-options approach. |
| 8   | Unhandled/dangling singletons                                                | Per spec: no warning (structure resolves lazily); covered by docs + skill.                                                                                                                                                                        |
| 9   | `SingletonListBuilder` mapped type in the public dts                         | The mapped type must survive the tsdown dts build legibly; if the emitted declaration degrades (e.g. fully expanded members), fall back to a hand-written interface listing the retained methods. Verified by the dts-exports fixtures.           |

---

## 9. Suggested PR breakdown

1. **feat(config): singleton registry** — types + `defineSingleton` (§2), reducer (§3.1),
   validation + `Source` exposure (§3.2), dts-exports + export snapshot. No behaviour change yet.
2. **feat(config): singleton creation guards** — new-document-options filtering (§3.3), context
   injection (§3.4), terminal duplicate filter (§3.5). Tests §6.1.
3. **feat(structure): singleton builder helpers** — §4.1–4.4, including `SingletonListBuilder`
   and the `CollectionBuilder` union addition. Tests §6.2 (builders + intent), §6.3 (test-d).
4. **feat(structure): hide singleton types from default content list** — §4.5. Tests §6.2 (list).
5. **docs(singletons): docs, dev-studio example, LLM skill** — §7. Can run parallel to 3–4.

Each PR passes `pnpm build && pnpm test && pnpm lint` in isolation; the feature lights up
end-to-end after PR 4.
