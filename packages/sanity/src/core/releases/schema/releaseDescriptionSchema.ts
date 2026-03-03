import {defineArrayMember, defineField} from '@sanity/types'

export const releaseDescriptionSchema = defineField({
  name: 'releaseDescription',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [],
      lists: [],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Underline', value: 'underline'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
              },
            ],
          },
        ],
      },
      of: [
        defineField({
          type: 'object',
          name: 'releaseReference',
          title: 'Release Reference',
          fields: [
            defineField({
              name: 'releaseId',
              type: 'string',
              title: 'Release ID',
            }),
          ],
        }),
      ],
    }),
  ],
})
