import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Blog',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem().singleton('siteSettings'),
            S.divider(),
            // Registered singleton schema types are excluded from the default
            // type list automatically — no manual filtering needed.
            ...S.documentTypeListItems(),
          ]),
    }),
  ],
  document: {
    // Registering the singleton replaces the manual `newDocumentOptions` and
    // duplicate-action filtering: Studio removes the create option and the
    // "duplicate" action automatically.
    singletons: ['siteSettings'],
  },
  schema: {
    types: [
      defineType({
        name: 'siteSettings',
        title: 'Site settings',
        type: 'document',
        fields: [
          defineField({
            name: 'siteTitle',
            title: 'Site title',
            type: 'string',
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
      defineType({
        name: 'author',
        title: 'Author',
        type: 'document',
        fields: [
          defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
          }),
        ],
      }),
    ],
  },
})
