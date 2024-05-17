import pluralize from 'pluralize-esm'
import {defineField} from 'sanity'

interface SizeOption {
  title: string
}

export const customProductOptionSizeType = defineField({
  name: 'customProductOption.size',
  title: 'Size',
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
      name: 'sizes',
      type: 'array',
      of: [{type: 'customProductOption.sizeObject'}],
      validation: (Rule) =>
        Rule.custom((options: SizeOption[] | undefined) => {
          // Each size must have a unique title
          if (options) {
            const uniqueTitles = new Set(options.map((option) => option.title))
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
      sizes: 'sizes',
      title: 'title',
    },
    prepare({sizes, title}) {
      return {
        subtitle: sizes.length > 0 ? pluralize('size', sizes.length, true) : 'No sizes',
        title,
      }
    },
  },
})
