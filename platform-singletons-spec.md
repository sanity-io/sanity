# Platform singletons

It's common for developers to configure "singleton" documents in their studio. Singleton documents consist of document schema types for which only one document should ever exist; editors should be able to edit this one document in Studio, but UI affordances for listing, adding, and removing documents of that type are unnecessary.

## Key details

1. Singleton documents are given a static document id so that Studio knows which document to display, and developers know which document to fetch by id when they need to read it. This is typically implemented in userland by configuring Structure Tool to display a document with a static id: `S.document().documentId("settings")`.
2. Singleton documents are given a single schema type to adhere to. This is typically implemented in userland by configuring Structure tool to display a document with a particular schema type: `S.document().schemaType("settings")`.
3. In userland, these configurations are almost always combined: `S.document().schemaType("settings").documentId("settings")`.

## Common uses

"Settings" documents are a common example of singleton documents. Developers typically wish to establish a single settings document to store some kind of global project configuration. Editors should be able to view (and, if they are permitted to, edit) the singleton settings document, but have no need to list, add, or remove documents of that type.

## Status quo

Singletons are a very commonly employed pattern in userland. Studio provides low-level APIs today that enable singletons, but the configuration developers need to instrument can feel fragmented, adding friction to an everyday task.

There are already a handful of third-party plugins that assist developers in creating singletons. We can add little value in offering yet another helper plugin, but we can pave established cow paths, and make singletons a first-class Studio primitive.

For some idea of how singletons are implemented in userland today, take a look at:

