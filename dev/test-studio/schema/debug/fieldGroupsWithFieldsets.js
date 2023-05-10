import {CogIcon} from '@sanity/icons'

export default {
  name: 'fieldGroupsWithFieldsets',
  title: 'Field groups with all fields inside fieldsets',
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
  fieldsets: [
    {name: 'fieldset1', title: 'Fieldset 1', options: {collapsed: true}},
    {name: 'fieldset2', title: 'Fieldset 2', options: {collapsed: true}},
  ],
  fields: [
    {
      name: 'group1fieldset1',
      type: 'string',
      group: 'group1',
      fieldset: 'fieldset1',
    },
    {
      name: 'noGroupFieldset1',
      type: 'string',
      validation: (r) => r.required(),
      fieldset: 'fieldset1',
    },
    {
      name: 'group1fieldset2',
      type: 'string',
      group: 'group1',
      fieldset: 'fieldset2',
    },
    {
      name: 'group2fieldset1',
      type: 'string',
      group: 'group2',
      fieldset: 'fieldset1',
    },
    {
      name: 'group2fieldset2',
      type: 'string',
      group: 'group2',
      fieldset: 'fieldset2',
    },
  ],
}
