// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {defineConfig, defineType, defineField} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Magazine',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'article',
        title: 'Article',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'coverImage',
            title: 'Cover image',
            type: 'image',
            options: {
              hotspot: true,
            },
            fields: [
              defineField({
                name: 'alt',
                title: 'Alternative text',
                type: 'string',
                // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
                validation: (rule) => rule.required(),
              }),
            ],
          }),
        ],
      }),
    ],
  },
})
