import {defineConfig, defineSingleton, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Marketing',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  // The default structure lists the `campaign` type (kept by
  // `allowNonSingletonDocuments`) and appends an item per singleton.
  plugins: [structureTool()],
  document: {
    singletons: [
      // Only ever one settings document: no `allowNonSingletonDocuments`.
      'siteSettings',
      // Fixed campaigns sharing the `campaign` schema type. Setting
      // `allowNonSingletonDocuments` keeps the type's default "create new"
      // template and its default document type list item, so editors can
      // still create and browse ordinary campaigns.
      defineSingleton({
        documentId: 'spring',
        schemaType: 'campaign',
        title: 'Spring campaign',
        allowNonSingletonDocuments: true,
      }),
      defineSingleton({
        documentId: 'summer',
        schemaType: 'campaign',
        title: 'Summer campaign',
        allowNonSingletonDocuments: true,
      }),
    ],
  },
  schema: {
    types: [
      defineType({
        name: 'campaign',
        title: 'Campaign',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'startDate',
            title: 'Start date',
            type: 'date',
          }),
        ],
      }),
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
    ],
  },
})
