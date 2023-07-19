import {CogIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export default defineType({
  name: 'fieldGroupsWithValidation',
  title: 'With validation',
  type: 'document',
  groups: [
    {
      name: 'group1',
      icon: CogIcon,
    },
    {
      name: 'group2',
      title: 'Group 2',
    },
  ],
  fields: [
    {name: 'field1', type: 'string', group: 'group1', validation: (Rule) => Rule.required()},
    {name: 'field2', type: 'string', group: 'group2', validation: (Rule) => Rule.required()},
    {name: 'field3', type: 'string', group: 'group1'},
    {name: 'field4', type: 'string', group: ['group1', 'group2']},
    {
      name: 'collapsibleObject',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      group: 'group1',
      fields: [
        {
          name: 'groupField1',
          type: 'string',
        },
        {
          name: 'groupField2',
          title: 'Group field 2 (required)',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
      ],
    },
  ],
})
