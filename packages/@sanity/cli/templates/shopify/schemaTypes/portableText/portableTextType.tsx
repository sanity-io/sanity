import {defineArrayMember, defineField} from 'sanity'

export const portableTextType = defineField({
  name: 'portableText',
  type: 'array',
  of: [
    defineArrayMember({
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {
            title: 'Italic',
            value: 'em',
          },
          {
            title: 'Strong',
            value: 'strong',
          },
        ],
        annotations: [
          {
            name: 'linkProduct',
            type: 'linkProduct',
          },
          {
            name: 'linkEmail',
            type: 'linkEmail',
          },
          {
            name: 'linkInternal',
            type: 'linkInternal',
          },
          {
            name: 'linkExternal',
            type: 'linkExternal',
          },
        ],
      },
      type: 'block',
    }),
    defineArrayMember({ type: 'accordion' }),
    defineArrayMember({ type: 'callout' }),
    defineArrayMember({ type: 'grid' }),
    defineArrayMember({ type: 'images' }),
    defineArrayMember({ type: 'imageWithProductHotspots', title: 'Image with Hotspots' }),
    defineArrayMember({ type: 'instagram' }),
    defineArrayMember({ type: 'products' }),
  ],
})
