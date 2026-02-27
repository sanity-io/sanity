import {type Rule} from '@sanity/types'

export default {
  name: 'sanity.imageHotspot',
  title: 'Image hotspot',
  type: 'object',
  fields: [
    {
      name: 'x',
      type: 'number',
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      name: 'y',
      type: 'number',
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      name: 'height',
      type: 'number',
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      name: 'width',
      type: 'number',
      validation: (Rule: Rule): Rule => Rule.required(),
    },
  ],
}
