import {ImageIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'blockImage',
  title: 'Image',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'fullWidth',
      title: 'Full width',
      type: 'boolean',
    }),
  ],
  preview: {
    select: {
      image: 'image',
    },
    prepare(selection) {
      const {image} = selection
      return {
        media: image,
        title: 'Image',
      }
    },
  },
})
