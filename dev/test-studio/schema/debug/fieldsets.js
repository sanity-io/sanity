import {BlockquoteIcon, CogIcon, EyeClosedIcon} from '@sanity/icons'

export default {
  name: 'fieldsetsTest',
  type: 'document',
  title: 'Fieldsets test',
  groups: [
    {
      name: 'group1',
      title: 'Group 1',
      default: true,
      icon: CogIcon,
    },
    {
      name: 'group2',
      title: 'Group 2',
      icon: EyeClosedIcon,
    },
  ],
  icon: BlockquoteIcon,
  preview: {
    select: {
      title: 'myObject.first',
    },
  },
  fieldsets: [
    {
      name: 'settings',
      title: 'Settings',
      group: ['group1'],
      options: {columns: 2},
      readOnly: true,
    },
    {
      name: 'single',
      title: 'Single',
      hidden: false,
    },
    {
      name: 'recursive',
      title: 'Recursive Fieldset',
    },
  ],
  fields: [
    {
      name: 'myObject',
      type: 'myObject',
      title: 'MyObject',
      description: 'The first field here should be the title used in previews',
    },
    {
      name: 'single2',
      type: 'string',
      title: 'Single2',
      readOnly: true,
    },
    {
      title: 'Reference to another fieldset test',
      name: 'singleTypeRef',
      type: 'reference',
      to: [{type: 'fieldsetsTest'}],
    },
    {
      name: 'single',
      type: 'string',
      title: 'Single',
      fieldset: 'single',
    },
    {
      type: 'number',
      name: 'x',
      title: 'X position',
      description:
        'This is a number field. Lets try with a longer description. How does this look? ',
      fieldset: 'settings',
      group: 'group1',
      validation: (Rule) => Rule.required(),
    },
    {type: 'number', name: 'y', title: 'Y position', fieldset: 'settings'},
    {type: 'number', name: 'width', title: 'Width', fieldset: 'settings'},
    {type: 'number', name: 'height', title: 'Height', fieldset: 'settings', group: ['group1']},
    {
      name: 'person',
      type: 'object',
      group: ['group1'],
      fieldsets: [
        {
          name: 'social',
          title: 'Social media handles [collapsed by default]',
          options: {collapsible: true, collapsed: true},
        },
      ],
      groups: [
        {
          name: 'instagram',
          title: 'Instagram',
        },
      ],
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
        },
        {
          name: 'twitter',
          title: 'Twitter',
          type: 'string',
          fieldset: 'social',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'string',
          fieldset: 'social',
          group: ['instagram'],
        },
        {
          name: 'facebook',
          title: 'Facebook',
          type: 'string',
          fieldset: 'social',
        },
      ],
    },
    {
      name: 'fieldWithObjectType',
      title: 'Field of object type',
      type: 'object',
      description:
        'This is a field of (anonymous, inline) object type. Values here should never get a `_type` property',
      groups: [
        {
          name: 'group1',
          title: 'Group 1',
          icon: CogIcon,
        },
        {
          name: 'group2',
          title: 'Group 2',
          icon: EyeClosedIcon,
        },
      ],
      fields: [
        {name: 'field1', type: 'string', description: 'This is a string field'},
        {
          name: 'topLevelPrimitiveArrayType',
          group: ['group1'],
          type: 'array',
          of: [
            {
              type: 'string',
              title: 'A string',
            },
            {
              type: 'number',
              title: 'A number',
            },
          ],
        },
        {
          name: 'field2',
          type: 'myObject',
          title: 'A field of myObject',
          description: 'This is another field of "myObject"',
        },
      ],
    },
    {
      name: 'settingsName',
      title: 'Settings ',
      type: 'string',
      group: ['group1'],
    },
    {
      name: 'settingsBoolean',
      title: 'Settings Boolean',
      description: 'Belongs into multiple field groups',
      type: 'boolean',
      group: ['group1', 'group2'],
    },
    {
      name: 'recursive',
      title: 'This field is of type objectsTest',
      description: 'Recursive',
      type: 'objectsTest',
      group: 'group1',
      fieldset: 'recursive',
    },
  ],
}
