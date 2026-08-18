import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'image-hotspot-alt-text',
  title: 'Enable image hotspot and require alt text',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/image-type',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/image-hotspot-alt-text.reference.ts',
  prompt: {
    text: `Our article cover images get cropped badly on different devices, and
we are failing accessibility audits. Let editors control the crop focus of the
cover image, and require alternative text on it.

This is the existing Studio configuration:

\`\`\`ts
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
          id: 'enables-hotspot',
          text: 'The `article.coverImage` field has `options.hotspot` set to `true`.',
        },
        {
          id: 'adds-alt-text-field',
          text: 'The `article.coverImage` field has an alternative text field of type `string` defined within the image `fields` array.',
        },
        {
          id: 'alt-text-is-required',
          text: 'The alternative text field has a validation rule making it required.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})
