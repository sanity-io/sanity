import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'conditional-field-visibility',
  title: 'Conditionally hide a field',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/conditional-fields',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/conditional-field-visibility.reference.ts',
  prompt: {
    text: `Posts can link out to an external site, but the "External URL" field
is confusing editors when it is not relevant. Change the schema so the
"External URL" field only appears when the "Link to external site?" toggle is
on.

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
            name: 'isExternal',
            title: 'Link to external site?',
            type: 'boolean',
          }),
          defineField({
            name: 'externalUrl',
            title: 'External URL',
            type: 'url',
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
          id: 'hides-external-url-conditionally',
          text: 'The `post.externalUrl` field has a `hidden` callback that hides the field when `isExternal` is not `true`, reading the sibling value from the callback context (e.g. `document` or `parent`).',
        },
        {
          id: 'keeps-external-url-field',
          text: 'The `post.externalUrl` field remains in the schema with type `url`.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})
