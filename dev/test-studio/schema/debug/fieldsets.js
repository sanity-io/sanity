import {BlockquoteIcon} from '@sanity/icons'

export default {
  name: 'fieldsetsTest',
  type: 'document',
  title: 'Fieldsets test',
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
      options: {columns: 2},
      readOnly: true,
    },
    {
      name: 'single',
      title: 'Single',
      hidden: false,
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
      name: 'single',
      type: 'string',
      title: 'Single',
      fieldset: 'single',
    },
    {
      type: 'number',
      name: 'x',
      title: 'X position',
      fieldset: 'settings',
      validation: (Rule) => Rule.required(),
    },
    {type: 'number', name: 'y', title: 'Y position', fieldset: 'settings'},
    {type: 'number', name: 'width', title: 'Width', fieldset: 'settings'},
    {type: 'number', name: 'height', title: 'Height', fieldset: 'settings'},
  ],
}
