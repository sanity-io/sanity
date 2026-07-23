import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'require-field-validation',
  title: 'Require an excerpt with a length limit',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/validation',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/require-field-validation.reference.ts',
  prompt: {
    text: `Editors keep publishing posts without an excerpt. Make the excerpt
field mandatory, cap it at 200 characters, and show the message "An excerpt of
200 characters or less is required" when validation fails.

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
            name: 'excerpt',
            title: 'Excerpt',
            type: 'text',
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
          id: 'excerpt-is-required',
          text: 'The `post.excerpt` field has a validation rule making it required.',
        },
        {
          id: 'excerpt-max-length',
          text: 'The `post.excerpt` field has a validation rule capping its length at 200 characters.',
        },
        {
          id: 'custom-error-message',
          text: 'The validation failure message is "An excerpt of 200 characters or less is required".',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})
