import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'configure-list-preview',
  title: 'Configure document list previews',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/previews-list-views',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/configure-list-preview.reference.ts',
  prompt: {
    text: `Posts in the document list currently only show their title. Configure
the post preview so the list shows the post title, the referenced author's
name as the subtitle, and the cover image as the thumbnail.

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
            name: 'coverImage',
            title: 'Cover image',
            type: 'image',
          }),
          defineField({
            name: 'author',
            title: 'Author',
            type: 'reference',
            to: [{type: 'author'}],
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
          id: 'adds-preview-configuration',
          text: 'The `post` type has a `preview` configuration.',
        },
        {
          id: 'selects-author-name-through-reference',
          text: 'The preview `select` follows the author reference to select the author name (e.g. `author.name`).',
        },
        {
          id: 'shows-title-subtitle-media',
          text: 'The prepared preview shows the post title as title, the author name as subtitle, and the cover image as media.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
    {
      type: 'llm-rubric',
      template: 'code-correctness',
      criteria: [
        {
          id: 'select-uses-dot-notation-join',
          text: 'The `select` object uses dot notation to resolve values through the reference (e.g. `author.name`) rather than attempting to select the reference object itself.',
        },
        {
          id: 'prepare-returns-preview-shape',
          text: 'If a `prepare` function is used, it returns an object using the `title`, `subtitle`, and `media` keys.',
        },
        {
          id: 'no-deprecated-preview-patterns',
          text: 'Uses the current `preview` property on the schema type, with no deprecated preview APIs or React preview components.',
        },
      ],
    },
  ],
})
