import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'add-reference-fields',
  title: 'Add reference fields',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/reference-type',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/add-reference-fields.reference.ts',
  prompt: {
    text: `Posts need an author and up to three categories. Add a required
reference to the author type, and an array of references to the category
type capped at three items.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField, defineArrayMember} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Blog',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'author',
        title: 'Author',
        type: 'document',
        fields: [
          defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
          }),
        ],
      }),
      defineType({
        name: 'category',
        title: 'Category',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
        ],
      }),
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
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'block',
              }),
            ],
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
          id: 'adds-author-reference',
          text: 'The `post` type has a field of type `reference` with `to` pointing at the `author` type.',
        },
        {
          id: 'author-is-required',
          text: 'The author reference field has a validation rule making it required.',
        },
        {
          id: 'adds-category-reference-array',
          text: 'The `post` type has an `array` field whose members are references to the `category` type.',
        },
        {
          id: 'categories-capped-at-three',
          text: 'The category array field has a validation rule capping it at three items.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})
