import {defineField} from 'sanity'

export const xquikPostFields = [
  defineField({
    name: 'postToX',
    title: 'Post to X',
    type: 'boolean',
    description: 'Post once when this document is first published.',
    initialValue: false,
  }),
  defineField({
    name: 'xPost',
    title: 'X post',
    type: 'text',
    rows: 5,
    hidden: ({document}) => document?.postToX !== true,
    validation: (Rule) =>
      Rule.custom((value, context) => {
        if (context.document?.postToX !== true) {
          return true
        }
        return typeof value === 'string' && value.trim()
          ? true
          : 'Write the X post before enabling Post to X.'
      }),
  }),
  defineField({
    name: 'xPostStatus',
    title: 'X post status',
    type: 'object',
    readOnly: true,
    fields: [
      defineField({name: 'state', title: 'State', type: 'string'}),
      defineField({name: 'url', title: 'Post URL', type: 'url'}),
      defineField({name: 'writeActionId', title: 'Write action ID', type: 'string'}),
      defineField({name: 'message', title: 'Message', type: 'string'}),
      defineField({name: 'updatedAt', title: 'Updated at', type: 'datetime'}),
    ],
  }),
]
