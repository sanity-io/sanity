// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {defineConfig, defineType, defineField} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Book store',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'book',
        title: 'Book',
        type: 'document',
        fields: [
          defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
          }),
          defineField({
            name: 'readingLevel',
            title: 'Reading level',
            type: 'string',
            options: {
              list: [
                {title: 'Beginner', value: 'beginner'},
                {title: 'Intermediate', value: 'intermediate'},
                {title: 'Advanced', value: 'advanced'},
              ],
              layout: 'radio',
            },
          }),
        ],
      }),
    ],
  },
})
