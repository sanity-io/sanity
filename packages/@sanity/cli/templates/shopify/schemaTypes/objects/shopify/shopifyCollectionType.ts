import {defineField} from 'sanity'

export const shopifyCollectionType = defineField({
  name: 'shopifyCollection',
  title: 'Shopify',
  type: 'object',
  options: {
    collapsed: false,
    collapsible: true,
  },
  readOnly: true,
  fieldsets: [
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
      name: 'isDeleted',
      title: 'Deleted from Shopify?',
      type: 'boolean',
    }),
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'id',
      title: 'ID',
      type: 'number',
      description: 'Shopify Collection ID',
    }),
    defineField({
      name: 'gid',
      title: 'GID',
      type: 'string',
      description: 'Shopify Collection GID',
    }),
    defineField({
      name: 'slug',
      description: 'Shopify Collection handle',
      type: 'slug',
    }),
    defineField({
      name: 'descriptionHtml',
      title: 'HTML Description',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'imageUrl',
      title: 'Image URL',
      type: 'string',
    }),
    defineField({
      name: 'rules',
      type: 'array',
      description: 'Include Shopify products that satisfy these conditions',
      of: [{type: 'collectionRule'},
      ],
    }),
    defineField({
      name: 'disjunctive',
      title: 'Disjunctive rules?',
      description: 'Require any condition if true, otherwise require all conditions',
      type: 'boolean',
    }),
    defineField({
      name: 'sortOrder',
      type: 'string',
    }),
  ],
})
