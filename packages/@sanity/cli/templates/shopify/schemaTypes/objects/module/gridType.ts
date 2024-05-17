import {ThLargeIcon} from '@sanity/icons'
import pluralize from 'pluralize-esm'
import {defineArrayMember, defineField} from 'sanity'

export const gridType = defineField({
  name: 'grid',
  title: 'Grid',
  type: 'object',
  icon: ThLargeIcon,
  fields: [
    defineField({
      name: 'items',
      type: 'array',
      of: [defineArrayMember({type: 'gridItem'})],
    }),
  ],
  preview: {
    select: {
      items: 'items',
    },
    prepare({items}) {
      return {
        subtitle: 'Grid',
        title: items?.length > 0 ? pluralize('item', items.length, true) : 'No items',
      }
    },
  },
})
