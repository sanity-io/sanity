import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Restaurant website',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([S.listItem().singleton('footer'), S.divider(), ...S.documentTypeListItems()]),
    }),
  ],
  document: {
    // The string shorthand expands to
    // {id: 'footer', documentId: 'footer', schemaType: 'footer'}.
    singletons: ['footer'],
  },
  schema: {
    types: [
      defineType({
        name: 'footer',
        title: 'Footer',
        type: 'document',
        fields: [
          defineField({
            name: 'openingHours',
            title: 'Opening hours',
            type: 'string',
          }),
          defineField({
            name: 'address',
            title: 'Address',
            type: 'text',
          }),
        ],
      }),
      defineType({
        name: 'menu',
        title: 'Menu',
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
        name: 'event',
        title: 'Event',
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
