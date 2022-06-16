import {PackageIcon} from '@sanity/icons'
import pluralize from 'pluralize-esm'

export default {
  name: 'collection',
  title: 'Collection',
  type: 'document',
  icon: PackageIcon,
  fields: [
    // Title
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    // Slug
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    },
    // Description
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    },
    // Image
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    },
    // Products
    {
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        {
          title: 'Product',
          name: 'product',
          type: 'productWithVariant',
        },
      ],
      validation: (Rule) => Rule.unique(),
    },
    // SEO
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo.standard',
    },
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
}
