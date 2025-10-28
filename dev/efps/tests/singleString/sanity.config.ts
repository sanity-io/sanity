import {defineConfig, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

export const singleStringEfps = defineConfig({
  name: 'single-string-efps',
  // Had to add the alternative or when running the studio locally it throws errors
  projectId: import.meta.env.VITE_PERF_EFPS_PROJECT_ID || 'b8j69ts2',
  dataset: import.meta.env.VITE_PERF_EFPS_DATASET || 'production',
  apiHost: import.meta.env.VITE_PERF_EFPS_API_HOST || 'https://api.sanity.work',
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
              .title('Single String Documents')
              .child(S.documentTypeList('singleString').title('Single String Documents')),
          ]),
    }),
  ],
  schema: {
    types: [
      defineType({
        name: 'singleString',
        type: 'document',
        fields: [defineField({name: 'stringField', type: 'string'})],
      }),
    ],
  },
})

export default singleStringEfps
