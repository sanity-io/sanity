import icon from 'part:@sanity/base/image-icon'
import petsAssetSource from '../src/assetSources/pets'
import noopAssetSource from '../src/assetSources/noop'

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
  icon,
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
      title: 'Image',
      type: 'image',
      description:
        'Image hotspot should be possible to change. Caption should be visible in image field, full description should be editable in modal',
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
        },
        {
          name: 'foo',
          type: 'string',
          title:
            'This is a rather longish title for a field. It should still work. This is a rather longish title for a field. It should still work.',
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
    {
      name: 'someFile',
      title: 'A simple file',
      type: 'file',
    },
    {
      name: 'fileWithFields',
      title: 'File with additional fields',
      type: 'file',
      fields: [
        {
          title: 'Description',
          name: 'description',
          type: 'string',
          options: {isHighlighted: true},
        },
        {
          title: 'Not so important',
          name: 'notsoimportant',
          type: 'string',
        },
      ],
    },
    {
      name: 'myImage',
      title: 'Field of custom image type',
      type: 'myImage',
      description: 'Should be like myImage',
      required: true,
    },
    {
      name: 'pngImage',
      title: 'PNG image',
      type: 'image',
      description: 'Should not accept other image types than png',
      options: {
        hotspot: true,
        accept: 'image/png',
      },
    },
    {
      name: 'jpegImageWithLqip',
      title: 'JPEG image',
      type: 'image',
      description: 'Should only accept JPEGs and will extract only LQIP and location metadata',
      options: {
        accept: 'image/jpeg',
        metadata: ['location', 'lqip'],
      },
    },
    {
      name: 'imageWithImage',
      title: 'Image with image',
      type: 'image',
      description: 'This is a weird example of an image that has an image as one of its fields',
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
        },
        {
          name: 'foo',
          type: 'string',
          title:
            'This is a rather longish title for a field. It should still work. This is a rather longish title for a field. It should still work.',
          options: {
            isHighlighted: true,
          },
        },
        {
          name: 'image',
          type: 'image',
          title: 'Image in image',
          options: {
            isHighlighted: true,
          },
        },
        {
          name: 'description',
          type: 'string',
          title: 'Full description',
        },
        {
          name: 'extraImage',
          type: 'image',
          title: 'Image in image behind edit',
        },
      ],
    },
    {
      name: 'customAssetSource',
      type: 'image',
      title: 'Custom asset source',
      options: {
        sources: [petsAssetSource, noopAssetSource],
      },
    },
    {
      name: 'noAssetSource',
      type: 'image',
      title: 'No asset source',
      options: {sources: []},
    },
  ],
}
