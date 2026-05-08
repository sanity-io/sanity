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

We'll make singletons a first-class Studio primitive. All techniques used today to instrument singletons in userland will continue to work, but Studio will pave the established cow paths, making it even simpler to create singletons.

Developers will establish a singleton definition by setting their desired document id in a schema type's `singleton.documentId` configuration. Implementing the `singleton` configuration as an object gives us a place to extend the configuration in the future if needed.

To enable this, we'll add an optional `singleton.documentId` configuration option (via `DocumentDefinition` in `packages/@sanity/types/src/schema/definition/type/document.ts`) that indicates that the schema type should be treated as a singleton[^1]:

`packages/@sanity/types/src/schema/definition/type/document.ts`

```ts
/** @public */
interface DocumentSingletonDefinition {
  /**
   * The document id this singleton schema type represents.
   */
  documentId: string;
}

/** @public */
export interface DocumentDefinition extends Omit<ObjectDefinition, "type"> {
  /**
   * Control whether this schema type is a singleton.
   *
   * - Singleton schema types can only represent one document.
   * - Singleton schema types are excluded from document lists.
   *
   * See <guide URL> to learn how to add singletons to Structure Tool using the
   * `S.document().singleton()`, `S.listItem().singleton()`, or
   * `S.list().singletons()` APIs.
   */
  singleton?: DocumentSingletonDefinition;

  // existing properties…
}
```

The provided singleton definition will be reflected in `BaseSchemaType` (`packages/@sanity/types/src/schema/types.ts`), taking the same shape as `DocumentDefinition`. This will allow schema consumers to access its singleton definition.

Studio will then automatically:

1. Prevent the document being created by removing it from the templates array in `resolveSource` (`packages/sanity/src/core/config/prepareConfig.tsx`), and filtering the document's actions to remove any actions that allow document creation (such as "duplicate").
2. Prevent the document type being listed implicity in Structure Tool.

Developers must explicitly add the singleton to their structure. We'll provide new Structure Tool functions to make it easier to work with singletons, but these are ultimately sugar built on top of the existing functions (like `S.document` and `S.list`).

### Developer-facing configuration

#### Establishing a singleton

Note: If the developer wishes to use the same schema type for a non-singleton document, they will need to create a copy of the schema type with a different name and no `singleton.documentId` configuration.

Here's how a Studio configuration (typically found in `sanity.config.ts`) may look with a "settings" singleton:

```ts
import { defineConfig } from "sanity";

export default defineConfig({
  schema: {
    types: [
      defineType({
        name: "settings",
        type: "document",
        singleton: {
          documentId: "settings",
        },
        fields: [], // omitted for brevity…
      }),
    ],
  },
});
```

### Displaying a singleton in Structure Tool

After a singleton has been configured, it will be filtered out of Structure Tool by default. It must explicitly be added to the Structure Tool configuration to become accessible via structure.

### Using `S.document`

The new `S.document().singleton(schemaTypeName)` Structure Tool function is sugar for
`S.schemaType(schemaTypeName).documentId(singletonDocumentId)`. It retrieves the singleton document id by finding the schema type corresponding with `schemaTypeName`, and looking at its `singleton.documentId` property. It uses this information, along with the provided `schemaTypeName`, to automatically set the document's schema type and document id properties.

Its parameters and return type extends those of `S.document`, allowing developers to compose
singleton structure in a familiar way and to override defaults.

```ts
S.listItem()
  .title("Settings")
  .id("settings")
  .child(S.document().singleton(schemaTypeName));
```

### Using `S.listItem`

The new `S.listItem().singleton(schemaTypeName)` Structure Tool function is a higher-level utility, producing both a list item and a child document for the provided singleton schema type.

Just like `S.document`, its parameters and return type extends those of `S.listItem`, allowing developers to compose
singleton structure in a familiar way and to override defaults.

```ts
S.listItem().singleton(schemaTypeName);
```

### Using `S.list`

The new `S.list().singletons(arrayOfSchemaTypeNames)` Structure Tool function is the highest-level utility for working with singletons in Structure Tool. It provides fewer opporunities for customisation than `S.listItem.singleton()`, `S.document().singleton`, or `S.document`, but in return provides a very simple way to render a list of singletons.

Just like the other new utilities, its parameters and return type extends those of `S.list`, allowing developers to compose
singleton structure in a familiar way and to override defaults.

```ts
S.list().singletons(arrayOfSchemaTypeNames);
```

#### Attempting to use a non-singleton schema type as a singleton

If a developer calls any of the Structure Tool singleton functions (`S.document().singleton()`, `S.listItem().singleton()`, or `S.list().singletons()`) for a non-singleton schema type, a runtime error will be thrown.

#### "Unhandled" singletons

As a consequence of Structure Tool automatically filtering out singletons, developers may inadvertently suppress the visibility of singletons. They may not realise they need to configure Structure Tool, make a mistake in their configuration, or simply forget to add it.

We will not warn about dangling singletons. Structure is resolved lazily, so it's not possible to detect singletons that are absent from the structure without eagerly resolving it.

However, this will be covered clearly in documentation, and LLM skills will be seeded with information on correct singleton usage.

## Migration path

It's not necessary to migrate from existing singleton implementations, because Studio will remain fully compatible with them. However, developers may wish to adopt the new singleton primitive to take advantage of the simpler configuration it permits.

Migration will be simple, given the singleton primitive builds on established userland implementation patterns. We'll additionally investigate the feasibility and value of providing LLM skills to assist with migration.

---

[^1]: An earlier version of this RFC proposed an architecture that isolated schema types from singleton defintions, meaning a single schema type could be used for multiple singletons and non-singletons if desired. This proved to be impractical, because Studio generates initial value templates—which control whether a new document can be created—based on schema types. At template resolution time, it is difficult to know whether a template should be included in the given context.
