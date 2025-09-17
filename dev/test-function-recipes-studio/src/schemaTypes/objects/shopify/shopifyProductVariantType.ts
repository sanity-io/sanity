import {defineField} from 'sanity'

export const shopifyProductVariantType = defineField({
  name: 'shopifyProductVariant',
  title: 'Shopify',
  type: 'object',
  options: {
    collapsed: false,
    collapsible: true,
  },
  fieldsets: [
    {
      name: 'options',
      title: 'Options',
      options: {
        columns: 3,
      },
    },
    {
      name: 'status',
      title: 'Status',
    },
  ],
  fields: [
    defineField({
      fieldset: 'status',
      name: 'createdAt',
      type: 'string',
    }),
    defineField({
      fieldset: 'status',
      name: 'updatedAt',
      type: 'string',
    }),
    defineField({
      fieldset: 'status',
      name: 'status',
      type: 'string',
      options: {
        layout: 'dropdown',
        list: ['active', 'archived', 'draft'],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      fieldset: 'status',
      name: 'isDeleted',
      title: 'Deleted from Shopify?',
      type: 'boolean',
    }),
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
    }),
    defineField({
      name: 'id',
      title: 'ID',
      type: 'number',
      description: 'Shopify Product Variant ID',
    }),
    defineField({
      name: 'gid',
      title: 'GID',
      type: 'string',
      description: 'Shopify Product Variant GID',
    }),
    defineField({
      name: 'productId',
      title: 'Product ID',
      type: 'number',
    }),
    defineField({
      name: 'productGid',
      title: 'Product GID',
      type: 'string',
    }),
    defineField({
      name: 'price',
      type: 'number',
    }),
    defineField({
      name: 'compareAtPrice',
      type: 'number',
    }),
    defineField({
      name: 'inventory',
      type: 'inventory',
      options: {
        columns: 3,
      },
    }),
    defineField({
      fieldset: 'options',
      name: 'option1',
      type: 'string',
    }),
    defineField({
      fieldset: 'options',
      name: 'option2',
      type: 'string',
    }),
    defineField({
      fieldset: 'options',
      name: 'option3',
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
