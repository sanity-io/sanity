import React from 'react'
import {TagIcon} from '@sanity/icons'
import {getPriceRange} from '../../utils/getPriceRange'

const ImagePreview = (props: {url: string}) => {
  const {url} = props
  if (!url) {
    return null
  }

  return <img src={`${url}&width=400`} />
}

export default {
  name: 'blockProduct',
  title: 'Product',
  type: 'object',
  icon: TagIcon,
  fields: [
    // Product
    {
      name: 'productWithVariant',
      title: 'Product + Variant',
      type: 'productWithVariant',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
  ],
  preview: {
    select: {
      defaultVariantTitle: 'productWithVariant.product.store.variants.0.store.title',
      isDeleted: 'productWithVariant.product.store.isDeleted',
      previewImageUrl: 'productWithVariant.product.store.previewImageUrl',
      priceRange: 'productWithVariant.product.store.priceRange',
      status: 'productWithVariant.product.store.status',
      title: 'productWithVariant.product.store.title',
      variantPreviewImageUrl: 'productWithVariant.variant.store.previewImageUrl',
      variantTitle: 'productWithVariant.variant.store.title',
    },
    // TODO: DRY with `objects/productWithVariant`
    prepare(selection) {
      const {
        defaultVariantTitle,
        isDeleted,
        priceRange,
        previewImageUrl,
        status,
        title,
        variantPreviewImageUrl,
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
        media: <ImagePreview url={variantPreviewImageUrl || previewImageUrl} />,
        // TODO: re-enable when subtitles in PTE look a little nicer
        // subtitle,
        title: previewTitle.join(' '),
      }
    },
  },
}
