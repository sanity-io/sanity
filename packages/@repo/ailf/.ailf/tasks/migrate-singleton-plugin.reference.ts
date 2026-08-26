import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Portfolio',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem().singleton('siteSettings'),
            S.listItem().singleton('contactPage'),
            S.divider(),
            // Registered singleton schema types are excluded from the default
            // type list automatically — no manual filtering needed.
            ...S.documentTypeListItems(),
          ]),
    }),
  ],
  document: {
    // The string shorthand registers each singleton with its schema type name
    // as the document id — the same id the plugin used — so existing content
    // keeps working. Creation and duplicate prevention are automatic.
    singletons: ['siteSettings', 'contactPage'],
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
        name: 'contactPage',
        title: 'Contact page',
        type: 'document',
        fields: [
          defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
          }),
        ],
      }),
      defineType({
        name: 'project',
        title: 'Project',
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
  },
})
