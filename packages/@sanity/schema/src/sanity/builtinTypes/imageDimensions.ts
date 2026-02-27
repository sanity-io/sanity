import {type Rule} from '@sanity/types'

export default {
  name: 'sanity.imageDimensions',
  type: 'object',
  title: 'Image dimensions',
  fields: [
    {
      name: 'height',
      type: 'number',
      title: 'Height',
      readOnly: true,
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      name: 'width',
      type: 'number',
      title: 'Width',
      readOnly: true,
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      name: 'aspectRatio',
      type: 'number',
      title: 'Aspect ratio',
      readOnly: true,
      validation: (Rule: Rule): Rule => Rule.required(),
    },
  ],
}
