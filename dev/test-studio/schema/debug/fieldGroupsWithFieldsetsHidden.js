const group = {
  name: 'group',
  title: 'Group',
  default: true,
}
const group2 = {
  name: 'group2',
  title: 'Group 2',
}
const fieldset = {
  name: 'fieldset',
  title: 'Fieldset',
  options: {collapsed: true},
}

export default {
  name: 'fieldGroupsWithFieldsetsHidden',
  title: 'With default groups and collapsed fieldsets',
  type: 'document',
  groups: [group, group2],
  fieldsets: [fieldset],
  fields: [
    {
      name: 'field1',
      type: 'string',
    },
    {
      name: 'field2',
      type: 'string',
      group: group.name,
      fieldset: fieldset.name,
    },
    {
      name: 'nested',
      type: 'object',
      group: group.name,
      fieldset: fieldset.name,
      groups: [group, group2],
      fieldsets: [fieldset],
      fields: [
        {
          name: 'field3',
          type: 'string',
          fieldset: fieldset.name,
        },
        {
          name: 'field4',
          type: 'string',
          group: group.name,
          fieldset: fieldset.name,
        },
        {
          name: 'field5',
          type: 'string',
          group: group2.name,
        },
        {
          name: 'nested',
          type: 'object',
          group: group.name,
          fieldset: fieldset.name,
          groups: [group, group2],
          fieldsets: [fieldset],
          fields: [
            {
              name: 'field6',
              type: 'string',
              fieldset: fieldset.name,
            },
            {
              name: 'field7',
              type: 'string',
              group: group.name,
              fieldset: fieldset.name,
            },
            {
              name: 'field8',
              type: 'string',
              group: group2.name,
            },
          ],
        },
      ],
    },
  ],
}
