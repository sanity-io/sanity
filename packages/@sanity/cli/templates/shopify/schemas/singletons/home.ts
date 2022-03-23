import {HomeIcon} from '@sanity/icons'
import {getPriceRange} from '../../utils/getPriceRange'

const TITLE = 'Home'

export default {
  name: 'home',
  title: TITLE,
  type: 'document',
  icon: HomeIcon,
  fields: [
    // Intro
    {
      name: 'intro',
      title: 'Intro',
      type: 'body',
    },
    // Featured collections
    {
      name: 'featuredCollections',
      title: 'Featured collections',
      type: 'array',
      of: [
        {
          title: 'Collection',
          type: 'reference',
          to: [{type: 'collection'}],
        },
      ],
      validation: (Rule) => Rule.max(2).unique(),
    },
    // Gallery
    {
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [
        {
          name: 'galleryProduct',
          type: 'object',
          fields: [
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'productWithVariant',
              title: 'Product + Variant',
              type: 'productWithVariant',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'title',
              title: 'Title',
              type: 'string',
            },
          ],
          preview: {
            select: {
              defaultVariantTitle: 'productWithVariant.product.store.variants.0.store.title',
              image: 'image',
              isDeleted: 'productWithVariant.product.store.isDeleted',
              priceRange: 'productWithVariant.product.store.priceRange',
              status: 'productWithVariant.product.store.status',
              title: 'productWithVariant.product.store.title',
              variantTitle: 'productWithVariant.variant.store.title',
            },
            // TODO: DRY with `objects/productWithVariant`
            prepare(selection) {
              const {
                defaultVariantTitle,
                image,
                isDeleted,
                priceRange,
                status,
                title,
                variantTitle,
              } = selection
              const productVariantTitle = variantTitle || defaultVariantTitle

              let previewTitle = [title]
              if (productVariantTitle) {
                previewTitle.push(`[${productVariantTitle}]`)
              }

              let subtitle = getPriceRange(priceRange)
              if (status !== 'active') {
                subtitle = '(Unavailable in Shopify)'
              }
              if (isDeleted) {
                subtitle = '(Deleted from Shopify)'
              }

              return {
                media: image,
                subtitle,
                title: previewTitle.join(' '),
              }
            },
          },
        },
      ],
    },
    // Featured products
    {
      name: 'featuredProducts',
      title: 'Featured products',
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
      type: 'seo.singleton',
    },
  ],
  preview: {
    prepare() {
      return {
        // media: icon,
        subtitle: 'Index',
        title: TITLE,
      }
    },
  },
}
