import {defineField} from 'sanity'

export default defineField({
  name: 'customProductOption.sizeObject',
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
})
