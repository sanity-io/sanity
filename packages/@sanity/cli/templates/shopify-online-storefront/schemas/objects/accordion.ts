import {StackCompactIcon} from '@sanity/icons'
import pluralize from 'pluralize-esm'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'accordion',
  title: 'Accordion',
  type: 'object',
  icon: StackCompactIcon,
  fields: [
    // Groups
    defineField({
      name: 'groups',
      title: 'Groups',
      type: 'array',
      of: [{type: 'accordionGroup'}],
    }),
  ],
  preview: {
    select: {
      groups: 'groups',
    },
    prepare({groups = []}) {
      return {
        subtitle: 'Accordion',
        title: groups.length > 0 ? pluralize('group', groups.length, true) : 'No groups',
        media: StackCompactIcon,
      }
    },
  },
})
