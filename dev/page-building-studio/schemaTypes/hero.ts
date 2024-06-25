import {MdMonitor} from 'react-icons/md'
import {defineField, defineType} from 'sanity'

export const hero = defineType({
  type: 'object',
  icon: MdMonitor,
  name: 'hero',
  title: 'Hero',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      type: 'string',
      name: 'lead',
      title: 'Lead',
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title,
        subtitle: 'Hero',
      }
    },
  },
})
