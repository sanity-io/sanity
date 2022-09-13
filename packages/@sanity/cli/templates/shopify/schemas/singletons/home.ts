import {HomeIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {getPriceRange} from '../../utils/getPriceRange'

const TITLE = 'Home'

export default defineType({
  name: 'home',
  title: TITLE,
  type: 'document',
  icon: HomeIcon,
  fields: [
    // Intro
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'body',
    }),
    // Featured collections
    defineField({
      name: 'featuredCollections',
      title: 'Featured collections',
      type: 'array',
      of: [
        defineArrayMember({
          title: 'Collection',
          type: 'reference',
          to: [{type: 'collection'}],
        }),
      ],
      validation: (Rule) => Rule.max(2).unique(),
    }),
    // Gallery
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'galleryProduct',
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'productWithVariant',
              title: 'Product + Variant',
              type: 'productWithVariant',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
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

              let previewTitle: string[] = [title]
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
        }),
      ],
    }),
    // Featured products
    defineField({
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
    }),
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo.singleton',
    }),
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
})
