import {ImagesIcon} from '@sanity/icons'
import {defineType} from 'sanity'
// import petsAssetSource from '../../parts/assetSources/pets'
// import noopAssetSource from '../../parts/assetSources/noop'

export const myImage = defineType({
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
})

export default defineType({
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
      description:
        'Image hotspot should be possible to change. Caption should be visible in image field, full description should be editable in modal',
      options: {
        hotspot: true,
      },
      fieldsets: [
        {name: 'details', title: 'Details', options: {collapsible: true, collapsed: true}},
      ],
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
        },
        {
          name: 'detailedCaption',
          type: 'string',
          title: 'Detailed caption',
          fieldset: 'details',
          hidden: ({parent}) => !parent?.caption,
        },
        {
          name: 'foo',
          type: 'string',
          title:
            'This is a rather longish title for a field. It should still work. This is a rather longish title for a field. It should still work.',
          fieldset: 'details',
        },
        {
          name: 'description',
          type: 'string',
          fieldset: 'details',
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
      name: 'imageWithAdditionalFields',
      title: 'Image with additional fields',
      type: 'image',
      fieldsets: [
        {
          name: 'less-important',
          title: 'Less important fields',
          options: {collapsible: true, collapsed: true},
        },
      ],
      fields: [
        {
          title: 'Description',
          name: 'description',
          type: 'string',
        },
        {
          title: 'Less important',
          name: 'lessImportant',
          type: 'string',
          fieldset: 'less-important',
        },
        {
          title: 'Less important too',
          name: 'lessImportant2',
          type: 'string',
          fieldset: 'less-important',
        },
      ],
    },
    {
      name: 'myImage',
      title: 'Field of custom image type',
      type: 'myImage',
      description: 'Should be like myImage',
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
      name: 'ImageWithTwoAccept',
      title: 'JPEG & PNG image',
      type: 'image',
      description: 'Both!',
      options: {
        accept: 'image/png, image/jpeg',
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
          title: 'Image field in image',
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
        // sources: [petsAssetSource, noopAssetSource],
      },
    },
    {
      name: 'noAssetSource',
      type: 'image',
      title: 'No asset source',
      options: {sources: []},
    },
  ],
})
