import {ImageIcon} from '@sanity/icons'

export default {
  name: 'blockImage',
  title: 'Image',
  type: 'object',
  icon: ImageIcon,
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'fullWidth',
      title: 'Full width',
      type: 'boolean',
    },
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
}
