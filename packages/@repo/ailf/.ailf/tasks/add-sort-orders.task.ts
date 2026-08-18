import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'add-sort-orders',
  title: 'Add custom sort orders',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/sort-orders',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/add-sort-orders.reference.ts',
  prompt: {
    text: `Editors want to browse posts by newest publish date first, and
alphabetically by title. Add these two sort options to the post type, listing
newest-first before the alphabetical option.

This is the existing Studio configuration:

\`\`\`ts
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
      }),
    ],
  },
})
\`\`\``,
  },
  assertions: [
    {
      type: 'llm-rubric',
      template: 'task-completion',
      criteria: [
        {
          id: 'adds-orderings',
          text: 'The `post` type has an `orderings` array with two sort orders.',
        },
        {
          id: 'newest-first-ordering',
          text: 'One ordering sorts by `publishedAt` descending, and it is listed first.',
        },
        {
          id: 'alphabetical-ordering',
          text: 'One ordering sorts by `title` ascending.',
        },
        {
          id: 'orderings-have-name-and-title',
          text: 'Each ordering has both a `name` and a human-readable `title`.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})
