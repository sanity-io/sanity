import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'organize-fields-with-groups',
  title: 'Organize fields with groups',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/field-groups',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/organize-fields-with-groups.reference.ts',
  prompt: {
    text: `The product document form has become unwieldy. Group the fields into
"Details" and "SEO" tabs: put the SEO fields in the SEO tab and everything
else in Details. Details should be the tab that is open by default.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Web shop',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'product',
        title: 'Product',
        type: 'document',
        fields: [
          defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
          }),
          defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
          }),
          defineField({
            name: 'price',
            title: 'Price',
            type: 'number',
          }),
          defineField({
            name: 'seoTitle',
            title: 'SEO title',
            type: 'string',
          }),
          defineField({
            name: 'seoDescription',
            title: 'SEO description',
            type: 'text',
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
          id: 'defines-two-groups',
          text: 'The `product` type defines two field groups titled "Details" and "SEO".',
        },
        {
          id: 'assigns-seo-fields',
          text: 'The `seoTitle` and `seoDescription` fields are assigned to the SEO group.',
        },
        {
          id: 'assigns-detail-fields',
          text: 'The `name`, `description`, and `price` fields are assigned to the Details group.',
        },
        {
          id: 'details-is-default',
          text: 'The Details group is marked as the default group.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})
