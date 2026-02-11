import {type Rule} from '@sanity/types'

export default {
  name: 'sanity.imageCrop',
  title: 'Image crop',
  type: 'object',
  fields: [
    {
      name: 'top',
      type: 'number',
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      name: 'bottom',
      type: 'number',
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      name: 'left',
      type: 'number',
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      name: 'right',
      type: 'number',
      validation: (Rule: Rule): Rule => Rule.required(),
    },
  ],
}
