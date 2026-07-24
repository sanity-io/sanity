import {defineConfig, defineType, defineField} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Web shop',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'product',
        title: 'Product',
        type: 'document',
        groups: [
          {name: 'details', title: 'Details', default: true},
          {name: 'seo', title: 'SEO'},
        ],
        fields: [
          defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            group: 'details',
          }),
          defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            group: 'details',
          }),
          defineField({
            name: 'price',
            title: 'Price',
            type: 'number',
            group: 'details',
          }),
          defineField({
            name: 'seoTitle',
            title: 'SEO title',
            type: 'string',
            group: 'seo',
          }),
          defineField({
            name: 'seoDescription',
            title: 'SEO description',
            type: 'text',
            group: 'seo',
          }),
        ],
      }),
    ],
  },
})
