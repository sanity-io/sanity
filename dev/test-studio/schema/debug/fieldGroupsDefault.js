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
    // Note that this is the last group with default = true, so this will override any previous ones set to default
    {
      name: 'group5',
      title: 'Group 5 - Default with hidden',
      hidden: false,
      default: true,
    },
  ],
  fields: [
    {name: 'field1', type: 'string', group: 'group1'},
    {name: 'field2', type: 'string', group: 'group2'},
    {name: 'field3', type: 'string', group: 'group1'},
    {name: 'field4', type: 'string', group: ['group1', 'group2', 'group3', 'group4', 'group5']},
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
