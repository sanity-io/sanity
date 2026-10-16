import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'share-schema-singleton-and-documents',
  title: 'Use one schema type for both a singleton and ordinary documents',
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
  referenceSolution: 'tasks/share-schema-singleton-and-documents.reference.ts',
  prompt: {
    text: `Our marketing site Studio uses a \`page\` type for ordinary pages
(About, Pricing, Contact, and so on). We also want a dedicated "Homepage": one
special page with the fixed document ID \`homepage\`, edited in place from the
top of the structure. It should use the same \`page\` schema — we don't want to
maintain a duplicate schema type.

Register the homepage as a singleton using Studio's first-class singleton
support (\`document.singletons\`). Ordinary pages must keep working exactly as
before: editors can still browse them in the structure and still create new
pages from the "create new" menus. Only the homepage itself should be exempt
from creation and duplication.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Marketing site',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: [
      defineType({
        name: 'page',
        title: 'Page',
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
            type: 'text',
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
          id: 'singleton-registered-with-definition-object',
          text: 'A singleton is registered via `document.singletons` with the document ID `homepage` and the schema type `page`, using a definition object (the string shorthand cannot express a document id and schema type that differ). The definition `id` may be omitted, since it inherits the document ID.',
        },
        {
          id: 'homepage-edited-in-place',
          text: 'The structure contains a homepage item that opens the single document with the fixed document ID `homepage`.',
        },
        {
          id: 'pages-still-browsable',
          text: "Ordinary `page` documents are still browsable in the structure — the `page` type is explicitly added back (e.g. `S.documentTypeListItem('page')`), since registering a singleton hides its schema type from the default type list.",
        },
        {
          id: 'pages-still-creatable',
          text: 'Ordinary `page` documents are still creatable — an explicit initial value template is added for the `page` type, since registering a singleton replaces the type\'s plain template with a singleton-tagged one that is never offered as a "create new" option.',
        },
        {
          id: 'post-unaffected',
          text: 'The `post` document type remains listed and creatable, unaffected by the singleton.',
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
          id: 'no-duplicate-schema-type',
          text: 'Does not duplicate the `page` schema definition under a second type name — the singleton and ordinary documents share one schema type.',
        },
        {
          id: 'uses-singleton-structure-helper',
          text: 'Surfaces the homepage with `S.listItem().singleton(...)` or `S.document().singleton(...)`, referencing the singleton definition id.',
        },
        {
          id: 'escape-hatch-template-untagged',
          text: 'The template that restores page creation does not carry a `singleton` tag — untagged templates are always offered as create options (any template id works, including `page` itself).',
        },
        {
          id: 'no-manual-creation-filtering',
          text: 'Does not add manual `newDocumentOptions` or duplicate-action filtering — the registry handles the homepage automatically.',
        },
      ],
    },
  ],
})
