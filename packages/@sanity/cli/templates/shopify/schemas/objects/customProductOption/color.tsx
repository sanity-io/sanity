import pluralize from 'pluralize-esm'
import {defineField} from 'sanity'

interface ColorOption {
  title: string
}

export default defineField({
  name: 'customProductOption.color',
  title: 'Color',
  type: 'object',
  icon: false,
  fields: [
    // Title
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Shopify product option name (case sensitive)',
      validation: (Rule) => Rule.required(),
    }),
    // Colors
    defineField({
      name: 'colors',
      title: 'Colors',
      type: 'array',
      of: [
        {
          type: 'customProductOption.colorObject',
        },
      ],
      validation: (Rule) =>
        Rule.custom((options: ColorOption[] | undefined) => {
          // Each size must have a unique title
          if (options) {
            const uniqueTitles = new Set(options.map((option) => option?.title))
            if (options.length > uniqueTitles.size) {
              return 'Each product option must have a unique title'
            }
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      colors: 'colors',
      title: 'title',
    },
    prepare(selection) {
      const {colors, title} = selection
      return {
        subtitle: colors.length ? pluralize('color', colors.length, true) : 'No colors',
        title,
      }
    },
  },
})
