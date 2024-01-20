import {defineConfig, defineField, defineType} from 'sanity'

export default defineConfig({
  projectId: 'ppsg7ml5',
  dataset: 'test',
  schema: {
    types: [
      defineType({
        name: 'author',
        type: 'document' as const,
        fields: [
          defineField({
            name: 'name',
            type: 'string',
            validation: (rule) => rule.required(),
          }),
        ],
      }),
      defineType({
        name: 'book',
        type: 'document' as const,
        fields: [
          defineField({
            name: 'title',
            type: 'string',
            validation: (rule) => rule.required(),
          }),
          defineField({
            name: 'author',
            type: 'reference',
            to: [{type: 'author'}],
            validation: (rule) => rule.required(),
          }),
        ],
      }),
    ],
  },
})
