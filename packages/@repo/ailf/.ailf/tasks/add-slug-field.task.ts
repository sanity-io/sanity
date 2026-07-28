import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'add-slug-field',
  title: 'Add a slug field',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/slug-type',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/add-slug-field.reference.ts',
  prompt: {
    text: `We need URLs for blog posts. Add a slug field that editors can
generate from the post title, limited to 96 characters. A post must not pass
validation without a slug.

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
          id: 'adds-slug-field',
          text: 'The `post` type has a field of type `slug`.',
        },
        {
          id: 'slug-source-is-title',
          text: 'The slug field has `options.source` set to the `title` field.',
        },
        {
          id: 'slug-max-length',
          text: 'The slug field has `options.maxLength` set to 96.',
        },
        {
          id: 'slug-is-required',
          text: 'The slug field has a validation rule making it required.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})
