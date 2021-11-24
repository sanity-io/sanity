import {CogIcon} from '@sanity/icons'

export default {
  name: 'fieldGroups',
  type: 'document',
  groups: [
    {
      name: 'group1',
      title: 'Group 1',
      icon: CogIcon,
    },
    {
      name: 'group2',
      title: 'Group 2',
    },
  ],
  fields: [
    {name: 'field1', type: 'string', group: 'group1'},
    {name: 'field2', type: 'string', group: 'group2'},
    {name: 'field3', type: 'string'},
    {name: 'field4', type: 'string', group: ['group1', 'group2']},
    {
      name: 'fieldGroup',
      type: 'object',
      group: 'group1',
      fields: [
        {
          name: 'groupField1',
          type: 'string',
        },
        {
          name: 'groupField2',
          type: 'string',
        },
      ],
    },
  ],
}
