import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'migrate-singleton-plugin',
  title: 'Migrate from sanity-plugin-singleton-management to the first-class singleton API',
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
  referenceSolution: 'tasks/migrate-singleton-plugin.reference.ts',
  prompt: {
    text: `Our portfolio Studio uses the third-party
\`sanity-plugin-singleton-management\` plugin for its two singletons: site
settings and the contact page. Studio now supports singletons natively via the
\`document.singletons\` configuration, so we'd like to drop the plugin
dependency entirely.

Migrate the configuration to the first-class API. The two singletons must keep
editing the same documents they do today (the plugin uses the schema type name
as the document ID by default), each should remain edited in place from the
structure, editors should still not be able to create or duplicate them, and
the \`project\` type should stay browsable as normal. The first-class API's
default document action behaviour is acceptable. Remove every remaining use of
the plugin so the package can be uninstalled.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'
import {
  singletonTools,
  singletonDocumentListItems,
  filteredDocumentListItems,
} from 'sanity-plugin-singleton-management'

export default defineConfig({
  name: 'default',
  title: 'Portfolio',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [
    singletonTools(),
    structureTool({
      structure: (S, context) =>
        S.list()
          .title('Content')
          .items([
            ...singletonDocumentListItems({S, context}),
            S.divider(),
            ...filteredDocumentListItems({S, context}),
          ]),
    }),
  ],
  schema: {
    types: [
      defineType({
        name: 'siteSettings',
        title: 'Site settings',
        type: 'document',
        options: {singleton: true},
        fields: [
          defineField({
            name: 'siteTitle',
            title: 'Site title',
            type: 'string',
          }),
        ],
      }),
      defineType({
        name: 'contactPage',
        title: 'Contact page',
        type: 'document',
        options: {singleton: true},
        fields: [
          defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
          }),
        ],
      }),
      defineType({
        name: 'project',
        title: 'Project',
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
          id: 'plugin-fully-removed',
          text: 'No usage of `sanity-plugin-singleton-management` remains: the import, the `singletonTools()` plugin, and the `singletonDocumentListItems` / `filteredDocumentListItems` helpers are all gone.',
        },
        {
          id: 'schema-option-removed',
          text: 'The `options: {singleton: true}` schema option is removed from both singleton schema types.',
        },
        {
          id: 'singletons-registered',
          text: 'Both `siteSettings` and `contactPage` are registered via the `document.singletons` configuration.',
        },
        {
          id: 'document-ids-preserved',
          text: 'The registered document IDs match the schema type names (`siteSettings`, `contactPage`) — the IDs the plugin used — so existing content keeps working without a data migration.',
        },
        {
          id: 'singletons-shown-in-structure',
          text: 'The structure renders both singletons as items that open their documents in place, with the `project` type browsable as a regular document type list below a divider.',
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
          id: 'uses-singleton-structure-helpers',
          text: 'Surfaces the singletons with the first-class helpers (`S.listItem().singleton(...)`, `S.list().singletons([...])`, or `S.document().singleton(...)`), not manual `S.document().schemaType(...).documentId(...)` wiring.',
        },
        {
          id: 'no-redundant-type-list-filtering',
          text: 'Does not manually filter the singleton types out of `S.documentTypeListItems()` — registered singleton schema types are excluded automatically.',
        },
        {
          id: 'no-manual-creation-filtering',
          text: 'Does not add manual `newDocumentOptions` or duplicate-action filtering — registering the singletons handles create and duplicate prevention automatically.',
        },
        {
          id: 'uses-concise-registration',
          text: "Registers the singletons concisely — the string shorthand (`singletons: ['siteSettings', 'contactPage']`) is ideal here since each definition id, document id, and schema type coincide.",
        },
      ],
    },
  ],
})
