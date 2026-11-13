import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'singletons-alongside-ordinary-documents',
  title: 'Add fixed singleton documents while keeping ordinary documents creatable',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/structure-builder-cheat-sheet',
      },
      {
        path: 'studio/structure-builder-introduction',
      },
      {
        path: 'studio/initial-value-templates',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/singletons-alongside-ordinary-documents.reference.ts',
  prompt: {
    text: `Our marketing Studio has a \`campaign\` type that editors use to create
new campaigns all the time, and a \`siteSettings\` type that has never been
wired up properly.

Add a few fixed documents using Studio's first-class singleton support
(\`document.singletons\`):

- "Site settings": the one \`siteSettings\` document, with the fixed document
  ID \`siteSettings\`.
- "Spring campaign" and "Summer campaign": two fixed \`campaign\` documents
  with the document IDs \`spring\` and \`summer\`, edited in place from the
  structure.

Editors must still be able to create ordinary campaigns from the "create new
document" menus and browse them in the structure, exactly as they do today.
Only the three fixed documents should be exempt from creation and duplication.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Marketing',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: [
      defineType({
        name: 'campaign',
        title: 'Campaign',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'startDate',
            title: 'Start date',
            type: 'date',
          }),
        ],
      }),
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
          id: 'settings-singleton-registered',
          text: "A `siteSettings` singleton is registered via `document.singletons` with the document ID `siteSettings` (the string shorthand `'siteSettings'` or an equivalent definition object).",
        },
        {
          id: 'campaign-singletons-registered',
          text: 'Two singletons are registered via `document.singletons` with the document IDs `spring` and `summer` and the schema type `campaign`, using definition objects (the string shorthand cannot express a document id that differs from the schema type).',
        },
        {
          id: 'campaigns-still-creatable',
          text: 'Ordinary `campaign` documents are still offered as a "create new document" option. The preferred way is `allowNonSingletonDocuments: true` on a `campaign` singleton definition, which keeps the type\'s default initial value template; an explicit untagged `campaign` template in `schema.templates` is also acceptable.',
        },
        {
          id: 'campaigns-still-browsable',
          text: "Ordinary `campaign` documents are still browsable in the structure, either through the default document type list kept by `allowNonSingletonDocuments: true` or through an explicit `S.documentTypeListItem('campaign')`.",
        },
        {
          id: 'fixed-documents-in-structure',
          text: 'The structure contains items that open the three fixed documents (`siteSettings`, `spring`, `summer`) directly, or relies on the default structure, which appends an item per registered singleton.',
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
          id: 'uses-allow-non-singleton-documents',
          text: "Uses `allowNonSingletonDocuments: true` on the `campaign` singleton definitions rather than re-adding a `campaign` template by hand and an explicit `S.documentTypeListItem('campaign')`.",
        },
        {
          id: 'settings-stays-exclusive',
          text: 'Does not set `allowNonSingletonDocuments` on the `siteSettings` singleton, so no further settings documents can be created.',
        },
        {
          id: 'no-id-colliding-with-type-name',
          text: "No `campaign` singleton uses `campaign` as its `id` or `documentId`; that id belongs to the type's own template and list item.",
        },
        {
          id: 'no-duplicate-schema-type',
          text: 'Does not duplicate the `campaign` schema under a second type name for the fixed campaigns.',
        },
        {
          id: 'no-manual-creation-filtering',
          text: 'Does not add manual `newDocumentOptions` or duplicate-action filtering — the singleton registry handles the fixed documents automatically.',
        },
      ],
    },
  ],
})
