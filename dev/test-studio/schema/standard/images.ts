import {ImagesIcon} from '@sanity/icons/Images'
import {defineField, defineType} from 'sanity'
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
      description:
        'Should not accept other image types than png. Selecting a non-png from the Media Library shows a warning.',
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
    {
      name: 'hotspotImage',
      title: 'Hotspot image',
      type: 'image',
      description: 'Should have custom hotspot preview aspect ratios',
      options: {
        hotspot: {
          previews: [
            {title: '2:1', aspectRatio: 2 / 1},
            {title: '4:5', aspectRatio: 4 / 5},
            {title: '9:16', aspectRatio: 9 / 16},
          ],
        },
      },
    },
    {
      name: 'fixedAspectRatioImage',
      title: 'Fixed 16:9 image with minimum size',
      type: 'image',
      description:
        'Upload a portrait image or one smaller than 800 × 450 px and see the aspect ratio and minimum size errors.',
      options: {
        hotspot: true,
        aspectRatio: 16 / 9,
        minDimensions: {width: 800, height: 450},
      },
    },
    {
      name: 'aspectRatioRangeImage',
      title: '4:3 to 16:9 image with recommended size',
      type: 'image',
      description:
        'Upload a square image to see the aspect ratio error, or one smaller than 1600 × 900 px to see the recommended size warning.',
      options: {
        hotspot: true,
        aspectRatio: {min: 4 / 3, max: 16 / 9},
        recommendedDimensions: {width: 1600, height: 900},
      },
    },
    {
      name: 'snapAspectRatioImage',
      title: '1:1, 4:3 or 16:9 image',
      type: 'image',
      description:
        'Upload a 3:2 image, or crop to a ratio between the listed ones, and see the aspect ratio error.',
      options: {
        hotspot: true,
        aspectRatio: [1, 4 / 3, 16 / 9],
      },
    },
    {
      name: 'imageWithMediaLibraryFilters',
      title: 'Image with Media Library filter',
      type: 'image',
      description: 'Should have custom Media Library filters',
      options: {
        mediaLibrary: {
          filters: [
            // {
            //   name: 'Has colourDetails aspect',
            //   query: 'defined(aspects.colourDetails)',
            // },
            {
              name: 'Greater than 4000px wide',
              query: 'currentVersion->metadata.dimensions.width > 4000',
            },
          ],
        },
      },
    },
    defineField({
      name: 'imageWithDisabledUpload',
      title: 'Image with disabled upload',
      type: 'image',
      description:
        'Can only select existing assets from the media library, direct upload is disabled',
      options: {
        disableNew: true,
        hotspot: true,
      },
    }),
    defineField({
      name: 'arrayOfImagesWithDisabledUpload',
      title: 'Array of images (upload disabled)',
      description: 'disableNew is true for all images in the array',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            disableNew: true,
            hotspot: true,
          },
        },
      ],
    }),
    defineField({
      name: 'arrayOfImagesWithEnabledUpload',
      title: 'Array of images (upload enabled)',
      type: 'array',
      of: [{type: 'image'}],
    }),
  ],
})
