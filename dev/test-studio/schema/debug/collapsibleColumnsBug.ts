import {WarningOutlineIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

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
