import {PackageIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import pluralize from 'pluralize-esm'

export default defineType({
  name: 'collection',
  title: 'Collection',
  type: 'document',
  icon: PackageIcon,
  fields: [
    // Title
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    // Slug
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
    // Description
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    // Image
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    // Products
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        defineArrayMember({
          title: 'Product',
          name: 'product',
          type: 'productWithVariant',
        }),
      ],
      validation: (Rule) => Rule.unique(),
    }),
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo.standard',
    }),
  ],
  preview: {
    select: {
      image: 'image',
      productCount: 'products.length',
      title: 'title',
    },
    prepare(selection) {
      const {image, productCount, title} = selection
      return {
        media: image,
        subtitle: productCount ? pluralize('product', productCount, true) : 'No products',
        title,
      }
    },
  },
})
