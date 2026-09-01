---
name: sanity-singletons
description: Configure singleton documents in a Sanity Studio using the document.singletons registry. Use when a developer wants a fixed-id document (settings, navigation, footer) edited in place, hidden from the default content list, with no "create new" or "duplicate" affordances — or when migrating a userland singleton implementation or a third-party singleton plugin (e.g. sanity-plugin-singleton-management) to the first-class API.
---

# Sanity Singletons

A "singleton" is a document with a fixed id for which only one instance should exist. Common examples: site settings, navigation, footer content. Studio supports singletons as a first-class primitive via the `document.singletons` configuration registry plus a small set of Structure Tool helpers.

## When to use this skill

- A developer asks how to create a "settings document" or "singleton".
- A studio configuration needs a `document.singletons` registry entry.
- Structure Tool needs to render a singleton as a list item or document pane.
- You're migrating an existing userland singleton implementation to the first-class API.
- You're migrating from a third-party singleton plugin such as `sanity-plugin-singleton-management` (or its predecessor `sanity-plugin-singleton-tools`).

## Registering a singleton

Singletons are registered in configuration, **not** on the schema type. A singleton definition binds a _definition id_ to a _document id_ and a _schema type_:

```ts
import {defineConfig, defineSingleton} from 'sanity'

export default defineConfig({
  schema: {
    types: [/* siteSettings and campaign are ordinary document types */],
  },
  document: {
    singletons: [
      // String shorthand — expands to
      // {id: 'siteSettings', documentId: 'siteSettings', schemaType: 'siteSettings'}
      'siteSettings',

      // Definition object. `defineSingleton` is an optional typed identity
      // helper; a plain object literal works too. `id` is omitted here, so it
      // inherits each `documentId`.
      defineSingleton({
        documentId: 'springCampaign',
        schemaType: 'campaign',
        title: 'Spring campaign', // optional display metadata
        initialValue: {season: 'spring'}, // optional per-singleton initial value
      }),
      defineSingleton({
        documentId: 'summerCampaign',
        schemaType: 'campaign',
        title: 'Summer campaign',
        initialValue: {season: 'summer'},
      }),
    ],
  },
})
```

Key facts:

