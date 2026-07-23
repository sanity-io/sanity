// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {defineConfig, defineType, defineField} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Blog',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'post',
        title: 'Post',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'publishedAt',
            title: 'Published at',
            type: 'datetime',
          }),
        ],
        orderings: [
          {
            name: 'publishedAtDesc',
            title: 'Publish date, newest first',
            by: [{field: 'publishedAt', direction: 'desc'}],
          },
          {
            name: 'titleAsc',
            title: 'Title, A–Z',
            by: [{field: 'title', direction: 'asc'}],
          },
        ],
      }),
    ],
  },
})
