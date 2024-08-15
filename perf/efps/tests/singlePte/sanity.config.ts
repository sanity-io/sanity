import {defineConfig, defineField, defineType} from 'sanity'

export default defineConfig({
  projectId: import.meta.env.VITE_PERF_EFPS_PROJECT_ID,
  dataset: import.meta.env.VITE_PERF_EFPS_DATASET,
  schema: {
    types: [
      defineType({
        name: 'singlePte',
        type: 'document',
        fields: [defineField({name: 'pteField', type: 'array', of: [{type: 'block'}]})],
      }),
    ],
  },
})
