import {LinkIcon} from '@sanity/icons'
import {defineField} from 'sanity'

export const imageCallToActionType = defineField({
  name: 'imageCallToAction',
  title: 'Call to action',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'link',
      type: 'array',
      of: [{type: 'linkInternal'}, {type: 'linkExternal'}],
      validation: (Rule) => Rule.max(1),
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        subtitle: 'Call to action',
        title,
        media: LinkIcon,
      }
    },
  },
})
