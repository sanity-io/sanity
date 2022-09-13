import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
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
    defineArrayMember({
      title: 'Image',
      name: 'image',
      type: 'image',
      fields: [
        defineField({
          title: 'Caption',
          name: 'caption',
          type: 'string',
        }),
      ],
    }),
  ],
})
