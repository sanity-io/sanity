export default {
  name: 'fieldGroupsWithFieldsetsAndValidation',
  title: 'With fieldsets and validation',
  type: 'document',
  groups: [
    {name: 'group1', title: 'Group 1'},
    {name: 'group2', title: 'Group 2'},
  ],
  fieldsets: [{name: 'fieldset1', title: 'Fieldset 1', options: {collapsed: true}}],
  fields: [
    {
      name: 'title',
      type: 'string',
      group: 'group1',
    },
    {
      name: 'field1',
      type: 'string',
      group: 'group2',
      description: 'Required',
      fieldset: 'fieldset1',
      validation: (Rule) => Rule.required(),
    },
    {name: 'field2', type: 'string', group: 'group1'},
    {name: 'field3', type: 'string', group: ['group1', 'group2']},
    {
      name: 'object1',
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
          description: 'Required',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'object2',
          type: 'object',

          options: {collapsible: true, collapsed: true},
          fieldsets: [{name: 'fieldset2', title: 'Fieldset 2', options: {collapsed: true}}],
          fields: [
            {
              name: 'groupField3',
              type: 'string',
            },
            {
              name: 'groupField4',
              description: 'Required',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'groupField5',
              type: 'string',
              fieldset: 'fieldset2',
            },
            {
              name: 'groupField6',
              description: 'Required',
              type: 'string',
              fieldset: 'fieldset2',
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
    },
  ],
}
