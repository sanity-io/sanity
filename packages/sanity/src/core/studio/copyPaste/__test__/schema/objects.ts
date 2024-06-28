import {defineType} from 'sanity'

export const linkType = defineType({
  type: 'object',
  name: 'link',
  fields: [
    {
      type: 'string',
      name: 'href',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    },
  ],
  validation: (Rule) => Rule.required(),
})

export const myStringObjectType = defineType({
  type: 'object',
  name: 'myStringObject',
  fields: [{type: 'string', name: 'myString', validation: (Rule) => Rule.required()}],
})

export const nestedObjectType = defineType({
  type: 'object',
  name: 'nestedObject',
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      type: 'array',
      name: 'objectList',
      of: [{type: 'nestedObject'}],
    },
    {
      type: 'object',
      name: 'recursiveTest',
      fields: [
        {
          name: 'recursive',
          type: 'nestedObject',
        },
      ],
    },
  ],
})
