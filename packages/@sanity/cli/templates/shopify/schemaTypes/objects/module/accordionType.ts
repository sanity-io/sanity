import {StackCompactIcon} from '@sanity/icons'
import pluralize from 'pluralize-esm'
import {defineField} from 'sanity'

export const accordionType = defineField({
  name: 'accordion',
  title: 'Accordion',
  type: 'object',
  icon: StackCompactIcon,
  fields: [
    defineField({
      name: 'groups',
      type: 'array',
      of: [{type: 'accordionGroup'}],
    }),
  ],
  preview: {
    select: {
      groups: 'groups',
    },
    prepare({groups}) {
      return {
        subtitle: 'Accordion',
        title: groups?.length > 0 ? pluralize('group', groups.length, true) : 'No groups',
      }
    },
  },
})
