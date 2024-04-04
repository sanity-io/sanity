import {defineField} from 'sanity'

export const customProductOptionSizeObjectType = defineField({
  name: 'customProductOption.sizeObject',
  title: 'Size',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description: 'Shopify product option value (case sensitive)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'width',
      type: 'number',
      description: 'In mm',
      validation: (Rule) => Rule.required().precision(2),
    }),
    defineField({
      name: 'height',
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
    prepare({height, title, width}) {
      return {
        subtitle: `${width || '??'}mm x ${height || '??'}mm`,
        title,
      }
    },
  },
})
