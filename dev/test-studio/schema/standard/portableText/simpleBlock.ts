import {defineType, PortableTextBlock} from 'sanity'
import {toPlainText} from '@portabletext/react'

const linkType = {
  type: 'object',
  name: 'link',
  fields: [
    {
      type: 'string',
      name: 'href',
      validation: (Rule: any) => Rule.uri({scheme: ['http', 'https']}).required(),
    },
  ],
  options: {
    modal: {
      type: 'popover',
      width: 2,
    },
  },
}

const myStringType = {
  type: 'object',
  name: 'test',
  fields: [{type: 'string', name: 'mystring', validation: (Rule: any) => Rule.required()}],
}

export default defineType({
  name: 'simpleBlock',
  title: 'Simple block',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [linkType, myStringType],
          },
          of: [
            {type: 'image', name: 'image'},
            myStringType,
            {
              type: 'reference',
              name: 'strongAuthorRef',
              title: 'A strong author ref',
              to: {type: 'author'},
            },
          ],
          validation: (Rule) =>
            Rule.custom<PortableTextBlock>((block) => {
              const text = toPlainText(block ? [block] : [])
              return text.length === 1 ? 'Please write a longer paragraph.' : true
            }),
          options: {
            spellCheck: true,
          },
        },
        {type: 'image', name: 'image'},
      ],
    },
    {
      name: 'notes',
      type: 'array',
      of: [
        {
          type: 'simpleBlockNote',
        },
      ],
    },
  ],
})
