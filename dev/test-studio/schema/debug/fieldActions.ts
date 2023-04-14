import {SearchIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const fieldActionsTestType = defineType({
  type: 'document',
  name: 'fieldActionsTest',
  title: 'Field actions test',
  icon: SearchIcon,

  groups: [
    {
      name: 'meta',
      title: 'Meta',
    },
  ],

  fields: [
    defineField({
      type: 'string',
      name: 'name',
      title: 'Name',
    }),

    defineField({
      type: 'object',
      name: 'meta',
      title: 'Meta',
      group: 'meta',
      fields: [
        defineField({
          type: 'string',
          name: 'title',
          title: 'Title',
        }),
      ],
    }),
  ],
})
