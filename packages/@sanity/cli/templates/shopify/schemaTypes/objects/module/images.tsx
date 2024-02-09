import {ImageIcon} from '@sanity/icons'
import pluralize from 'pluralize-esm'
import {defineField} from 'sanity'

export default defineField({
  name: 'module.images',
  title: 'Images',
  type: 'object',
  icon: ImageIcon,
  fields: [
    // Modules (Images)
    defineField({
      name: 'modules',
      title: 'Images',
      type: 'array',
      of: [{type: 'module.image'}],
      validation: (Rule) => Rule.required().max(2),
    }),
    // Full width
    defineField({
      name: 'fullWidth',
      title: 'Full width',
      type: 'boolean',
      description: 'Display single image at full width (on larger breakpoints)',
      initialValue: false,
      hidden: ({parent}) => parent?.modules?.length > 1,
    }),
    // Vertical alignment
    defineField({
      name: 'verticalAlign',
      title: 'Vertical alignment',
      type: 'string',
      initialValue: 'top',
      options: {
        direction: 'horizontal',
        layout: 'radio',
        list: [
          {
            title: 'Top',
            value: 'top',
          },
          {
            title: 'Center',
            value: 'center',
          },
          {
            title: 'Bottom',
            value: 'bottom',
          },
        ],
      },
      hidden: ({parent}) => !parent?.modules || parent?.modules?.length < 2,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      images: 'modules',
    },
    prepare(selection) {
      const {images} = selection
      return {
        subtitle: 'Images',
        title: images?.length > 0 ? pluralize('image', images.length, true) : 'No images',
        media: ImageIcon,
      }
    },
  },
})