- [sanity-plugin-singleton-management](https://github.com/rcmaples/sanity-plugin-singleton-management) - good source code reference.
- [Sanity Exchange guide by Corey Ward](https://www.sanity.io/guides/singleton-document) - good prosaic reference (slightly out of date; this guide uses the `schema.templates` configuration option to prevent new singleton documents being created, but it should instead use `document.newDocumentOptions`).

A typical singleton setup involves:

### 1. Establishing a custom structure

By default, Structure Tool infers structure from the configured schema. Without customising it, the singleton will be shown in a Document Type List, like all other schema types are.

- Filter the singleton schema type out of any Structure Tool lists that would otherwise render a Document Type List container for it.
- Create a dedicated List Item somewhere in the structure that renders a single document as its child.

### 2. Preventing the document being created

Studio provides several UI surfaces for _creating new documents_. Without configuring [`document.newDocumentOptions`](https://www.sanity.io/docs/studio/new-document-options), editors will be able to create new documents of the singleton schema type.

- Configure `document.newDocumentOptions` to filter out the singleton schema type.

### 2a. Preventing the document being duplicated

By default, all documents can be duplicated using the "duplicate" document action. Without [configuring `document.actions`](https://www.sanity.io/docs/studio/document-actions), editors will be able to create new documents of the singleton schema type by duplicating them.

- Configure `document.actions` to filter out the "duplicate" document action for the singleton schema type.

## Proposal

Let's make singletons a first-class Studio primitive. All techniques used today to instrument singletons in userland will continue to work, but Studio will pave the established cow paths, making it even simpler to create singletons.

Developers will establish a singleton definition by adding it to the `document.singletons` configuration. Studio will then automatically:

1. Prevent the document being created via "create new" surfaces. For schema types claimed by a singleton, the plain per-type initial value template is not generated; instead, each singleton definition gets its own template, tagged with the definition id via a new optional `singleton` property on `Template`, whose value is `definition.initialValue ?? schemaType.initialValue`. Tagged templates are removed from the initial value of `document.newDocumentOptions` (resolved by `resolveNewDocumentOptions` in `packages/sanity/src/core/config/prepareConfig.tsx`) — the singleton document has a fixed id, so its template is never a "create new" option — but remain in the templates array, which also drives initial value resolution when a singleton document is opened for the first time. New document options derived from untagged templates (including templates the developer explicitly defines via `schema.templates`, under any id) are never removed — this is the escape hatch that keeps a schema type shared between singletons and ordinary documents creatable. The `singleton` tag also makes the singleton subset of templates mechanically identifiable, anticipating future serialisation of templates to enrich other editing surfaces (e.g. Content Agent) with an understanding of singletons and their initial values.
2. Prevent the document being duplicated by filtering the document's actions to remove any actions that allow document creation (such as "duplicate"). Only creation-oriented actions are filtered: delete, unpublish, and discard remain available. Deleting a singleton document is a legitimate "reset" — the structure still points at the fixed document id, and editing recreates the document — whereas duplication mints a new document of a type the developer has declared should only exist as the singleton. Developers who prefer to hide delete can filter it themselves via `document.actions` using `context.singleton`.
3. Prevent the document type being listed implicitly in Structure Tool.

Developers will then explicitly add the singleton to the structure. We'll add new Structure Tool functions to make it easier to work with singletons, but these are ultimately sugar built on top of the existing functions (like `S.document` and `S.list`).

### Configuration contexts

In order to allow document actions to be filtered based on whether a given document is being viewed as a singleton, the `DocumentActionsContext` type must be extended to include an optional `singleton` property:

`packages/sanity/src/core/config/types.ts`

```ts
export interface DocumentActionsContext extends ConfigContext {
  /**
   * The singleton definition id, if the document is being viewed as a
   * singleton.
   *
   * `DocumentActionsContext` already includes `documentId` and `schemaType`
   * properties, so it's redundant to provide the full `SingletonDefinition`.
   */
  singleton?: string

  // existing properties…
}
```

This will enable both the system's automatic filtering of the "duplicate" action, and third-party developers own customisations.

For consistency, the singleton property will also be added to the other document-related configuration contexts (e.g. `DocumentBadgesContext`).

### Developer-facing configuration

#### Establishing a singleton

We'll add a `document.singletons` configuration option (to `DocumentPluginOptions`) that resolves an array of singleton definitions. A singleton definition consists of a document id and a schema type, plus an optional singleton definition id (inheriting the document id when omitted), optional display metadata (`title`, `icon`) used by the Structure Tool helpers, and an optional `initialValue` used by the singleton's generated template. This architecture allows schema types and singletons to be isolated, meaning a single schema type can be used for multiple singletons and non-singletons if desired — each with its own initial value, when they need to differ.

Developers only need to set `id` if they wish to be verbose, wish to prevent collisions in the future, or have singleton definitions targeting different document ids in different workspaces or environments that they wish to address universally. In resolved form (e.g. on `source.document.singletons`), `id` is always present.

If a duplicate singleton definition id or document id is encountered at resolution time, configuration resolution will fail with a `ConfigResolutionError`.

`packages/sanity/src/core/config/types.ts`

```ts
interface SingletonDefinition extends Pick<BaseSchemaType, 'title' | 'icon' | 'initialValue'> {
  /**
   * The singleton _definition_ id: the stable identity by which structure
   * code references the singleton. Inherits `documentId` when omitted at
   * configuration time. Establishing a discrete id for the definition
   * decouples the singleton's identity from its schema type and document id:
   *
   * - Multiple singletons can share a schema type if necessary.
   * - Structure code (often shared across workspaces) can reference a
   *   singleton by a value that stays constant while each workspace maps it
   *   to a different document id (e.g. per-dataset or per-environment ids).
   * - Developers can change `documentId` or `schemaType` over time while
   *   preserving the semantic identity of the singleton.
   *
   * Must be unique across singleton definitions.
   */
  id: string

  /**
   * The singleton _document_ id.
   *
   * Must be unique across singleton definitions.
   */
  documentId: string

  /**
   * The name of the schema type used by the singleton.
   */
  schemaType: string
}

/**
 * The developer-provided form: a definition whose `id` is optional (it
 * inherits `documentId`), or — when `id`, `documentId`, and `schemaType` are
 * all identical — that value as a single string.
 */
type UnresolvedSingletonDefinition = (Omit<SingletonDefinition, 'id'> & {id?: string}) | string
```

The optional `title`, `icon`, and `initialValue` properties are inherited from `BaseSchemaType` (`@sanity/types`) via a `Pick` allow-list rather than being redeclared. `title` and `icon` are used as the default list item title and icon by the `S.listItem().singleton()` and `S.list().singletons()` Structure Tool functions; `initialValue` provides the value of the singleton's generated template. Each falls back to the schema type's own metadata when omitted — they override exactly what they'd otherwise inherit, so sourcing the types from `BaseSchemaType` keeps the two permanently in sync. (Structure Tool's own types cannot be reused here: the singleton registry lives in core configuration, which Structure Tool builds on top of — the reverse import would invert the package's layering.)

```ts
/**
 * Function for composing singletons.
 *
 * This function receives resolved singleton definitions
 * (`SingletonDefinition`) and may return unresolved definitions
 * (`UnresolvedSingletonDefinition`); Studio resolves the returned definitions
 * before the next resolver sees them.
 */
type SingletonsResolver = (
  prev: SingletonDefinition[],
  context: ConfigContext,
) => UnresolvedSingletonDefinition[]

export interface DocumentPluginOptions {
  /**
   * The singleton configuration, surfaced at the `document.singletons`
   * configuration path.
   *
   * If a singleton's `id`, `documentId`, and `schemaType` properties are
   * identical, they can simply be provided as a single string. Studio will
   * expand it to a full `SingletonDefinition` at runtime.
   *
   * Alternatively, a resolver function may be provided.
   */
  singletons?: UnresolvedSingletonDefinition[] | SingletonsResolver

  // existing properties…
}
```

A `defineSingleton` identity helper will also be provided, following the `defineType` / `defineConfig` / `definePlugin` convention, so developers get typing and autocomplete when declaring singletons outside a config literal. Its description must make clear that it produces a singleton _definition_ — the registry entry binding a definition id to a document id and schema type — **not** a singleton document schema (the schema type it references is defined separately with `defineType`).

Here's how a Studio configuration (typically found in `sanity.config.ts`) may look with a "settings" singleton:

```ts
import {defineConfig} from 'sanity'

export default defineConfig({
  schema: {
    types: [
      defineType({
        name: 'settingsSchema',
        type: 'document',
        fields: [], // omitted for brevity…
      }),
    ],
  },
  document: {
    singletons: [
      {
        id: 'settingsSingleton',
        documentId: 'settingsDocument',
        schemaType: 'settingsSchema',
      },
    ],
  },
})
```

Alternatively, the developer may give the singleton an identical `id`, `documentId`, and `schemaType` property ("settings") to take advantage of the simplified configuration API:

```ts
import {defineConfig} from 'sanity'

export default defineConfig({
  schema: {
    types: [
      defineType({
        name: 'settings',
        type: 'document',
        fields: [], // omitted for brevity…
      }),
    ],
  },
  document: {
    singletons: ['settings'],
  },
})
```

### Displaying a singleton in Structure Tool

After a singleton has been configured, it will be filtered out of Structure Tool by default. It must explicitly be added to the Structure Tool configuration to become accessible via structure.

Only the _implicit_ default content list is filtered. Explicit usage always wins: `S.documentTypeList(schemaTypeName)` is never filtered, and when a schema type is shared between singletons and ordinary documents, an explicit document type list over that type intentionally includes the singleton documents — explicit lists show the truth.

### Using `S.document`

The new `S.document().singleton(singletonDefinitionId)` Structure Tool function is sugar for
`S.schemaType(singletonSchemaType).documentId(singletonDocumentId)`. It retrieves a singleton
definition using the provided singleton definition id, and uses this definition to automatically
set the document's schema type and document id properties.

Its parameters and return type extends those of `S.document`, allowing developers to compose
singleton structure in a familiar way and to override defaults.

```ts
S.listItem().title('Settings').id('settings').child(S.document().singleton(singletonDefinitionId))
```

### Using `S.listItem`

The new `S.listItem().singleton(singletonDefinitionId)` Structure Tool function is a higher-level utility, producing both a list item and a child document for the provided singleton definition id. The list item's title and icon default to the definition's `title` and `icon` when provided, falling back to the schema type's metadata.

Just like `S.document`, its parameters and return type extends those of `S.listItem`, allowing developers to compose
singleton structure in a familiar way and to override defaults.

```ts
S.listItem().singleton(singletonDefinitionId)
```

### Using `S.list`

The new `S.list().singletons(arrayOfSingletonDefinitionIds)` Structure Tool function is the highest-level utility for working with singletons in Structure Tool. It provides fewer opporunities for customisation than `S.listItem.singleton()`, `S.document().singleton`, or `S.document` directly, but in return provides a very simple way to render a list of singletons.

Just like the other new utilities, its parameters extend those of `S.list`, allowing developers to compose singleton structure in a familiar way and to override defaults. `singletons()` appends to any previously declared items, so it composes with `.items()` called earlier in the chain.

Its return type, however, deliberately **omits the `items` method**. `items()` replaces the whole items array, so calling it after `singletons()` would silently discard the singleton items; removing it at the type level turns that mistake into a compile error. Developers who need to add further items after the singletons should instead include the singletons inside a regular `.items()` array using `S.listItem().singleton()`.

```ts
S.list().singletons(arrayOfSingletonDefinitionIds)
```

#### "Unhandled" singletons

As a consequence of Structure Tool automatically filtering out singletons, developers may inadvertently suppress the visibility of singletons. They may not realise they need to configure Structure Tool, make a mistake in their configuration, or simply forget to add it.

We will not warn about dangling singletons. Structure is resolved lazily, so it's not possible to detect singletons that are absent from the structure without eagerly resolving it.

However, this will be covered clearly in documentation, and LLM skills will be seeded with information on correct singleton usage.

## Migration path

It's not necessary to migrate from existing singleton implementations, because Studio will remain fully compatible with them. However, developers may wish to adopt the new singleton primitive to take advantage of the simpler configuration it permits.

Migration will be simple, given the singleton primitive builds on established userland implementation patterns. We'll additionally investigate the feasibility and value of providing LLM skills to assist with migration.
