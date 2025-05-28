import {defineArrayMember, defineField, defineType} from '@sanity/types'

export const pteCustomMarkersDocument = defineType({
  type: 'document',
  name: 'pte_customMarkers',
  fields: [
    defineField({
      name: 'content',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [
              {
                type: 'object',
                name: 'hyperlink',
                title: 'Hyperlink',
                fields: [{type: 'string', name: 'href', title: 'URL'}],
              },
            ],
            decorators: [
              {
                title: 'Boost',
                value: 'boost',
              },
            ],
          },
          styles: [
            {
              title: 'Normal',
              value: 'normal',
            },
          ],
        }),
      ],
    }),
  ],
})
