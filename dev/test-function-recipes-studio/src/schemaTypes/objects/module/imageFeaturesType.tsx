import {ImageIcon} from '@sanity/icons'
import pluralize from 'pluralize-esm'
import {defineField} from 'sanity'

export const imageFeaturesType = defineField({
  name: 'images',
  title: 'Images',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'imageFeatures',
      title: 'Images',
      type: 'array',
      of: [{type: 'imageFeature'}],
      validation: (Rule) => Rule.required().max(2),
    }),
    defineField({
      name: 'fullWidth',
      type: 'boolean',
      description: 'Display single image at full width (on larger breakpoints)',
      initialValue: false,
      hidden: ({parent}) => parent?.modules?.length > 1,
    }),
    defineField({
      name: 'verticalAlign',
      title: 'Vertical alignment',
      type: 'string',
      initialValue: 'top',
      options: {
        direction: 'horizontal',
        layout: 'radio',
        list: ['top', 'center', 'bottom'],
      },
      hidden: ({parent}) => !parent?.modules || parent?.modules?.length < 2,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      images: 'imageFeatures',
    },
    prepare({images}) {
      return {
        subtitle: 'Images',
        title: images?.length > 0 ? pluralize('image', images.length, true) : 'No images',
        media: ImageIcon,
      }
    },
  },
})
