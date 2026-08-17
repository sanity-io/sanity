import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'string-dropdown-options',
  title: 'Constrain a string field to predefined values',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/string-type',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/string-dropdown-options.reference.ts',
  prompt: {
    text: `The "Reading level" field is free text and editors keep typing
inconsistent values. Constrain it to Beginner, Intermediate, and Advanced,
shown as a radio group, storing lowercase values.

This is the existing Studio configuration:

\`\`\`ts
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
          id: 'adds-predefined-list',
          text: 'The `book.readingLevel` field has an `options.list` with exactly the Beginner, Intermediate, and Advanced choices.',
        },
        {
          id: 'stores-lowercase-values',
          text: 'The list entries store lowercase values (`beginner`, `intermediate`, `advanced`) while displaying capitalized titles.',
        },
        {
          id: 'uses-radio-layout',
          text: 'The field is displayed as a radio group via `options.layout`.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})
