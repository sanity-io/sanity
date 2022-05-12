import {ImagesIcon} from '@sanity/icons'
import petsAssetSource from '../../parts/assetSources/pets'
import noopAssetSource from '../../parts/assetSources/noop'

export const myImage = {
  name: 'myImage',
  title: 'Some image type',
  type: 'image',
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
  ],
}

export default {
  name: 'imagesTest',
  type: 'document',
  title: 'Images test',
  icon: ImagesIcon,
  description: 'Different test cases of image fields',
  // readOnly: true,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
          options: {
            isHighlighted: true,
          },
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'foo',
          type: 'string',
          title: 'Alternative text',
          description: 'Important for SEO and accessibility.',
          options: {
            isHighlighted: true,
          },
        },
        {
          name: 'description',
          type: 'string',
          title: 'Full description',
        },
      ],
    },
  ],
}
