import {WarningOutlineIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * Reproduction for https://github.com/sanity-io/sanity/issues/6917
 *
 * Opening one collapsible column field causes its neighbor to disappear
 * because they are bottom-aligned (`align-items: flex-end` on the grid).
 *
 * Steps to reproduce:
 * 1. Open a document of this type
 * 2. Both "Column A" and "Column B" should appear side by side, collapsed
 * 3. Expand "Column A" — Column B disappears to the bottom of the page
 * 4. Scroll to the very bottom to find Column B aligned at the bottom of Column A
 */
export const collapsibleColumnsBug = defineType({
  name: 'collapsibleColumnsBug',
  type: 'document',
  title: 'Issue #6917: Collapsible columns alignment',
  icon: WarningOutlineIcon,
  fieldsets: [
    {
      name: 'twoColumns',
      title: 'Two-column layout (expand one to see the bug)',
      options: {columns: 2},
    },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
    defineField({
      name: 'columnA',
      title: 'Column A (expand me first)',
      type: 'object',
      fieldset: 'twoColumns',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'field1', type: 'string', title: 'Field 1'}),
        defineField({name: 'field2', type: 'string', title: 'Field 2'}),
        defineField({name: 'field3', type: 'text', title: 'Field 3 (text)'}),
        defineField({name: 'field4', type: 'string', title: 'Field 4'}),
        defineField({name: 'field5', type: 'string', title: 'Field 5'}),
        defineField({name: 'field6', type: 'text', title: 'Field 6 (text)'}),
        defineField({name: 'field7', type: 'string', title: 'Field 7'}),
        defineField({name: 'field8', type: 'string', title: 'Field 8'}),
        defineField({name: 'field9', type: 'text', title: 'Field 9 (text)'}),
        defineField({name: 'field10', type: 'string', title: 'Field 10'}),
        defineField({name: 'field11', type: 'string', title: 'Field 11'}),
        defineField({name: 'field12', type: 'text', title: 'Field 12 (text)'}),
      ],
    }),
    defineField({
      name: 'columnB',
      title: 'Column B (I disappear when A is expanded)',
      type: 'object',
      fieldset: 'twoColumns',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'field1', type: 'string', title: 'Field 1'}),
        defineField({name: 'field2', type: 'string', title: 'Field 2'}),
        defineField({name: 'field3', type: 'text', title: 'Field 3 (text)'}),
        defineField({name: 'field4', type: 'string', title: 'Field 4'}),
        defineField({name: 'field5', type: 'string', title: 'Field 5'}),
        defineField({name: 'field6', type: 'text', title: 'Field 6 (text)'}),
        defineField({name: 'field7', type: 'string', title: 'Field 7'}),
        defineField({name: 'field8', type: 'string', title: 'Field 8'}),
        defineField({name: 'field9', type: 'text', title: 'Field 9 (text)'}),
        defineField({name: 'field10', type: 'string', title: 'Field 10'}),
        defineField({name: 'field11', type: 'string', title: 'Field 11'}),
        defineField({name: 'field12', type: 'text', title: 'Field 12 (text)'}),
      ],
    }),
  ],
})
