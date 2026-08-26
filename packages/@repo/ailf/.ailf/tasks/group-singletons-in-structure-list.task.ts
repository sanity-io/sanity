import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'group-singletons-in-structure-list',
  title: 'Group multiple singletons in a structure list',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/structure-builder-cheat-sheet',
      },
      {
        path: 'studio/structure-builder-introduction',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/group-singletons-in-structure-list.reference.ts',
  prompt: {
    text: `Our company website Studio has three global configuration documents:
site settings, SEO defaults, and social links. Each should exist exactly once,
using its type name as the fixed document ID.

Register all three as singletons using Studio's first-class singleton support
(\`document.singletons\`), and group them in the structure under a single
"Settings" item that opens a list containing the three singletons. Keep the
\`article\` type browsable as normal.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Company website',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: [
      defineType({
        name: 'siteSettings',
        title: 'Site settings',
        type: 'document',
        fields: [
          defineField({
            name: 'siteTitle',
            title: 'Site title',
            type: 'string',
          }),
        ],
      }),
      defineType({
        name: 'seoSettings',
        title: 'SEO defaults',
        type: 'document',
        fields: [
          defineField({
            name: 'metaDescription',
            title: 'Meta description',
            type: 'text',
          }),
        ],
      }),
      defineType({
        name: 'socialLinks',
        title: 'Social links',
        type: 'document',
        fields: [
          defineField({
            name: 'links',
            title: 'Links',
            type: 'array',
            of: [{type: 'url'}],
          }),
        ],
      }),
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
          id: 'all-singletons-registered',
          text: 'All three types (`siteSettings`, `seoSettings`, `socialLinks`) are registered via the `document.singletons` configuration, each using its type name as the fixed document ID.',
        },
        {
          id: 'grouped-under-settings-item',
          text: 'The structure contains a single "Settings" item whose child is a list containing the three singletons.',
        },
        {
          id: 'article-still-listed',
          text: 'The `article` document type is still browsable as a regular document type list.',
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
          id: 'uses-list-singletons-helper',
          text: 'Renders the singleton group with `S.list().singletons([...])`, or equivalently a list of `S.listItem().singleton(...)` items — not manual `S.document().schemaType(...).documentId(...)` wiring.',
        },
        {
          id: 'list-has-id-and-title',
          text: 'The singletons list (and its parent list item) sets `id` and `title` — `S.list().singletons()` does not produce a complete list on its own.',
        },
        {
          id: 'no-items-after-singletons',
          text: 'Does not call `.items(...)` after `.singletons(...)` on the same list builder (which would replace the singleton items; the API omits `items` from the returned builder for this reason).',
        },
        {
          id: 'no-redundant-type-list-filtering',
          text: 'Does not manually filter the singleton types out of `S.documentTypeListItems()` — registered singleton schema types are excluded automatically.',
        },
      ],
    },
  ],
})
