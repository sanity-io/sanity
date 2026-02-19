import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  title: 'Product variant',
  name: 'productVariant',
  type: 'object',
  fields: [
    defineField({
      title: 'Title',
      name: 'title',
      type: 'string',
    }),
    defineField({
      title: 'Weight in grams',
      name: 'grams',
      type: 'number',
    }),
    defineField({
      title: 'Price',
      name: 'price',
      type: 'number',
    }),
    defineField({
      title: 'SKU',
      name: 'sku',
      type: 'string',
    }),
    defineField({
      title: 'Taxable',
      name: 'taxable',
      type: 'boolean',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {
            hotspot: true,
          },
        }),
      ],
    }),
    defineField({
      title: 'Bar code',
      name: 'barcode',
      type: 'barcode',
    }),
  ],
})
