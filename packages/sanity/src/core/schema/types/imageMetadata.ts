import {type Rule} from '@sanity/types'

export default {
  name: 'sanity.imageMetadata',
  title: 'Image metadata',
  type: 'object',
  fieldsets: [
    {
      name: 'extra',
      title: 'Extra metadata…',
      options: {
        collapsable: true,
      },
    },
  ],
  fields: [
    {
      name: 'location',
      type: 'geopoint',
    },
    {
      name: 'dimensions',
      title: 'Dimensions',
      type: 'sanity.imageDimensions',
      fieldset: 'extra',
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      name: 'palette',
      type: 'sanity.imagePalette',
      title: 'Palette',
      fieldset: 'extra',
    },
    {
      name: 'lqip',
      title: 'LQIP (Low-Quality Image Placeholder)',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'blurHash',
      title: 'BlurHash',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'hasAlpha',
      title: 'Has alpha channel',
      type: 'boolean',
      readOnly: true,
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      name: 'isOpaque',
      title: 'Is opaque',
      type: 'boolean',
      readOnly: true,
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    /**
     * Added in 2024, so not "required" because of backwards compatibility
     */
    {
      name: 'isAnimated',
      title: 'Is animated',
      type: 'boolean',
      readOnly: true,
    },
  ],
}
