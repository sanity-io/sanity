import {defineArrayMember, defineField, defineType} from '@sanity/types'

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

export const arrayOfMultipleNestedTypes = defineField({
  name: 'arrayOfMultipleNestedTypes',
  title: 'Array of multiple nested types',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'image',
    }),
    defineArrayMember({
      type: 'object',
      name: 'house',
      title: 'House with a long title',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        defineField({
          name: 'nestedArray',
          title: 'Nested array',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'color',
              title: 'Nested color with a long title',
              fields: [
                {
                  name: 'title',
                  type: 'string',
                },
                {
                  name: 'name',
                  type: 'string',
                },
              ],
            }),
          ],
        }),
      ],
    }),
    defineArrayMember({
      type: 'object',
      name: 'color',
      title: 'Color with a long title',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          name: 'name',
          type: 'string',
        },
        defineField({
          name: 'nestedArray',
          title: 'Nested array',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'color',
              title: 'Nested color with a long title',
              fields: [
                {
                  name: 'title',
                  type: 'string',
                },
                {
                  name: 'name',
                  type: 'string',
                },
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})

export const arrayOfMultipleNestedTypesWithoutColor = defineField({
  name: 'arrayOfMultipleNestedTypesWithoutColor',
  title: 'Array of multiple nested types without color',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'image',
    }),
    defineArrayMember({
      type: 'object',
      name: 'house',
      title: 'House with a long title',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        defineField({
          name: 'nestedArray',
          title: 'Nested array',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'house',
              title: 'Nested house with a long title',
              fields: [
                {
                  name: 'title',
                  type: 'string',
                },
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})

export const eventsArray = defineField({
  name: 'events',
  title: 'Events',
  type: 'array',
  of: [
    defineArrayMember({
      name: 'mbwEvent',
      type: 'object',
      fields: [
        defineField({
          name: 'where',
          title: 'Where',
          description: 'Victoriagade? Baghaven? Koelschip?',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'what',
          title: 'What',
          description: 'Party? Bottle release? Tap takeover?',
          type: 'array',
          of: [{type: 'string'}],
          validation: (Rule) => Rule.min(1),
        }),
      ],
    }),
  ],
})
