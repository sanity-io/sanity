import {CogIcon} from '@sanity/icons'

export default {
  name: 'fieldGroupsDefault',
  title: 'With default group',
  type: 'document',
  groups: [
    {
      name: 'group1',
      title: 'Group 1',
      icon: CogIcon,
      hidden: ({currentUser}) => currentUser?.field3 === 'hidden',
    },
    {
      name: 'group2',
      title: 'Group 2',
      default: true,
    },
    {
      name: 'group3',
      title: 'Group 3 - Only Admin',
      hidden: ({currentUser}) => currentUser?.roles.some((role) => role.name !== 'administrator'),
    },
    {
      name: 'group4',
      title: 'Group 4 - Non-admins',
      hidden: ({currentUser}) => currentUser?.roles.some((role) => role.name === 'administrator'),
    },
  ],
  fields: [
    {name: 'field1', type: 'string', group: 'group1'},
    {name: 'field2', type: 'string', group: 'group2'},
    {name: 'field3', type: 'string', group: 'group1'},
    {name: 'field4', type: 'string', group: ['group1', 'group2', 'group3', 'group4']},
    {
      name: 'myObject',
      type: 'myObject',
      title: 'MyObject',
      description: 'The first field here should be the title used in previews',
      group: ['group1', 'group2', 'group3', 'group4'],
    },
    {
      name: 'stats',
      title: 'Stats',
      type: 'object',
      groups: [
        {
          name: 'group1',
          title: 'Group 1',
          default: true,
        },
      ],
      group: ['group4', 'group3', 'group2'],
      fields: [
        {
          name: 'time',
          title: 'Time',
          group: ['group1'],
          type: 'object',
          options: {
            columns: 2,
          },
          description: 'Time in minutes',
          fields: [
            {
              name: 'prep',
              title: 'Prep',
              type: 'number',
            },
            {
              name: 'cook',
              title: 'Cook',
              type: 'number',
            },
          ],
        },
        {name: 'anotherEnd', type: 'string', title: 'Another field at the end'},
      ],
    },
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
