import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'boost-search-weight',
  title: 'Boost search weight',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/studio-search-config',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/boost-search-weight.reference.ts',
  prompt: {
    text: `Give the author name field a greater search weighting than the book
name field in Studio global search.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField, defineArrayMember} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Book store',
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
          defineField({
            name: 'biography',
            title: 'Biography',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'block',
              }),
            ],
          }),
        ],
      }),
      defineType({
        name: 'book',
        title: 'Book',
        type: 'document',
        fields: [
          defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            options: {
              search: {
                weight: 30,
              },
            },
          }),
          defineField({
            name: 'synopsis',
            title: 'Synopsis',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'block',
              })
            ],
            options: {
              search: {
                weight: 20,
              },
            },
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
          id: 'increases-relative-author-name-weight',
          text: 'The `author.name` field has an `options.search.weight` value greater than `book.name` has.',
        },
        {
          id: 'does-not-change-relative-book-name-weight',
          text: 'The `book.name` field has an `options.search.weight` value greater than `book.synopsis` has.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})
