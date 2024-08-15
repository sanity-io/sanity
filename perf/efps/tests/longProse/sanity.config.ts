import {defineConfig, defineField, defineType} from 'sanity'

export default defineConfig({
  projectId: import.meta.env.VITE_PERF_EFPS_PROJECT_ID,
  dataset: import.meta.env.VITE_PERF_EFPS_DATASET,
  schema: {
    types: [
      defineType({
        name: 'longProse',
        type: 'document',
        fields: [
          defineField({
            name: 'longProse',
            type: 'array',
            of: [{type: 'block'}, {type: 'exampleObject'}, {type: 'image'}],
          }),
        ],
      }),
      defineType({
        name: 'exampleObject',
        type: 'object',
        fields: [
          defineField({name: 'foo', type: 'string'}),
          defineField({name: 'bar', type: 'string'}),
        ],
      }),
    ],
  },
})
