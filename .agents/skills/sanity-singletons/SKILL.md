---
name: sanity-singletons
description: Configure singleton documents in a Sanity Studio. Use when a developer wants exactly one document of a given schema type, hidden from the default content list, with no "create new" or "duplicate" affordances.
---

# Sanity Singletons

A "singleton" is a document for which only one instance should ever exist. Common examples: site settings, navigation, footer content. Studio supports singletons as a first-class primitive via the `singleton` schema configuration plus a small set of Structure Tool helpers.

## When to use this skill

- A developer asks how to create a "settings document" or "singleton".
- A schema definition needs to opt into singleton behaviour.
- Structure Tool needs to render a singleton as a list item or document pane.
- You're migrating an existing userland singleton implementation to the first-class API.

## Schema configuration

Mark a document schema type as a singleton via the `singleton` block:

```ts
import {defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  type: 'document',
  singleton: {
    documentId: 'siteSettings',
  },
  fields: [
    /* … */
  ],
})
```

`singleton.documentId` is the static document id Studio will use to read/write the singleton. It must be:

- A non-empty string.
- A published document id (no `drafts.` or `versions.` prefix).
- Unique across all singleton schema types in the source.

These rules are enforced at config-resolution time. Violations raise a `ConfigResolutionError` listing every offending schema type so the user can fix all problems in one pass.

A schema type is **either** a singleton or an ordinary document type — it cannot be both. If a developer needs both shapes, copy the schema definition with a new `name` and the `singleton` property omitted; `defineType` returns a plain object that can be spread:

```ts
const settingsBase = defineType({
  name: 'settings',
  type: 'document',
  singleton: {documentId: 'settings'},
  fields: [
    /* … */
  ],
})

const settingsArchive = {
  ...settingsBase,
  name: 'settingsArchive',
  singleton: undefined,
}
```

## What Studio does automatically

Once a schema type opts into singleton behaviour:

1. The auto-generated initial value template for that type is removed, so it does not appear in the "new document" UI.
2. The `duplicate` document action is filtered out for that schema type. The filter is terminal — it cannot be re-introduced by a user `document.actions` resolver.
3. `S.defaults()` (the implicit content list used when no `structure` resolver is provided) skips the schema type.

The compiled schema type continues to expose its singleton configuration via `schema.get(typeName)?.singleton?.documentId`. Plugins that need to know whether the current document is a singleton can read it from there inside their own `document.actions` / `document.badges` / etc. resolvers.

## Structure Tool helpers

Three new helpers, each sugar over existing Structure Tool primitives. All three throw a `SerializeError` immediately if invoked with a non-singleton or unknown schema type name, so typos surface early.

### `S.document().singleton(schemaTypeName)`

Sugar for `.schemaType(schemaTypeName).documentId(<documentId-from-schema>)`.

```ts
S.listItem().title('Settings').id('settings').child(S.document().singleton('siteSettings'))
```

Subsequent `.documentId(...)` and `.schemaType(...)` calls override the defaults, preserving the immutable-builder ergonomics of the rest of `DocumentBuilder`.

### `S.listItem().singleton(schemaTypeName)`

Higher-level sugar that produces both a list item and its child document:

```ts
S.listItem().singleton('siteSettings')
```

Defaults derived from the schema:

- `id` → schema type name.
- `title` → schema type's `title` (falling back to `startCase(typeName)`).
- `child` → `S.document().singleton(typeName)`.
- `schemaType` → schema type name.

Each default can still be overridden with the standard list-item chain.

### `S.list().singletons(schemaTypeNames)`

Highest-level helper. Appends one list item per name to the list's `items` array:

```ts
S.list().id('singletons').title('Singletons').singletons(['siteSettings', 'navigation'])
```

Like every other `S.list()` chain, the developer must still call `.id(...)` and `.title(...)` themselves. `singletons()` does not produce a complete list on its own.

## Common gotchas

- **Forgot to surface the singleton in the structure**: Studio hides singletons from the default content list, so a developer who never adds the singleton anywhere in the structure will see no UI for it. There is no automatic warning; document this clearly in any guide.
- **`S.documentTypeList(singletonType)`**: still works, but renders an awkward list with one item. Studio emits a `console.warn` in dev mode suggesting `S.listItem().singleton(...)` instead.
- **Reusing a schema for both singleton and non-singleton**: not supported. Copy the definition with a new `name`.
- **Document id collisions**: two schema types claiming the same `singleton.documentId` is rejected at config-resolution time with a clear error listing every claimant.

## Migration from userland implementations

Existing userland patterns continue to work. To adopt the new primitive:

1. Move the singleton's static document id into `schemaType.singleton.documentId`.
2. Remove any `document.newDocumentOptions` filtering for the schema type — Studio handles it.
3. Remove any `document.actions` filtering that strips `duplicate` for the schema type — Studio handles it.
4. Replace bespoke list-item wiring with `S.listItem().singleton(name)` (or `S.list().singletons([...])`).
5. Remove any `getDocumentTypeListItems()` filters that hide the singleton from the default content list — Studio handles it.

## Implementation pointers

- Schema type: `packages/@sanity/types/src/schema/definition/type/document.ts` (`DocumentDefinition.singleton`, `DocumentSingletonDefinition`).
- Compiled type: `packages/@sanity/types/src/schema/types.ts` (`BaseSchemaType.singleton`).
- Schema compilation: `packages/@sanity/schema/src/legacy/types/object.ts` (singleton survives compilation via `OVERRIDABLE_FIELDS`).
- Validation, template filter, duplicate filter: `packages/sanity/src/core/config/prepareConfig.tsx` (`validateSingletons`, the `templates` initial-value filter, the terminal `duplicate` filter on `source.document.actions`).
- Structure helpers: `packages/sanity/src/structure/structureBuilder/Document.ts`, `ListItem.ts`, `List.ts`, plus `util/getSingletonDefinition.ts`.
- Default content list filter and `documentTypeList` warning: `packages/sanity/src/structure/structureBuilder/documentTypeListItems.ts`.