- **`defineSingleton` produces a singleton _definition_, not a document schema.** The schema type it references is defined separately with `defineType` and needs no singleton-specific configuration.
- **Multiple singletons may share a schema type** (like the two campaigns above), each with its own `title`, `icon`, and `initialValue` (falling back to the schema type's), and a shared schema type may also back ordinary documents.
- **The definition id is the singleton's stable identity**, and it is **optional** — it inherits `documentId` when omitted. Structure code references it (`S.listItem().singleton('springCampaign')`). Set it explicitly only to be verbose, to guard against future collisions, or to address a singleton universally when different workspaces or environments map it to different document ids.
- A resolver function is also accepted: `singletons: (prev, context) => [...prev, ...]`. Resolvers only ever receive fully resolved definitions (string shorthands are expanded first).

Validation at config-resolution time (all failures aggregate into one `ConfigResolutionError`):

- `id`: non-empty, unique across definitions (inherited ids count — an explicit id may not collide with another definition's inherited one).
- `documentId`: non-empty, unique, published-id shaped (no `drafts.` / `versions.` prefix, only `[a-zA-Z0-9._-]`).
- `schemaType`: must name an existing document type. Need not be unique.
- Templates: an untagged template must not reuse a definition id (the generated singleton template claims it); at most one template may carry a given `singleton` tag; tags must reference registered definitions.

## What Studio does automatically

1. **Generates a dedicated initial value template per singleton** — tagged with the definition id via `ResolvedTemplate.singleton`, value from `definition.initialValue ?? schemaType.initialValue` — instead of the plain per-type template, and **removes tagged templates from every "create new" surface** (global create menu, structure panes, reference inputs). The tagged template stays in `source.templates`, so opening the singleton before it exists still applies its initial value.
2. **Injects `context.singleton`** (the definition id) into document-scoped configuration contexts — `document.actions`, `badges`, `inspectors`, field actions, `comments.enabled`, `askToEdit.enabled` — looked up by _published_ document id, so drafts and release versions of the singleton match, however the document was opened (structure, intent, deep link, search).
3. **Filters the `duplicate` document action**, after all user resolvers run, so it cannot be reintroduced via `document.actions`.
4. **Hides the schema type from the implicit default content list** in Structure Tool.

What Studio deliberately does **not** do:

- **Delete, unpublish, and discard stay available.** Deleting a singleton is a legitimate "reset": structure still points at the fixed id, and editing recreates the document. To hide delete as well: `document: {actions: (prev, context) => (context.singleton ? prev.filter((action) => action.action !== 'delete') : prev)}`.
- **Explicit structure is never filtered.** `S.documentTypeList(typeName)` works for singleton schema types and intentionally lists the singleton documents alongside ordinary ones.
- **No warning for "dangling" singletons.** Structure resolves lazily, so Studio cannot detect a registered singleton that was never added to structure. Always pair a registry entry with a structure entry.

## Surfacing singletons in Structure Tool

Registered singletons are hidden from the default content list, so add them explicitly. All helpers are keyed by **definition id** and throw a `SerializeError` for unknown ids.

```ts
// 1. Highest level: a list of singletons.
S.list().id('singletons').title('Singletons').singletons(['siteSettings', 'springCampaign'])

// 2. A single list item (title/icon default from the definition, then the schema type).
S.listItem().singleton('siteSettings')

// 3. Low level: just the document pane.
S.listItem().title('Settings').id('settings').child(S.document().singleton('siteSettings'))
```

Composition rules:

- Every default is overridable by normal chaining: `S.listItem().singleton('siteSettings').title('Global settings')`, `S.document().singleton('siteSettings').documentId('override')`.
- `S.document().singleton()` pins the singleton's tagged initial value template so its initial value applies even when the type has several templates; override with `.initialValueTemplate(...)`.
- **`S.list().singletons()` returns a builder without `.items()`.** Calling `.items()` afterwards would replace the whole array and silently drop the singleton items, so the type forbids it. Call `.items([...])` _before_ `.singletons([...])`, or put `S.listItem().singleton()` entries inside a regular `.items()` array. Repeated `.singletons()` calls append.

## Shared schema types and the "create new" escape hatch

Declaring a singleton over schema type `T` replaces `T`'s plain per-type template with the singleton's tagged template, so `T` disappears from create menus. If ordinary `T` documents should stay creatable, define an explicit untagged template — any id works, including `T` itself, since the plain template no longer exists:

```ts
schema: {
  templates: (prev) => [
    ...prev,
    {id: 'campaign-non-singleton', title: 'Campaign', schemaType: 'campaign', value: {}},
  ],
},
```

The `singleton` tag carries the semantics: templates with it are never create options; templates without it always are. The tag lives on `ResolvedTemplate` — the resolved shape in `source.templates` — not on the authoring `Template` type, so developers never set it directly. To customise a singleton's initial value via `schema.templates`, find the singleton's template by id (equal to the definition id) and spread it (`{...template, value}`) — the spread preserves the tag at runtime, keeping it out of create menus. (Setting `initialValue` on the definition itself is usually simpler.)

## Reading singletons from plugins

- The resolved registry is available at `source.document.singletons` (`useSource().document.singletons`).
- Document-scoped resolvers receive `context.singleton` (the definition id; `documentId` and `schemaType` are already on the context).

## Migrating a userland singleton setup

Typical userland implementations combine three pieces; each is subsumed by the registry:

| Userland technique                                               | First-class replacement                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `document.newDocumentOptions` filtering out the type             | Automatic (tagged singleton templates are never create options) |
| `document.actions` filtering `duplicate`                         | Automatic (terminal, non-bypassable)                            |
| Custom structure with `S.document().schemaType(x).documentId(y)` | Keep, or simplify to `S.listItem().singleton(id)`               |

Migration steps:

1. Add the singleton to `document.singletons` (string shorthand when id, document id, and type name are all identical).
2. Delete the manual `newDocumentOptions` and `duplicate` filtering for that type.
3. Replace the manual structure wiring with `S.listItem().singleton(id)` (or keep the manual wiring — it remains fully supported; ensure the `documentId`/`schemaType` pair matches the definition so `context.singleton` resolves).
4. If the schema type is _only_ used by the singleton, nothing else changes. If it's shared with ordinary documents, add an explicit untagged template to keep them creatable, and `S.documentTypeList(typeName)` to keep them listed.

## Migrating from `sanity-plugin-singleton-management`

[`sanity-plugin-singleton-management`](https://github.com/rcmaples/sanity-plugin-singleton-management) (a maintained fork of `sanity-plugin-singleton-tools`, with an identical API) marks schema types with `options: {singleton: true}`, registers a `singletonTools()` plugin that filters new-document options and document actions, and ships three structure helpers. Every piece maps directly onto the first-class API:

| Plugin technique                                                 | First-class replacement                                                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `options: {singleton: true}` on the schema type                  | A `document.singletons` entry (delete the schema option — it has no first-class meaning)                       |
| `singletonTools()` plugin in `plugins: [...]`                    | Delete (creation and duplicate prevention are automatic)                                                       |
| `singletonDocumentListItem({S, context, type, title, id, icon})` | `S.listItem().singleton(<definition id>)` (title/icon defaults come from the definition, then the schema type) |
| `singletonDocumentListItems({S, context})`                       | `context.document.singletons.map((s) => S.listItem().singleton(s.id))`                                         |
| `filteredDocumentListItems({S, context})`                        | `...S.documentTypeListItems()` — singleton schema types are excluded automatically                             |

**Document id compatibility (the critical detail):** the plugin's document id defaults to the schema type name (`S.document().schemaType(type).id(id ?? type)`), so a plugin singleton `mySingleton` edits the document `mySingleton`. The string shorthand (`singletons: ['mySingleton']`) produces exactly that document id — existing content keeps working with no data migration. If the plugin call passed an explicit `id`, carry it over as the definition's `documentId`.

Migration steps:

1. For each schema type with `options: {singleton: true}`: remove the option, and register the type in `document.singletons` — the string shorthand when the plugin used the default id, otherwise `{documentId: <the explicit id>, schemaType: <type>}`.
2. Remove `singletonTools()` from `plugins` and uninstall the package.
3. Replace the structure helpers per the table above. The plugin passed `{S, context}` around; the first-class helpers need neither — they read the registry from the builder's own context.
4. Note a deliberate behavioural difference: the plugin **allowlists** actions (`publish`, `discardChanges`, `restore`), hiding delete and unpublish. The first-class API only removes `duplicate` — deleting a singleton is a legitimate "reset". To preserve the plugin's stricter behaviour, add:

   ```ts
   document: {
     actions: (prev, context) =>
       context.singleton
         ? prev.filter(({action}) =>
             ['publish', 'discardChanges', 'restore'].includes(action as string),
           )
         : prev,
   },
   ```

   Only add this if the stricter behaviour is genuinely wanted — otherwise prefer the first-class default.

5. If the plugin's `singletonDocumentListItem` was used to render **multiple singletons of the same schema type** (its `title`/`id` overrides), register one definition per document id — `{documentId, schemaType, title}` — which is the first-class model for exactly that case.

## Reference

- Config types & validation: `packages/sanity/src/core/config/types.ts`, `packages/sanity/src/core/config/prepareConfig.tsx`
- Structure helpers: `packages/sanity/src/structure/structureBuilder/{Document,ListItem,List}.ts`
- Working example: `dev/test-studio/schema/singletons.ts`, `dev/test-studio/structure/resolveSingletons.ts` (registry shared with `dev/studio-e2e-testing`, which reuses the structure), `dev/test-studio/structure/resolveStructure.ts`
- Worked migration of userland singletons over _shared_ schema types (escape-hatch templates in `dev/test-studio/initialValueTemplates/index.ts`, explicit `S.documentTypeListItem()` opt-back-ins): the `circular`, `grrm`, and `jrr-tolkien` definitions in `dev/test-studio/structure/resolveSingletons.ts`
