import {StackCompactIcon} from '@sanity/icons'
import pluralize from 'pluralize-esm'
import {defineField} from 'sanity'
import blocksToText from '../../utils/blocksToText'

export default defineField({
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
      of: [
        {
          name: 'group',
          title: 'Group',
          type: 'object',
          icon: false,
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'body',
              title: 'Body',
              type: 'blockContent',
            }),
          ],
          preview: {
            select: {
              body: 'body',
              title: 'title',
            },
            prepare(selection) {
              const {body, title} = selection
              return {
                subtitle: body && blocksToText(body),
                title,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      groups: 'groups',
      url: 'url',
    },
    prepare(selection) {
      const {groups = []} = selection
      return {
        subtitle: 'Accordion',
        title: groups.length > 0 ? pluralize('group', groups.length, true) : 'No groups',
        media: StackCompactIcon,
      }
    },
  },
})
