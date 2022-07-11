import {defineType} from 'sanity'

export default defineType({
  name: 'simpleBlockNoteUrl',
  type: 'object',
  title: 'URL',
  fields: [
    {
      name: 'url',
      type: 'url',
      title: 'URL',
    },
  ],
  preview: {
    select: {
      url: 'url',
    },
  },
})
