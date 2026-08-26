import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'migrate-userland-singleton',
  title: 'Migrate a userland singleton to the first-class singleton API',
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
  referenceSolution: 'tasks/migrate-userland-singleton.reference.ts',
  prompt: {
    text: `Our blog Studio has a "Site settings" singleton that we wired up by
hand a while ago: a custom structure entry that opens the one settings
document, a \`newDocumentOptions\` filter so editors can't create more
settings documents, and a \`document.actions\` filter that removes the
"duplicate" action for it.

Studio now supports singletons natively via the \`document.singletons\`
configuration. Migrate our setup to it and delete the manual wiring that the
first-class API makes redundant. Everything should keep working the same way:
the settings item opens the one document with the fixed ID \`siteSettings\`,
editors can't create or duplicate settings documents, and the other document
types stay browsable as normal.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Blog',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Site settings')
              .id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.divider(),
            ...S.documentTypeListItems().filter((item) => item.getId() !== 'siteSettings'),
          ]),
    }),
  ],
  document: {
    newDocumentOptions: (prev) =>
      prev.filter((templateItem) => templateItem.templateId !== 'siteSettings'),
    actions: (prev, context) =>
      context.schemaType === 'siteSettings'
        ? prev.filter((action) => action.action !== 'duplicate')
        : prev,
  },
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
        name: 'post',
        title: 'Post',
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
          id: 'singleton-registered',
          text: 'The `siteSettings` singleton is registered via the `document.singletons` configuration.',
        },
        {
          id: 'manual-new-document-filter-removed',
          text: 'The manual `document.newDocumentOptions` filter for `siteSettings` is removed (the first-class API filters the create option automatically).',
        },
        {
          id: 'manual-duplicate-filter-removed',
          text: 'The manual `document.actions` filter that removed the "duplicate" action for `siteSettings` is removed (the first-class API removes it automatically).',
        },
        {
          id: 'singleton-opens-fixed-document',
          text: 'The structure still contains a settings item that opens the single document with the fixed document ID `siteSettings`.',
        },
        {
          id: 'other-types-still-listed',
          text: 'The `post` and `author` document types are still browsable as regular document type lists.',
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
          id: 'uses-singleton-structure-helper',
          text: 'Uses a singleton Structure Builder helper (`S.listItem().singleton(...)` or `S.document().singleton(...)`) instead of manually wiring `S.document().schemaType(...).documentId(...)`.',
        },
        {
          id: 'no-redundant-type-list-filtering',
          text: 'Does not manually filter `siteSettings` out of `S.documentTypeListItems()` — registered singleton schema types are excluded from the default type list automatically.',
        },
        {
          id: 'uses-shorthand-or-definition',
          text: "Registers the singleton either as the string shorthand `'siteSettings'` or as a full definition with `id`, `documentId`, and `schemaType`.",
        },
      ],
    },
  ],
})
