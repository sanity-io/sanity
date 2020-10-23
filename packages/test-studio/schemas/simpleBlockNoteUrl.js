export default {
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
}
