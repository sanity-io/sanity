import {BellIcon, ImageIcon, InfoOutlineIcon} from '@sanity/icons'
import {InfoBoxPreview} from './InfoBoxPreview'

export const ptAllTheBellsAndWhistlesType = {
  type: 'document',
  icon: BellIcon,
  name: 'pt_allTheBellsAndWhistles',
  title: 'All the bells & whistles',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
    {
      type: 'array',
      name: 'text',
      title: 'Text',
      of: [
        {
          type: 'block',
          name: 'block',
          title: 'Block',
          // styles: [{title: 'Normal', value: 'normal'}],
          // marks: {
          //   decorators: [{title: 'Strong', value: 'strong'}],
          //   annotations: []
          // },
        },

        {
          type: 'image',
          icon: ImageIcon,
          name: 'image',
          title: 'Image',
          options: {
            hotspot: true,
          },
          preview: {
            select: {
              imageUrl: 'asset.url',
              title: 'caption',
            },
          },
          fields: [
            {
              title: 'Caption',
              name: 'caption',
              type: 'string',
              options: {
                isHighlighted: true,
              },
            },
            {
              name: 'alt',
              type: 'string',
              title: 'Alt text',
              description: 'Alternative text for screenreaders. Falls back on caption if not set',
              options: {
                isHighlighted: true,
              },
            },
            {
              title: 'Enable lightbox',
              description:
                '❓ Optional. The default behavior is to enable it if image is large enough to benefit from it.',
              name: 'enableLightbox',
              type: 'boolean',
              options: {
                isHighlighted: true,
              },
            },
            {
              title: 'Icon',
              name: 'isIcon',
              type: 'boolean',
              options: {
                isHighlighted: true,
              },
            },
            {
              title: 'Disable shadow',
              description: 'Not implemented in most surfaces.',
              name: 'disableShadow',
              type: 'boolean',
              options: {
                isHighlighted: true,
              },
            },
            {
              title: 'Large',
              description: 'Not implemented in most surfaces.',
              name: 'isLarge',
              type: 'boolean',
              options: {
                isHighlighted: true,
              },
            },
          ],
        },

        {
          name: 'infoBox',
          icon: InfoOutlineIcon,
          title: 'Info Box',
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required().warning('Should have a title'),
            },
            {
              title: 'Box Content',
              name: 'body',
              type: 'array',
              of: [{type: 'block'}],
              validation: (Rule) => Rule.required().error('Must have content'),
            },
          ],
          preview: {
            select: {
              title: 'title',
              body: 'body',
            },
            prepare(selection) {
              return selection
            },
            component: InfoBoxPreview,
          },
        },
      ],
    },
  ],
}
