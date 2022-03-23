export default {
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
    {
      fieldset: 'status',
      name: 'createdAt',
      title: 'Created at',
      type: 'string',
    },
    // Updated at
    {
      fieldset: 'status',
      name: 'updatedAt',
      title: 'Last updated at',
      type: 'string',
    },
    // Product status
    {
      fieldset: 'status',
      name: 'status',
      title: 'Product status',
      type: 'string',
      options: {
        layout: 'dropdown',
        list: ['active', 'archived', 'draft'],
      },
      validation: (Rule) => Rule.required(),
    },
    // Deleted
    {
      fieldset: 'status',
      name: 'isDeleted',
      title: 'Deleted from Shopify?',
      type: 'boolean',
    },
    // Title
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Title displayed in both cart and checkout',
      validation: (Rule) => Rule.required(),
    },
    // Product ID
    {
      name: 'id',
      title: 'ID',
      type: 'number',
      description: 'Shopify Product ID',
      validation: (Rule) => Rule.required(),
    },
    // Slug
    {
      title: 'Slug',
      description: 'Shopify Product handle',
      name: 'slug',
      type: 'slug',
    },
    // Product Type
    {
      fieldset: 'organization',
      name: 'productType',
      title: 'Product type',
      type: 'string',
    },
    // Tags
    {
      fieldset: 'organization',
      name: 'tags',
      title: 'Tags',
      type: 'string',
    },
    // Price range
    {
      name: 'priceRange',
      title: 'Price range',
      type: 'object',
      options: {
        columns: 2,
      },
      fields: [
        {
          name: 'minVariantPrice',
          title: 'Min variant price',
          type: 'number',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'maxVariantPrice',
          title: 'Max variant price',
          type: 'number',
          validation: (Rule) => Rule.required(),
        },
      ],
    },
    // Preview Image URL
    {
      name: 'previewImageUrl',
      title: 'Preview Image URL',
      type: 'string',
      description: 'Image displayed in both cart and checkout',
    },
    // Options
    {
      name: 'options',
      title: 'Options',
      type: 'array',
      of: [
        {
          name: 'option',
          title: 'Option',
          type: 'productOption',
        },
      ],
    },
    // Variants
    {
      fieldset: 'variants',
      name: 'variants',
      title: 'Variants',
      type: 'array',
      of: [
        {
          title: 'Variant',
          type: 'reference',
          weak: true,
          to: [{type: 'productVariant'}],
        },
      ],
    },
  ],
}
