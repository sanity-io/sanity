import {type Rule} from '@sanity/types'

export default {
  title: 'Slug',
  name: 'slug',
  type: 'object',
  fields: [
    {
      name: 'current',
      title: 'Current slug',
      type: 'string',
      validation: (Rule: Rule): Rule => Rule.required(),
    },
    {
      // The source field is deprecated/unused, but leaving it included and hidden
      // to prevent rendering "Unknown field" warnings on legacy data
      name: 'source',
      title: 'Source field',
      type: 'string',
      hidden: true,
    },
  ],
}
