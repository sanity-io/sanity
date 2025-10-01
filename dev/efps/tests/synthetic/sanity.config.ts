import {defineConfig, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

export const syntheticEfps = defineConfig({
  name: 'synthetic-efps',
  // Had to add the alternative or when running the studio locally it throws errors
  projectId: import.meta.env.VITE_PERF_EFPS_PROJECT_ID || 'b8j69ts2',
  dataset: import.meta.env.VITE_PERF_EFPS_DATASET || 'production',
  apiHost: 'https://api.sanity.work',
  scheduledPublishing: {
    enabled: false,
  },
  releases: {
    enabled: false,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Synthetic Documents')
              .child(S.documentTypeList('synthetic').title('Synthetic Documents')),
          ]),
    }),
  ],
  schema: {
    types: [
      defineType({
        name: 'synthetic',
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({name: 'arrayOfObjects', type: 'array', of: [{type: 'syntheticObject'}]}),
          defineField({name: 'syntheticObject', type: 'syntheticObject'}),
        ],
      }),
      defineType({
        name: 'syntheticObject',
        type: 'object',
        fields: [
          defineField({name: 'name', type: 'string'}),
          defineField({name: 'image', type: 'image'}),
          defineField({name: 'file', type: 'file'}),
          defineField({name: 'geopoint', type: 'geopoint'}),
          defineField({name: 'number', type: 'number'}),
          defineField({name: 'string', type: 'string'}),
          defineField({name: 'boolean', type: 'boolean'}),
          defineField({name: 'slug', type: 'slug'}),
          defineField({name: 'text', type: 'text'}),
          defineField({name: 'reference', type: 'reference', to: [{type: 'synthetic'}]}),
          defineField({name: 'date', type: 'date'}),
          defineField({name: 'datetime', type: 'datetime'}),
          defineField({name: 'nestedObject', type: 'syntheticObject'}),
          ...Array.from({length: 20}).map((_, index) =>
            defineField({name: `field${index}`, type: 'string'}),
          ),
        ],
      }),
    ],
  },
})

export default syntheticEfps
