import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'shopifyProductVariant',
  title: 'Shopify',
  type: 'object',
  options: {
    collapsed: true,
    collapsible: true,
  },
  fieldsets: [
    {
      name: 'status',
      title: 'Status',
      options: {
        columns: 2,
      },
    },
    {
      name: 'options',
      title: 'Options',
      options: {
        columns: 3,
      },
    },
  ],
  fields: [
    /*
    // In stock
    defineField({
      name: 'inStock',
      title: 'In stock',
      type: 'boolean',
    }),
    */
    // Created at
    defineField({
      fieldset: 'status',
      name: 'createdAt',
      title: 'Created at',
      type: 'string',
    }),
    // Updated at
    defineField({
      fieldset: 'status',
      name: 'updatedAt',
      title: 'Last updated at',
      type: 'string',
    }),
    // Product status
    defineField({
      fieldset: 'status',
      name: 'status',
      title: 'Product status',
      type: 'string',
      options: {
        layout: 'dropdown',
        list: ['active', 'archived', 'draft'],
      },
      validation: (Rule) => Rule.required(),
    }),
    // Deleted
    defineField({
      fieldset: 'status',
      name: 'isDeleted',
      title: 'Deleted from Shopify?',
      type: 'boolean',
    }),
    // Title
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    // SKU
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
    }),
    // ID
    defineField({
      name: 'id',
      title: 'ID',
      type: 'number',
    }),
    // Product ID
    defineField({
      name: 'productId',
      title: 'Product ID',
      type: 'number',
    }),
    // Price
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
    }),
    // Compare at price
    defineField({
      name: 'compareAtPrice',
      title: 'Compare at price',
      type: 'number',
    }),
    // Option 1
    defineField({
      fieldset: 'options',
      name: 'option1',
      title: 'Option 1',
      type: 'string',
    }),
    // Option 2
    defineField({
      fieldset: 'options',
      name: 'option2',
      title: 'Option 2',
      type: 'string',
    }),
    // Option 3
    defineField({
      fieldset: 'options',
      name: 'option3',
      title: 'Option 3',
      type: 'string',
    }),
    // Preview Image URL
    defineField({
      name: 'previewImageUrl',
      title: 'Preview Image URL',
      type: 'string',
      description: 'Image displayed in both cart and checkout',
    }),
  ],
  readOnly: true,
})
