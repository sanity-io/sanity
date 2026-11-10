import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'register-singleton-with-shorthand',
  title: 'Register a singleton with the concise string shorthand',
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
  referenceSolution: 'tasks/register-singleton-with-shorthand.reference.ts',
  prompt: {
    text: `Our restaurant website Studio needs a single "Footer" document for
the global footer content. The schema type is called \`footer\`, and we want
the document ID to be \`footer\` as well — there's no reason for the names to
differ.

Register it as a singleton using Studio's first-class singleton support
(\`document.singletons\`), using the most concise form of the configuration
available for this case, and add it to the top of the structure. The \`menu\`
and \`event\` types should stay browsable as normal.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Restaurant website',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: [
      defineType({
        name: 'footer',
        title: 'Footer',
        type: 'document',
        fields: [
          defineField({
            name: 'openingHours',
            title: 'Opening hours',
            type: 'string',
          }),
          defineField({
            name: 'address',
            title: 'Address',
            type: 'text',
          }),
        ],
      }),
      defineType({
        name: 'menu',
        title: 'Menu',
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
        name: 'event',
        title: 'Event',
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
          id: 'singleton-registered',
          text: 'The `footer` singleton is registered via the `document.singletons` configuration.',
        },
        {
          id: 'singleton-shown-in-structure',
          text: 'The structure contains a footer item at the top that opens the single document with the fixed document ID `footer`.',
        },
        {
          id: 'other-types-still-listed',
          text: 'The `menu` and `event` document types are still browsable as regular document type lists.',
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
          id: 'uses-string-shorthand',
          text: "Registers the singleton with the string shorthand (`singletons: ['footer']`) rather than a full definition object — when the definition id, document id, and schema type are identical, the string form is the concise equivalent.",
        },
        {
          id: 'uses-singleton-structure-helper',
          text: "Surfaces the singleton with `S.listItem().singleton('footer')` (or `S.document().singleton('footer')`), referencing it by the singleton definition id.",
        },
        {
          id: 'no-redundant-configuration',
          text: 'Does not add redundant configuration the registry already provides: no manual `newDocumentOptions` filtering, no manual duplicate-action filtering, and no manual filtering of `S.documentTypeListItems()`.',
        },
      ],
    },
  ],
})
