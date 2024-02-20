import {defineField, type PortableTextBlock} from 'sanity'

const INITIAL_VALUE: PortableTextBlock[] = [
  {
    _key: 'ROOT_KEY',
    children: [
      {
        _type: 'span',
        marks: [],
        text: 'This is some text in the body field',
        _key: 'CHILD_KEY',
      },
    ],
    markDefs: [],
    _type: 'block',
    style: 'normal',
  },
]

export const commentsCI = defineField({
  type: 'document',
  name: 'commentsCI',
  title: 'Comments CI',
  fields: [
    {
      name: 'body',
      type: 'array',
      initialValue: INITIAL_VALUE,
      of: [
        {
          type: 'block',
        },
      ],
    },
  ],
})
