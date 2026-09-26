import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'create-singleton-settings',
  title: 'Create a singleton settings document',
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
  referenceSolution: 'tasks/create-singleton-settings.reference.ts',
  prompt: {
    text: `We have one global "Site settings" document. Make the Studio treat it
as a singleton using Studio's first-class singleton support
(\`document.singletons\`): a structure item that opens the one settings
document directly (using the fixed document ID \`siteSettings\`), with the
remaining document types listed as normal. Editors should not be able to
create or duplicate settings documents.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Blog',
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
          text: 'The `siteSettings` singleton is registered via the `document.singletons` configuration with the document ID `siteSettings`.',
        },
        {
          id: 'singleton-opens-fixed-document',
          text: 'The structure contains a "Site settings" item that opens a single document editor for the `siteSettings` type with the fixed document ID `siteSettings`.',
        },
        {
          id: 'other-types-still-listed',
          text: 'The `post` and `author` document types are still browsable as regular document type lists.',
        },
        {
          id: 'settings-excluded-from-type-lists',
          text: 'The `siteSettings` type does not also appear as a regular document type list.',
        },
        {
          id: 'no-manual-creation-filtering',
          text: 'Does not add manual `newDocumentOptions` or `document.actions` filtering — registering the singleton handles create and duplicate prevention automatically.',
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
          text: 'Uses a singleton Structure Builder helper (`S.listItem().singleton(...)` or `S.document().singleton(...)`) rather than manually wiring `S.document().schemaType(...).documentId(...)`.',
        },
        {
          id: 'no-redundant-type-list-filtering',
          text: 'Does not manually filter `siteSettings` out of `S.documentTypeListItems()` — registered singleton schema types are excluded from the default type list automatically.',
        },
        {
          id: 'uses-shorthand-or-definition',
          text: "Registers the singleton either as the string shorthand `'siteSettings'` or as a full definition with `id`, `documentId`, and `schemaType`.",
        },
        {
          id: 'no-deprecated-desk-tool',
          text: 'Uses `structureTool` from `sanity/structure`, not the deprecated `deskTool`.',
        },
      ],
    },
  ],
})
