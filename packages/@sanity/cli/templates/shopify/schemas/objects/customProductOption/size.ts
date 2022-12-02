import pluralize from 'pluralize-esm'
import {defineField} from 'sanity'
interface SizeOption {
  title: string
}

export default defineField({
  name: 'customProductOption.size',
  title: 'Size',
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
    // Sizes
    defineField({
      name: 'sizes',
      title: 'Sizes',
      type: 'array',
      of: [
        {
          name: 'size',
          title: 'Size',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              description: 'Shopify product option value (case sensitive)',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'width',
              title: 'Width',
              type: 'number',
              description: 'In mm',
              validation: (Rule) => Rule.required().precision(2),
            }),
            defineField({
              name: 'height',
              title: 'Height',
              type: 'number',
              description: 'In mm',
              validation: (Rule) => Rule.required().precision(2),
            }),
          ],
          preview: {
            select: {
              height: 'height',
              title: 'title',
              width: 'width',
            },
            prepare(selection) {
              const {height, title, width} = selection
              return {
                subtitle: `${width || '??'}cm x ${height || '??'}cm`,
                title,
              }
            },
          },
        },
      ],
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
    prepare(selection) {
      const {sizes, title} = selection
      return {
        subtitle: sizes.length > 0 ? pluralize('size', sizes.length, true) : 'No sizes',
        title,
      }
    },
  },
})
