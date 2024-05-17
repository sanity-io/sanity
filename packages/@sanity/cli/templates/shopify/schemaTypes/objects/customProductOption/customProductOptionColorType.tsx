import pluralize from 'pluralize-esm'
import {defineField} from 'sanity'

interface ColorOption {
  title: string
}

export const customProductOptionColorType = defineField({
  name: 'customProductOption.color',
  title: 'Color',
  type: 'object',
  icon: false,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description: 'Shopify product option name (case sensitive)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'colors',
      type: 'array',
      of: [{type: 'customProductOption.colorObject'}],
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
