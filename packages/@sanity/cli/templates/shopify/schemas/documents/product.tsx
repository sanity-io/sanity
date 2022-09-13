import {TagIcon} from '@sanity/icons'
import pluralize from 'pluralize-esm'
import React from 'react'
import {defineArrayMember, defineField, defineType} from 'sanity'
import ProductHiddenInput from '../../components/inputs/ProductHidden'
import ProductStatusMedia from '../../components/media/ProductStatus'
import {getPriceRange} from '../../utils/getPriceRange'

export default defineType({
  // HACK: Required to hide 'create new' button in desk structure
  __experimental_actions: [/*'create',*/ 'update', /*'delete',*/ 'publish'],
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: TagIcon,
  fields: [
    // Product hidden status
    defineField({
      name: 'hidden',
      type: 'string',
      components: {input: ProductHiddenInput},
      hidden: ({parent}) => {
        const isActive = parent?.store?.status === 'active'
        const isDeleted = parent?.store?.isDeleted

        return isActive && !isDeleted
      },
    }),
    // Title (proxy)
    defineField({
      title: 'Title',
      name: 'titleProxy',
      type: 'proxyString',
      options: {field: 'store.title'},
    }),
    // Slug (proxy)
    defineField({
      title: 'Slug',
      name: 'slugProxy',
      type: 'proxyString',
      options: {field: 'store.slug.current'},
    }),
    // Images
    defineField({
      title: 'Images',
      name: 'images',
      type: 'array',
      options: {layout: 'grid'},
      of: [
        defineArrayMember({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: {hotspot: true},
        }),
      ],
    }),
    // Sections
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'section',
          title: 'Section',
          type: 'object',
          fields: [
            // Title
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            // Body
            defineField({
              name: 'body',
              title: 'Body',
              type: 'array',
              of: [
                defineArrayMember({
                  lists: [],
                  marks: {decorators: []},
                  styles: [],
                  type: 'block',
                }),
              ],
            }),
          ],
        }),
      ],
      validation: (Rule) => Rule.max(3),
    }),
    // Body
    defineField({
      name: 'body',
      title: 'Body',
      type: 'body',
    }),
    // Shopify product
    defineField({
      name: 'store',
      title: 'Shopify',
      type: 'shopifyProduct',
      description: 'Product data from Shopify (read-only)',
    }),
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo.product',
    }),
  ],
  orderings: [
    {
      title: 'Title (A-Z)',
      name: 'titleAsc',
      by: [{field: 'store.title', direction: 'asc'}],
    },
    {
      title: 'Title (Z-A)',
      name: 'titleAsc',
      by: [{field: 'store.title', direction: 'desc'}],
    },
    {
      title: 'Price (Highest first)',
      name: 'titleAsc',
      by: [{field: 'store.priceRange.minVariantPrice', direction: 'desc'}],
    },
    {
      title: 'Title (Lowest first)',
      name: 'titleAsc',
      by: [{field: 'store.priceRange.minVariantPrice', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      isDeleted: 'store.isDeleted',
      optionCount: 'store.options.length',
      previewImageUrl: 'store.previewImageUrl',
      priceRange: 'store.priceRange',
      status: 'store.status',
      title: 'store.title',
      variantCount: 'store.variants.length',
    },
    prepare(selection) {
      const {isDeleted, optionCount, previewImageUrl, priceRange, status, title, variantCount} =
        selection

      let description = [
        variantCount ? pluralize('variant', variantCount, true) : 'No variants',
        optionCount ? pluralize('option', optionCount, true) : 'No options',
      ]

      let subtitle = getPriceRange(priceRange)
      if (status !== 'active') {
        subtitle = '(Unavailable in Shopify)'
      }
      if (isDeleted) {
        subtitle = '(Deleted from Shopify)'
      }

      return {
        media: (
          <ProductStatusMedia
            isActive={status === 'active'}
            isDeleted={isDeleted}
            type="product"
            url={previewImageUrl}
          />
        ),
        description: description.join(' / '),
        subtitle,
        title,
      }
    },
  },
})
