import {defineType} from 'sanity'

const DESCRIPTION = 'Comments added to this field should be hidden when the toggle above is checked'

export const commentsDebug = defineType({
  name: 'commentsDebug',
  type: 'document',
  title: 'Comments debug',
  fields: [
    {
      name: 'string',
      type: 'string',
      title: 'String title',
    },
    {
      name: 'hideFields',
      type: 'boolean',
      title: 'Hide fields',
    },
    {
      type: 'object',
      name: 'object',
      title: 'Object title',
      fields: [
        {
          type: 'string',
          name: 'string',
          title: 'String title',
          hidden: ({document}) => Boolean(document?.hideFields),
          description: DESCRIPTION,
        },
        {
          type: 'number',
          name: 'number',
          title: 'Number title',
        },
      ],
    },
    {
      name: 'image',
      type: 'image',
      title: 'Image title',
      hidden: ({document}) => Boolean(document?.hideFields),
      description: DESCRIPTION,
    },
    {
      type: 'array',
      name: 'arrayOfObjects',
      title: 'Array 1',
      of: [
        {
          name: 'arrayObject',
          type: 'object',
          title: 'Array object 1',
          fields: [
            {
              name: 'string',
              type: 'string',
              title: 'String 1',
            },
            {
              name: 'image',
              type: 'image',
              title: 'Image 1',
              hidden: ({document}) => {
                return Boolean(document?.hideFields)
              },
              description: DESCRIPTION,
            },
            {
              name: 'nestedArray',
              type: 'array',
              title: 'Array 2',
              of: [
                {
                  name: 'nestedArrayObject1',
                  type: 'object',
                  title: 'Nested array object 1',
                  fields: [
                    {
                      name: 'string',
                      type: 'string',
                      title: 'String 2.1',
                    },
                    {
                      name: 'image',
                      type: 'image',
                      title: 'Image 2.1',
                      hidden: ({document}) => {
                        return Boolean(document?.hideFields)
                      },
                      description: DESCRIPTION,
                    },
                  ],
                },
                {
                  type: 'object',
                  name: 'nestedArrayObject2',
                  title: 'Nested array object 2',
                  fields: [
                    {
                      name: 'string',
                      type: 'string',
                      title: 'String 2.2',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
