import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'restrict-portable-text',
  title: 'Restrict Portable Text formatting',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/block-type',
      },
      {
        path: 'studio/portable-text-editor-configuration',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/restrict-portable-text.reference.ts',
  prompt: {
    text: `Editors are pasting in wildly formatted text. Restrict the post body
so it only allows the Normal and H2 styles, only the bold (strong) and italic
(emphasis) decorators, only bullet lists, and only link annotations — nothing
else.

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
          id: 'restricts-styles',
          text: 'The block member of `post.body` restricts `styles` to only Normal (`normal`) and H2 (`h2`).',
        },
        {
          id: 'restricts-decorators',
          text: 'Decorators are restricted to only Strong (`strong`) and Emphasis (`em`).',
        },
        {
          id: 'restricts-lists',
          text: 'Lists are restricted to only bullet lists (`bullet`).',
        },
        {
          id: 'restricts-annotations',
          text: 'Annotations are restricted to only a link annotation.',
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
          id: 'decorators-and-annotations-under-marks',
          text: "The `decorators` and `annotations` configuration is nested under the block type's `marks` property, not placed at the top level of the block definition.",
        },
        {
          id: 'uses-canonical-values',
          text: 'Style, decorator, and list entries use the canonical values (`normal`, `h2`, `strong`, `em`, `bullet`) as `{title, value}` objects.',
        },
        {
          id: 'link-annotation-shape',
          text: 'The link annotation is defined as an object type with a URL field (e.g. an `href` field of type `url`).',
        },
      ],
    },
  ],
})
