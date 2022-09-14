import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'shopifyProduct',
  title: 'Shopify',
  type: 'object',
  options: {
    collapsed: true,
    collapsible: true,
  },
  readOnly: true,
  fieldsets: [
    {
      name: 'status',
      title: 'Status',
      options: {
        columns: 2,
      },
    },
    {
      name: 'organization',
      title: 'Organization',
      options: {
        columns: 2,
      },
    },
    {
      name: 'variants',
      title: 'Variants',
      options: {
        collapsed: true,
        collapsible: true,
      },
    },
  ],
  fields: [
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
      description: 'Title displayed in both cart and checkout',
      validation: (Rule) => Rule.required(),
    }),
    // Product ID
    defineField({
      name: 'id',
      title: 'ID',
      type: 'number',
      description: 'Shopify Product ID',
      validation: (Rule) => Rule.required(),
    }),
    // Slug
    defineField({
      title: 'Slug',
      description: 'Shopify Product handle',
      name: 'slug',
      type: 'slug',
    }),
    // Product Type
    defineField({
      fieldset: 'organization',
      name: 'productType',
      title: 'Product type',
      type: 'string',
    }),
    // Tags
    defineField({
      fieldset: 'organization',
      name: 'tags',
      title: 'Tags',
      type: 'string',
    }),
    // Price range
    defineField({
      name: 'priceRange',
      title: 'Price range',
      type: 'object',
      options: {
        columns: 2,
      },
      fields: [
        defineField({
          name: 'minVariantPrice',
          title: 'Min variant price',
          type: 'number',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'maxVariantPrice',
          title: 'Max variant price',
          type: 'number',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    // Preview Image URL
    defineField({
      name: 'previewImageUrl',
      title: 'Preview Image URL',
      type: 'string',
      description: 'Image displayed in both cart and checkout',
    }),
    // Options
    defineField({
      name: 'options',
      title: 'Options',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'option',
          title: 'Option',
          type: 'productOption',
        }),
      ],
    }),
    // Variants
    defineField({
      fieldset: 'variants',
      name: 'variants',
      title: 'Variants',
      type: 'array',
      of: [
        defineArrayMember({
          title: 'Variant',
          type: 'reference',
          weak: true,
          to: [{type: 'productVariant'}],
        }),
      ],
    }),
  ],
})
