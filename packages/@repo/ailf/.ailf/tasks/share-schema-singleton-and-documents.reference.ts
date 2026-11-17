import {defineConfig, defineSingleton, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Marketing site',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem().singleton('homepage'),
            S.divider(),
            // Registering a singleton hides its schema type from the default
            // type list, so ordinary pages are opted back in explicitly.
            // Explicit document type lists are never filtered.
            S.documentTypeListItem('page'),
            ...S.documentTypeListItems(),
          ]),
    }),
  ],
  document: {
    singletons: [
      // A definition object: the singleton's identity (`homepage`, inherited
      // from `documentId`) is decoupled from the shared `page` schema type.
      defineSingleton({
        documentId: 'homepage',
        schemaType: 'page',
        title: 'Homepage',
      }),
    ],
  },
  schema: {
    types: [
      defineType({
        name: 'page',
        title: 'Page',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'body',
            title: 'Body',
            type: 'text',
          }),
        ],
      }),
      defineType({
        name: 'post',
        title: 'Post',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
        ],
      }),
    ],
    templates: (prev) => [
      ...prev,
      // Registering the homepage singleton replaces the `page` type's plain
      // template with a singleton-tagged one, which is never offered as a
      // "create new" option. This explicit untagged template keeps ordinary
      // pages creatable.
      {
        id: 'page-non-singleton',
        title: 'Page',
        schemaType: 'page',
        value: {},
      },
    ],
  },
})
