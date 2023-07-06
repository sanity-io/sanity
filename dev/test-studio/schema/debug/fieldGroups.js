import {CogIcon} from '@sanity/icons'

export default {
  name: 'fieldGroups',
  title: 'Basic groups',
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
    {
      name: 'group3',
      title:
        'Group 3 - with a very long name. How will it behave? It should not overflow the pane, but wrap.',
    },
  ],
  fields: [
    {name: 'field1', type: 'string', group: 'group1'},
    {
      type: 'string',
      name: 'noGroup',
      title: 'This field has no group and shall only show up in "All fields"',
    },
    {name: 'field2', type: 'string', group: 'group2'},
    {
      name: 'field3',
      type: 'object',
      group: 'group2',
      groups: [
        {name: 'group21', title: 'Group 2 / group 1'},
        {name: 'group22', title: 'Group 2 / group 2'},
      ],
      fields: [
        {
          type: 'string',
          name: 'group21',
          group: 'group21',
          title: 'string in group 1 in group 2 hidden field',
          hidden: true,
        },
        {
          type: 'string',
          name: 'group212',
          group: 'group21',
          title: 'string in group 1 in group 2',
          hidden: true,
        },
        {type: 'string', name: 'group22', group: 'group22', title: 'string in group 2 in group 2'},
      ],
    },
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
    {name: 'field5', type: 'string', group: 'group3'},
    {
      name: 'arrayWithFieldGroups',
      type: 'array',
      of: [
        {type: 'fieldGroups'},
        {
          type: 'object',
          groups: [
            {name: 'group21', title: 'Group 2 / group 1'},
            {name: 'group22', title: 'Group 2 / group 2'},
          ],
          fields: [
            {
              type: 'string',
              name: 'group21',
              group: 'group21',
              title: 'string in group 1 in group 2',
            },
            {
              type: 'string',
              name: 'group22',
              group: 'group22',
              title: 'string in group 2 in group 2',
            },
          ],
        },
      ],
    },
  ],
}
