export default {
  name: 'simpleBlockNoteBody',
  title: 'Body',
  type: 'array',
  of: [
    {
      type: 'simpleBlockNoteUrl',
      name: 'ul',
      title: 'URL',
    },
    {
      type: 'block',
      of: [
        {
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
    },
    {
      title: 'Code Block',
      name: 'code',
      type: 'code',
    },
    {
      title: 'Image',
      name: 'image',
      type: 'image',
      fields: [
        {
          title: 'Caption',
          name: 'caption',
          type: 'string',
          options: {
            isHighlighted: true,
          },
        },
      ],
    },
  ],
}
