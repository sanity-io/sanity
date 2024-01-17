import {StackCompactIcon} from '@sanity/icons'
import pluralize from 'pluralize-esm'
import {defineField} from 'sanity'

export default defineField({
  name: 'module.accordion',
  title: 'Accordion',
  type: 'object',
  icon: StackCompactIcon,
  fields: [
    // Groups
    defineField({
      name: 'groups',
      title: 'Groups',
      type: 'array',
      of: [
        {
          type: 'accordionGroup',
        },
      ],
    }),
  ],
  preview: {
    select: {
      groups: 'groups',
    },
    prepare(selection) {
      const {groups} = selection
      return {
        subtitle: 'Accordion',
        title: groups?.length > 0 ? pluralize('group', groups.length, true) : 'No groups',
      }
    },
  },
})
