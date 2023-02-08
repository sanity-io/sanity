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
      default: true,
      hidden: ({currentUser}) => currentUser?.field3 === 'hidden',
    },
    {
      name: 'group2',
      title: 'Group 2',
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
    // {name: 'field1', type: 'string', group: 'group1'},
    // {name: 'field2', type: 'string', group: 'group2'},
    // {name: 'field3', type: 'string', group: 'group1'},
    // {name: 'field4', type: 'string', group: ['group1', 'group2', 'group3', 'group4']},
    // {
    //   name: 'fieldGroup',
    //   type: 'object',
    //   group: 'group1',
    //   fields: [
    //     {
    //       name: 'groupField1',
    //       type: 'string',
    //     },
    //     {
    //       name: 'groupField2',
    //       type: 'string',
    //     },
    //   ],
    // },
    {
      name: 'defaultsInArrays',
      type: 'array',
      group: 'group1',

      of: [
        {
          name: 'item',
          title: 'Item',
          type: 'object',
          groups: [
            {
              name: 'a',
              title: 'A (default)',
              default: true,
            },
            {
              name: 'b',
              title: 'B',
            },
            {
              name: 'c',
              title: 'C',
            },
          ],
          fields: [
            {
              name: 'fieldA',
              title: 'field A',
              type: 'string',
              group: ['a'],
            },
            {
              name: 'fieldB',
              title: 'field B',
              type: 'string',
              group: ['b'],
            },
            {
              name: 'fieldC',
              title: 'field C',
              type: 'string',
              group: ['c'],
            },
          ],
        },
      ],
    },
  ],
}
